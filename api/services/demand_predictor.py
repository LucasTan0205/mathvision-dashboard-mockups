"""
Demand Predictor Service — Prophet-based volume forecasting for MathVision.

Pipeline:
1. Load historical sessions (CSV + SQLite), merge & deduplicate
2. Aggregate daily session counts per (time_slot) series
3. Fit a Prophet model per time_slot (morning / afternoon / evening)
4. Forecast the next 7 days of session volume
5. Identify peak periods and generate ramp-up recommendations
6. Fall back to recency-weighted heatmap if Prophet is unavailable
"""

import csv
import logging
import os
import sqlite3
from datetime import date, datetime, timedelta
from math import ceil

from api.models import (
    DemandCell,
    DemandPredictionResponse,
    RampUpRecommendation,
    SessionRecord,
)

logger = logging.getLogger(__name__)

# ── Model cache — fitted once per process, keyed by (branch, slot) ──
_model_cache: dict[tuple[str | None, str], object] = {}
_cache_built_at: datetime | None = None
_CACHE_TTL_HOURS = 6  # re-fit after 6 hours

# ── Constants ─────────────────────────────────────────────────────

DAY_LABELS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
TIME_SLOTS = ["morning", "afternoon", "evening"]

_HERE      = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))

_CSV_PATH      = os.path.join(_REPO_ROOT, "analytics-engine", "data", "raw", "pairings_raw.csv")
_STUDENTS_PATH = os.path.join(_REPO_ROOT, "analytics-engine", "data", "raw", "students.csv")
_DEFAULT_DB    = os.path.join(_REPO_ROOT, "analytics-engine", "data", "pairing_store.db")
_DB_PATH       = os.environ.get("DB_PATH", _DEFAULT_DB)

_TIME_SLOT_MAP = {0: "morning", 1: "afternoon", 2: "evening"}


# ── Session loading ───────────────────────────────────────────────

def load_csv_sessions(csv_path: str = _CSV_PATH) -> list[SessionRecord]:
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    records: list[SessionRecord] = []
    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            pairing_id = row.get("pairing_id", "").strip()
            raw_date   = row.get("session_date", "").strip()
            try:
                session_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                logger.warning("Skipping %s: bad session_date '%s'", pairing_id, raw_date)
                continue

            raw_dur = row.get("duration_hours", "").strip()
            try:
                duration_hours = float(raw_dur)
            except (ValueError, TypeError):
                logger.warning("Skipping %s: bad duration_hours '%s'", pairing_id, raw_dur)
                continue

            # Use explicit time_slot column if present, else derive from pairing_id hash
            raw_slot = row.get("time_slot", "").strip()
            if raw_slot in TIME_SLOTS:
                time_slot = raw_slot
            else:
                time_slot = _TIME_SLOT_MAP[hash(pairing_id) % 3]

            records.append(SessionRecord(
                pairing_id=pairing_id,
                student_id=row.get("student_id", "").strip(),
                tutor_id=row.get("tutor_id", "").strip(),
                session_date=session_date,
                duration_hours=duration_hours,
                day_of_week=session_date.weekday(),
                time_slot=time_slot,
            ))
    return records


def load_db_sessions(db_path: str = _DB_PATH) -> list[SessionRecord]:
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT pairing_id, student_id, tutor_id, time_slot, matched_at FROM pairings"
        ).fetchall()
        conn.close()
    except sqlite3.Error as exc:
        raise RuntimeError(f"DB error: {exc}") from exc

    records: list[SessionRecord] = []
    for row in rows:
        try:
            session_date = datetime.fromisoformat(row["matched_at"]).date()
        except (ValueError, TypeError):
            logger.warning("Skipping DB row %s: bad matched_at", row["pairing_id"])
            continue

        raw_slot  = row["time_slot"]
        time_slot = _parse_db_time_slot(raw_slot)

        records.append(SessionRecord(
            pairing_id=row["pairing_id"],
            student_id=row["student_id"],
            tutor_id=row["tutor_id"],
            session_date=session_date,
            duration_hours=1.0,
            day_of_week=session_date.weekday(),
            time_slot=time_slot,
        ))
    return records


def _parse_db_time_slot(raw_slot: str) -> str:
    try:
        hour = int(raw_slot.split("_", 1)[1].split(":")[0])
    except (IndexError, ValueError):
        return "morning"
    if hour < 12:
        return "morning"
    elif hour < 18:
        return "afternoon"
    return "evening"


def merge_sessions(
    csv_sessions: list[SessionRecord],
    db_sessions: list[SessionRecord],
) -> list[SessionRecord]:
    merged: dict[str, SessionRecord] = {s.pairing_id: s for s in csv_sessions}
    for s in db_sessions:
        merged[s.pairing_id] = s
    return list(merged.values())


