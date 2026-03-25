"""Job runner service — manages notebook execution jobs."""

import json
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from api.models import JobStatus

# In-memory primary store
_jobs: dict[str, dict] = {}

# Paths (relative to project root)
_STATE_FILE = Path("analytics-engine/data/.job_state.json")
_PREPROCESSING_NB = "analytics-engine/pre-processing/mathvision_preprocessing.ipynb"
_ANALYTICS_NB = "analytics-engine/analytics/mathvision_analytics.ipynb"
_OUTPUT_FILES = [
    "analytics-engine/data/pre-processed/analytics_model_metrics.csv",
    "analytics-engine/data/pre-processed/analytics_scenario_rankings.csv",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _persist() -> None:
    """Write the current in-memory state to the JSON sidecar file."""
    _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _STATE_FILE.write_text(json.dumps(_jobs, indent=2))


def _load_from_file() -> dict:
    """Load job state from the JSON sidecar file."""
    if _STATE_FILE.exists():
        try:
            return json.loads(_STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _set_state(job_id: str, status: str, current_step: str, **kwargs) -> None:
    """Update job state and persist to disk."""
    _jobs[job_id].update({"status": status, "current_step": current_step, **kwargs})
    _persist()


def create_job() -> str:
    """Generate a new job, set state to queued, persist, and return the job ID."""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "current_step": "queued",
        "started_at": None,
        "completed_at": None,
        "error": None,
        "output_files": [],
    }
    _persist()
    return job_id


def run_job(job_id: str) -> None:
    """Execute preprocessing then analytics notebook, transitioning state accordingly."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    started_at = _now()
    _set_state(job_id, "preprocessing", "preprocessing", started_at=started_at)

    # Run preprocessing notebook
    result = subprocess.run(
        [
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--ExecutePreprocessor.timeout=600",
            _PREPROCESSING_NB,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        error_msg = result.stderr.strip() or "Preprocessing notebook failed with no stderr output."
        _set_state(
            job_id,
            "failed",
            "preprocessing",
            completed_at=_now(),
            error=error_msg,
        )
        return

    # Transition to analytics step
    _set_state(job_id, "analytics", "analytics")

    # Run analytics notebook
    result = subprocess.run(
        [
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--ExecutePreprocessor.timeout=600",
            _ANALYTICS_NB,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        error_msg = result.stderr.strip() or "Analytics notebook failed with no stderr output."
        _set_state(
            job_id,
            "failed",
            "analytics",
            completed_at=_now(),
            error=error_msg,
        )
        return

    # Success
    _set_state(
        job_id,
        "complete",
        "complete",
        completed_at=_now(),
        output_files=_OUTPUT_FILES,
    )


def get_job(job_id: str) -> JobStatus:
    """Return current job status, falling back to the JSON file if not in memory."""
    job = _jobs.get(job_id)

    if job is None:
        # Fallback: try loading from the persisted file
        persisted = _load_from_file()
        job = persisted.get(job_id)
        if job is not None:
            # Restore into memory
            _jobs[job_id] = job

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatus(**job)
