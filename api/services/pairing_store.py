"""
Pairing Store — SQLite-backed persistence layer for the matching pipeline.

DB file: analytics-engine/data/pairing_store.db

Task 2.1: schema initialisation and init_db().
Write/read helpers are added in tasks 2.2 and 2.3.
"""

import json
import os
import sqlite3

from api.models import DailyStats, PairingRecord, StudentProfile, TutorProfile, TutorUtilisation

# ---------------------------------------------------------------------------
# DB path
# ---------------------------------------------------------------------------

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
_DEFAULT_DB = os.path.join(_REPO_ROOT, "analytics-engine", "data", "pairing_store.db")
DB_PATH = os.environ.get("DB_PATH", _DEFAULT_DB)

# ---------------------------------------------------------------------------
# Schema DDL
# ---------------------------------------------------------------------------

_DDL = """
CREATE TABLE IF NOT EXISTS pairings (
    pairing_id         TEXT PRIMARY KEY,
    student_id         TEXT NOT NULL,
    tutor_id           TEXT NOT NULL,
    time_slot          TEXT NOT NULL,
    satisfaction_score REAL NOT NULL,
    tutor_utilisation  REAL NOT NULL,
    matched_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pairings_student ON pairings(student_id);
CREATE INDEX IF NOT EXISTS idx_pairings_tutor   ON pairings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_pairings_date    ON pairings(matched_at);

CREATE TABLE IF NOT EXISTS matching_jobs (
    job_id       TEXT PRIMARY KEY,
    status       TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    completed_at TEXT,
    error        TEXT
);

CREATE TABLE IF NOT EXISTS student_profiles (
    student_id         TEXT PRIMARY KEY,
    name               TEXT NOT NULL,
    curriculum         TEXT NOT NULL,
    grade_level        INTEGER NOT NULL,
    weak_topic         TEXT NOT NULL,
    branch             TEXT NOT NULL,
    availability_slots TEXT NOT NULL  -- JSON array
);

CREATE TABLE IF NOT EXISTS tutor_profiles (
    tutor_id               TEXT PRIMARY KEY,
    name                   TEXT NOT NULL,
    tutor_type             TEXT NOT NULL,
    primary_curriculum     TEXT NOT NULL,
    specialty_topic        TEXT NOT NULL,
    years_experience       INTEGER NOT NULL,
    rating                 REAL NOT NULL,
    preferred_min_grade    INTEGER NOT NULL,
    preferred_max_grade    INTEGER NOT NULL,
    past_success_rate      REAL NOT NULL,
    branch                 TEXT NOT NULL,
    availability_slots     TEXT NOT NULL,  -- JSON array
    max_students_per_slot  INTEGER NOT NULL DEFAULT 1
);
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Return a SQLite connection with row_factory set to Row."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH) -> None:
    """
    Initialise the pairing store database.

    Creates all tables and indexes if they do not already exist.
    Safe to call multiple times (idempotent).
    Called once at application startup from api/main.py.
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with get_connection(db_path) as conn:
        conn.executescript(_DDL)


def write_pairing(pairing: PairingRecord, db_path: str = DB_PATH) -> None:
    """Insert or replace a PairingRecord inside a transaction."""
    with get_connection(db_path) as conn:
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO pairings
                    (pairing_id, student_id, tutor_id, time_slot,
                     satisfaction_score, tutor_utilisation, matched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    pairing.pairing_id,
                    pairing.student_id,
                    pairing.tutor_id,
                    pairing.time_slot,
                    pairing.satisfaction_score,
                    pairing.tutor_utilisation,
                    pairing.matched_at,
                ),
            )


def write_student_profile(student: StudentProfile, db_path: str = DB_PATH) -> None:
    """Insert or replace a StudentProfile, serialising availability_slots as JSON."""
    with get_connection(db_path) as conn:
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO student_profiles
                    (student_id, name, curriculum, grade_level,
                     weak_topic, branch, availability_slots)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    student.student_id,
                    student.name,
                    student.curriculum,
                    student.grade_level,
                    student.weak_topic,
                    student.branch,
                    json.dumps(student.availability_slots),
                ),
            )


