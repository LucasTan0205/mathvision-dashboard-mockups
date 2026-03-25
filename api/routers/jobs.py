"""Jobs router — trigger analytics runs, poll job status, and list results."""

import threading
from pathlib import Path

from fastapi import APIRouter

from api.models import JobCreateResponse, JobStatus
from api.services import job_runner

_PRE_PROCESSED_DIR = Path("analytics-engine/data/pre-processed")

router = APIRouter(tags=["jobs"])


@router.post("/jobs", response_model=JobCreateResponse, status_code=201)
async def create_job() -> JobCreateResponse:
    """Trigger a new analytics run and return the job ID."""
    job_id = job_runner.create_job()
    thread = threading.Thread(target=job_runner.run_job, args=(job_id,), daemon=True)
    thread.start()
    return JobCreateResponse(job_id=job_id, status="queued")


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str) -> JobStatus:
    """Return current status for a job. 404 if not found."""
    return job_runner.get_job(job_id)


@router.get("/results", response_model=list[str])
async def get_results() -> list[str]:
    """List filenames in the pre-processed output directory."""
    if not _PRE_PROCESSED_DIR.exists():
        return []
    return [f.name for f in _PRE_PROCESSED_DIR.iterdir() if f.is_file()]
