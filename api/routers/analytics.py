"""Analytics data router — serves analytics output and raw CSV files as JSON."""

from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.services.csv_parser import parse_csv

router = APIRouter(tags=["analytics"])

PRE_PROCESSED_DIR = Path("analytics-engine/data/pre-processed")
RAW_DIR = Path("analytics-engine/data/raw")


def _read_csv_file(path: Path) -> list[dict]:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path.name}")
    content = path.read_text(encoding="utf-8")
    try:
        return parse_csv(content)
    except ValueError:
        return []


@router.get("/analytics/mapping-quality-timeseries")
async def get_mapping_quality_timeseries() -> list[dict]:
    return _read_csv_file(PRE_PROCESSED_DIR / "analytics_mapping_quality_timeseries.csv")


@router.get("/analytics/scenario-rankings")
async def get_scenario_rankings() -> list[dict]:
    return _read_csv_file(PRE_PROCESSED_DIR / "analytics_scenario_rankings.csv")


@router.get("/analytics/model-metrics")
async def get_model_metrics() -> list[dict]:
    return _read_csv_file(PRE_PROCESSED_DIR / "analytics_model_metrics.csv")


@router.get("/data/students")
async def get_students() -> list[dict]:
    return _read_csv_file(RAW_DIR / "students.csv")


@router.get("/data/tutors")
async def get_tutors() -> list[dict]:
    return _read_csv_file(RAW_DIR / "tutors.csv")


@router.get("/data/pairings")
async def get_pairings() -> list[dict]:
    return _read_csv_file(RAW_DIR / "pairings_raw.csv")