def write_tutor_profile(tutor: TutorProfile, db_path: str = DB_PATH) -> None:
    """Insert or replace a TutorProfile, serialising availability_slots as JSON."""
    with get_connection(db_path) as conn:
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO tutor_profiles
                    (tutor_id, name, tutor_type, primary_curriculum,
                     specialty_topic, years_experience, rating,
                     preferred_min_grade, preferred_max_grade,
                     past_success_rate, branch, availability_slots,
                     max_students_per_slot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tutor.tutor_id,
                    tutor.name,
                    tutor.tutor_type,
                    tutor.primary_curriculum,
                    tutor.specialty_topic,
                    tutor.years_experience,
                    tutor.rating,
                    tutor.preferred_min_grade,
                    tutor.preferred_max_grade,
                    tutor.past_success_rate,
                    tutor.branch,
                    json.dumps(tutor.availability_slots),
                    tutor.max_students_per_slot,
                ),
            )


def get_pairings_for_student(student_id: str, db_path: str = DB_PATH) -> list[PairingRecord]:
    """Return all PairingRecords for the given student_id."""
    with get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT * FROM pairings WHERE student_id = ?", (student_id,)
        ).fetchall()
    return [PairingRecord(**dict(row)) for row in rows]


def get_pairings_for_tutor(tutor_id: str, db_path: str = DB_PATH) -> list[PairingRecord]:
    """Return all PairingRecords for the given tutor_id."""
    with get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT * FROM pairings WHERE tutor_id = ?", (tutor_id,)
        ).fetchall()
    return [PairingRecord(**dict(row)) for row in rows]


def get_pairings_by_slot(
    time_slot: str | None = None,
    db_path: str = DB_PATH,
) -> list[dict]:
    """
    Return all pairings joined with student and tutor names.
    time_slot can be:
      - None / empty  → all pairings
      - A day prefix like 'Mon', 'Tue' → all slots for that day (case-insensitive)
      - An exact slot like 'Mon_19:00'
    """
    with get_connection(db_path) as conn:
        base_select = """
            SELECT
                p.pairing_id, p.student_id, p.tutor_id, p.time_slot,
                p.satisfaction_score, p.tutor_utilisation, p.matched_at,
                COALESCE(sp.name, p.student_id) AS student_name,
                COALESCE(tp.name, p.tutor_id)   AS tutor_name,
                COALESCE(sp.curriculum, '')      AS curriculum,
                COALESCE(sp.grade_level, 0)      AS grade_level,
                COALESCE(sp.weak_topic, '')      AS weak_topic,
                COALESCE(sp.branch, '')          AS branch
            FROM pairings p
            LEFT JOIN student_profiles sp ON sp.student_id = p.student_id
            LEFT JOIN tutor_profiles   tp ON tp.tutor_id   = p.tutor_id
        """
        if time_slot:
            # Day-prefix match (e.g. 'Mon') — case-insensitive LIKE
            rows = conn.execute(
                base_select + " WHERE LOWER(p.time_slot) LIKE LOWER(?) ORDER BY p.time_slot, p.matched_at DESC",
                (f"{time_slot}%",),
            ).fetchall()
        else:
            rows = conn.execute(
                base_select + " ORDER BY p.time_slot, p.matched_at DESC"
            ).fetchall()
    return [dict(row) for row in rows]


def get_student_profile(student_id: str, db_path: str = DB_PATH) -> StudentProfile | None:
    """Return the StudentProfile for the given student_id, or None if not found."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT * FROM student_profiles WHERE student_id = ?", (student_id,)
        ).fetchone()
    if row is None:
        return None
    data = dict(row)
    data["availability_slots"] = json.loads(data["availability_slots"])
    return StudentProfile(**data)


def get_tutor_profile(tutor_id: str, db_path: str = DB_PATH) -> TutorProfile | None:
    """Return the TutorProfile for the given tutor_id, or None if not found."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT * FROM tutor_profiles WHERE tutor_id = ?", (tutor_id,)
        ).fetchone()
    if row is None:
        return None
    data = dict(row)
    data["availability_slots"] = json.loads(data["availability_slots"])
    return TutorProfile(**data)