def load_student_branches(csv_path: str = _STUDENTS_PATH) -> dict[str, str]:
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"Students CSV not found: {csv_path}")
    branch_map: dict[str, str] = {}
    with open(csv_path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            sid    = row.get("student_id", "").strip()
            branch = row.get("branch", "").strip()
            if sid and branch:
                branch_map[sid] = branch
    return branch_map


# ── Prophet forecasting ───────────────────────────────────────────

def _build_daily_series(
    sessions: list[SessionRecord],
    time_slot: str,
    branch_map: dict[str, str],
    branch_filter: str | None,
) -> "pd.DataFrame":
    """Aggregate daily session counts for one time_slot into a Prophet-ready DataFrame."""
    import pandas as pd

    filtered = [
        s for s in sessions
        if s.time_slot == time_slot
        and (not branch_filter or branch_map.get(s.student_id) == branch_filter)
    ]

    if not filtered:
        return pd.DataFrame(columns=["ds", "y"])

    counts: dict[date, int] = {}
    for s in filtered:
        counts[s.session_date] = counts.get(s.session_date, 0) + 1

    df = pd.DataFrame(
        [{"ds": pd.Timestamp(d), "y": v} for d, v in sorted(counts.items())]
    )
    return df


def _fit_and_forecast(
    df: "pd.DataFrame",
    forecast_days: int = 7,
    cache_key: tuple | None = None,
) -> "pd.DataFrame | None":
    """Fit Prophet (or return cached forecast) and return a forecast DataFrame."""
    global _model_cache, _cache_built_at

    try:
        from prophet import Prophet
        import pandas as pd
    except ImportError:
        logger.warning("Prophet not installed — falling back to heatmap mode")
        return None

    if len(df) < 14:
        logger.warning("Insufficient data for Prophet (%d rows) — falling back", len(df))
        return None

    # Return cached forecast if still fresh
    now = datetime.now()
    if (
        cache_key
        and cache_key in _model_cache
        and _cache_built_at
        and (now - _cache_built_at).total_seconds() < _CACHE_TTL_HOURS * 3600
    ):
        logger.info("Returning cached Prophet forecast for %s", cache_key)
        return _model_cache[cache_key]

    try:
        m = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.1,
        )
        m.fit(df)
        future   = m.make_future_dataframe(periods=forecast_days)
        forecast = m.predict(future)
        result   = forecast.tail(forecast_days)[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()

        if cache_key:
            _model_cache[cache_key] = result
            _cache_built_at = now

        return result
    except Exception as exc:
        logger.warning("Prophet fit failed: %s — falling back", exc)
        return None


def forecast_demand(
    sessions: list[SessionRecord],
    branch_map: dict[str, str],
    branch_filter: str | None = None,
    peak_threshold: float = 0.75,
    forecast_days: int = 7,
) -> tuple[list[list[DemandCell]], list[DemandCell]]:
    """
    Fit Prophet per time_slot and build a forecast_days × 3 demand matrix.

    Returns (matrix, peaks) where matrix rows = time_slots, cols = forecast days.
    Falls back to recency-weighted heatmap if Prophet is unavailable.
    """
    import pandas as pd

    # Try Prophet for each slot
    forecasts: dict[str, "pd.DataFrame | None"] = {}
    for slot in TIME_SLOTS:
        series = _build_daily_series(sessions, slot, branch_map, branch_filter)
        forecasts[slot] = _fit_and_forecast(series, forecast_days, cache_key=(branch_filter, slot))

    prophet_available = any(f is not None for f in forecasts.values())

    if prophet_available:
        return _build_prophet_matrix(forecasts, forecast_days, peak_threshold)
    else:
        # Fallback: recency-weighted 3×7 heatmap
        matrix = compute_demand_matrix(sessions, branch_map, branch_filter, peak_threshold)
        peaks  = identify_peaks(matrix, peak_threshold)
        return matrix, peaks


def _build_prophet_matrix(
    forecasts: dict,
    forecast_days: int,
    peak_threshold: float,
) -> tuple[list[list[DemandCell]], list[DemandCell]]:
    """Convert Prophet forecast DataFrames into a DemandCell matrix."""
    import pandas as pd

    # Collect all yhat values to normalise across the full matrix
    all_yhats: list[float] = []
    for slot in TIME_SLOTS:
        fc = forecasts.get(slot)
        if fc is not None:
            all_yhats.extend(fc["yhat"].clip(lower=0).tolist())

    max_yhat = max(all_yhats) if all_yhats else 1.0

    matrix: list[list[DemandCell]] = []
    for slot in TIME_SLOTS:
        fc  = forecasts.get(slot)
        row: list[DemandCell] = []

        for i in range(forecast_days):
            if fc is not None:
                r         = fc.iloc[i]
                ds: pd.Timestamp = r["ds"]
                yhat      = max(float(r["yhat"]), 0.0)
                yhat_low  = max(float(r["yhat_lower"]), 0.0)
                yhat_high = max(float(r["yhat_upper"]), 0.0)
                score     = yhat / max_yhat if max_yhat > 0 else 0.0
                dow       = ds.weekday()
                day_label = DAY_LABELS[dow]
                raw_count = round(yhat)
            else:
                # No forecast for this slot — fill with zeros
                from datetime import date as date_cls, timedelta
                ds_date   = date_cls.today() + timedelta(days=i)
                dow       = ds_date.weekday()
                day_label = DAY_LABELS[dow]
                yhat = yhat_low = yhat_high = score = 0.0
                raw_count = 0

            row.append(DemandCell(
                day_of_week=dow,
                day_label=day_label,
                time_slot=slot,
                demand_score=round(score, 4),
                raw_session_count=raw_count,
                weighted_session_count=round(yhat, 2),
                is_peak=score >= peak_threshold,
                # Store forecast bounds as extra context (used in tooltip)
                forecast_lower=round(yhat_low, 1) if fc is not None else None,
                forecast_upper=round(yhat_high, 1) if fc is not None else None,
            ))
        matrix.append(row)

    peaks = [cell for row in matrix for cell in row if cell.is_peak]
    peaks.sort(key=lambda c: c.demand_score, reverse=True)
    return matrix, peaks


# ── Legacy recency-weighted heatmap (fallback) ────────────────────

def compute_demand_matrix(
    sessions: list[SessionRecord],
    branch_map: dict[str, str],
    branch_filter: str | None = None,
    peak_threshold: float = 0.75,
) -> list[list[DemandCell]]:
    if branch_filter:
        sessions = [s for s in sessions if branch_map.get(s.student_id) == branch_filter]

    if sessions:
        max_date      = max(s.session_date for s in sessions)
        recency_cutoff = max_date - timedelta(weeks=4)
    else:
        recency_cutoff = date.min

    raw_counts: dict[tuple[int, str], int]   = {}
    weighted:   dict[tuple[int, str], float] = {}

    for s in sessions:
        key = (s.day_of_week, s.time_slot)
        raw_counts[key] = raw_counts.get(key, 0) + 1
        w = 1.5 if s.session_date > recency_cutoff else 1.0
        weighted[key]   = weighted.get(key, 0.0) + w

    max_w = max(weighted.values()) if weighted else 0.0

    matrix: list[list[DemandCell]] = []
    for slot in TIME_SLOTS:
        row: list[DemandCell] = []
        for dow in range(7):
            key  = (dow, slot)
            raw  = raw_counts.get(key, 0)
            wval = weighted.get(key, 0.0)
            score = wval / max_w if max_w > 0 else 0.0
            row.append(DemandCell(
                day_of_week=dow,
                day_label=DAY_LABELS[dow],
                time_slot=slot,
                demand_score=round(score, 4),
                raw_session_count=raw,
                weighted_session_count=round(wval, 2),
                is_peak=score >= peak_threshold,
            ))
        matrix.append(row)
    return matrix


def identify_peaks(matrix: list[list[DemandCell]], threshold: float) -> list[DemandCell]:
    peaks: list[DemandCell] = []
    for row in matrix:
        for cell in row:
            cell.is_peak = cell.demand_score >= threshold
            if cell.is_peak:
                peaks.append(cell)
    peaks.sort(key=lambda c: c.demand_score, reverse=True)
    return peaks


# ── Recommendations ───────────────────────────────────────────────

def generate_recommendations(
    peaks: list[DemandCell],
    threshold: float,
    branch: str | None = None,
) -> list[RampUpRecommendation]:
    recs: list[RampUpRecommendation] = []
    for cell in peaks:
        additional = max(1, ceil((cell.demand_score - threshold) / (1.0 - threshold) * 5))
        recs.append(RampUpRecommendation(
            day_of_week=cell.day_of_week,
            day_label=cell.day_label,
            time_slot=cell.time_slot,
            demand_score=cell.demand_score,
            raw_session_count=cell.raw_session_count,
            weighted_session_count=cell.weighted_session_count,
            recommended_additional_tutors=additional,
            branch=branch,
        ))
    recs.sort(key=lambda r: r.demand_score, reverse=True)
    return recs


# ── Orchestrator ──────────────────────────────────────────────────

def predict(
    branch: str | None = None,
    peak_threshold: float = 0.75,
) -> DemandPredictionResponse:
    csv_sessions = load_csv_sessions()

    try:
        db_sessions = load_db_sessions()
    except RuntimeError:
        logger.warning("Could not load DB sessions; CSV only.")
        db_sessions = []

    sessions = merge_sessions(csv_sessions, db_sessions)

    branch_map: dict[str, str] = {}
    if branch:
        branch_map = load_student_branches()

    matrix, peaks = forecast_demand(sessions, branch_map, branch, peak_threshold)
    recommendations = generate_recommendations(peaks, peak_threshold, branch)

    data_warning: str | None = None
    if sessions:
        dates = [s.session_date for s in sessions]
        if (max(dates) - min(dates)) < timedelta(weeks=4):
            data_warning = "insufficient_history"
    else:
        data_warning = "insufficient_history"

    return DemandPredictionResponse(
        demand_matrix=matrix,
        peak_periods=peaks,
        recommendations=recommendations,
        peak_threshold=peak_threshold,
        branch=branch,
        data_warning=data_warning,
    )