def get_all_tutor_profiles(db_path: str = DB_PATH) -> list[TutorProfile]:
    """Return all TutorProfiles from the database."""
    with get_connection(db_path) as conn:
        rows = conn.execute("SELECT * FROM tutor_profiles").fetchall()
    result = []
    for row in rows:
        data = dict(row)
        data["availability_slots"] = json.loads(data["availability_slots"])
        result.append(TutorProfile(**data))
    return result


def get_all_student_profiles(db_path: str = DB_PATH) -> list[StudentProfile]:
    """Return all StudentProfiles from the database."""
    with get_connection(db_path) as conn:
        rows = conn.execute("SELECT * FROM student_profiles").fetchall()
    result = []
    for row in rows:
        data = dict(row)
        data["availability_slots"] = json.loads(data["availability_slots"])
        result.append(StudentProfile(**data))
    return result


def get_daily_stats(
    start_date: str | None = None,
    end_date: str | None = None,
    db_path: str = DB_PATH,
) -> list[DailyStats]:
    """
    Return daily aggregated pairing stats grouped by calendar day.

    Filters by start_date / end_date (YYYY-MM-DD) when provided.
    Days with zero pairings are omitted (they never appear in GROUP BY).
    """
    query = """
        SELECT
            date(matched_at) AS day,
            AVG(satisfaction_score) AS avg_score,
            COUNT(*) AS cnt
        FROM pairings
        WHERE 1=1
    """
    params: list = []

    if start_date is not None:
        query += " AND date(matched_at) >= ?"
        params.append(start_date)
    if end_date is not None:
        query += " AND date(matched_at) <= ?"
        params.append(end_date)

    query += " GROUP BY date(matched_at) ORDER BY day"

    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        DailyStats(
            date=row["day"],
            avg_satisfaction_score=row["avg_score"],
            pairing_count=row["cnt"],
        )
        for row in rows
    ]


def get_tutor_utilisation(tutor_id: str, db_path: str = DB_PATH) -> float:
    """
    Compute utilisation percentage for a single tutor.

    utilisation = (confirmed_pairings / (availability_slots * max_students_per_slot)) * 100

    Returns 0.0 if the tutor is not found or has no availability slots.
    """
    with get_connection(db_path) as conn:
        tutor_row = conn.execute(
            "SELECT availability_slots, max_students_per_slot FROM tutor_profiles WHERE tutor_id = ?",
            (tutor_id,),
        ).fetchone()

        if tutor_row is None:
            return 0.0

        slots = json.loads(tutor_row["availability_slots"])
        max_slots = len(slots)
        max_per_slot = tutor_row["max_students_per_slot"] or 1
        capacity = max_slots * max_per_slot
        if capacity == 0:
            return 0.0

        pairing_count = conn.execute(
            "SELECT COUNT(*) AS cnt FROM pairings WHERE tutor_id = ?",
            (tutor_id,),
        ).fetchone()["cnt"]

    return min((pairing_count / capacity) * 100.0, 100.0)


def get_all_tutor_utilisation(db_path: str = DB_PATH) -> list[TutorUtilisation]:
    """
    Return utilisation and status for every tutor in tutor_profiles.

    Status thresholds:
      < 70  → "Under-utilised"
      70–90 → "Appropriately-utilised"
      > 90  → "Over-utilised"
    """
    with get_connection(db_path) as conn:
        tutor_rows = conn.execute(
            "SELECT tutor_id, name, availability_slots FROM tutor_profiles"
        ).fetchall()

    result: list[TutorUtilisation] = []
    for row in tutor_rows:
        tutor_id = row["tutor_id"]
        utilisation = get_tutor_utilisation(tutor_id, db_path)

        if utilisation < 70.0:
            status = "Under-utilised"
        elif utilisation <= 90.0:
            status = "Appropriately-utilised"
        else:
            status = "Over-utilised"

        result.append(
            TutorUtilisation(
                tutor_id=tutor_id,
                name=row["name"],
                utilisation=utilisation,
                utilisation_status=status,
            )
        )

    return result
