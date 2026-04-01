"""Matching router — student-tutor matching pipeline endpoints."""

from datetime import date, datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response

import threading

from api.models import (
    DailyStats,
    MatchingRunRequest,
    MatchingRunResponse,
    PairingRecord,
    PairingReassign,
    PairingStatusUpdate,
    PeriodLock,
    PeriodLockCreate,
    StudentProfile,
    TutorProfile,
    TutorUtilisation,
)
from api.services import pairing_store
from api.services.matching_service import run_matching


def _run_matching_async() -> None:
    """Pull all profiles from the DB and re-run matching in a background thread."""
    students = pairing_store.get_all_student_profiles()
    tutors = pairing_store.get_all_tutor_profiles()
    if students and tutors:
        run_matching(MatchingRunRequest(students=students, tutors=tutors))

router = APIRouter(prefix="/matching", tags=["matching"])

# In-memory job registry (populated by POST /matching/run)
_jobs: dict[str, MatchingRunResponse] = {}


@router.get("/pairings", response_model=list[dict])
async def get_all_pairings(
    time_slot: Optional[str] = None,
) -> list[dict]:
    """
    Return all pairings with student and tutor names joined in.
    Optionally filter by time_slot exact match or day prefix (e.g. 'Mon', 'Tue').
    """
    return pairing_store.get_pairings_by_slot(time_slot)


@router.post("/run", response_model=MatchingRunResponse, status_code=200)
async def matching_run(request: MatchingRunRequest) -> MatchingRunResponse:
    """Run the matching pipeline and return the result."""
    response = run_matching(request)
    _jobs[response.job_id] = response
    return response


@router.get("/jobs/{job_id}", response_model=MatchingRunResponse)
async def get_matching_job(job_id: str) -> MatchingRunResponse:
    """Return the result of a matching job. 404 if not found."""
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/students", response_model=StudentProfile, status_code=201)
async def create_student(student: StudentProfile) -> StudentProfile:
    """Persist a student profile and trigger re-matching in the background."""
    pairing_store.write_student_profile(student)
    threading.Thread(target=_run_matching_async, daemon=True).start()
    return student


@router.post("/tutors", response_model=TutorProfile, status_code=201)
async def create_tutor(tutor: TutorProfile) -> TutorProfile:
    """Persist a tutor profile and trigger re-matching in the background."""
    pairing_store.write_tutor_profile(tutor)
    threading.Thread(target=_run_matching_async, daemon=True).start()
    return tutor


@router.get("/students/{student_id}", response_model=StudentProfile)
async def get_student(student_id: str) -> StudentProfile:
    """Return a student profile by ID."""
    profile = pairing_store.get_student_profile(student_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return profile


@router.get("/students/{student_id}/pairings", response_model=list[PairingRecord])
async def get_student_pairings(student_id: str) -> list[PairingRecord]:
    """Return all pairings for a student."""
    return pairing_store.get_pairings_for_student(student_id)


@router.get("/stats/daily", response_model=list[DailyStats])
async def get_daily_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[DailyStats]:
    """Return daily aggregated pairing stats, optionally filtered by date range."""
    return pairing_store.get_daily_stats(
        start_date=str(start_date) if start_date else None,
        end_date=str(end_date) if end_date else None,
    )


# Static tutor routes MUST be defined before wildcard /tutors/{tutor_id}
@router.get("/tutors/utilisation", response_model=list[TutorUtilisation])
async def get_tutor_utilisation() -> list[TutorUtilisation]:
    """Return utilisation stats for all tutors."""
    return pairing_store.get_all_tutor_utilisation()


@router.get("/tutors/{tutor_id}/pairings", response_model=list[PairingRecord])
async def get_tutor_pairings(tutor_id: str) -> list[PairingRecord]:
    """Return all pairings for a tutor."""
    return pairing_store.get_pairings_for_tutor(tutor_id)


@router.get("/tutors/{tutor_id}", response_model=TutorProfile)
async def get_tutor(tutor_id: str) -> TutorProfile:
    """Return a tutor profile by ID."""
    profile = pairing_store.get_tutor_profile(tutor_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Tutor not found")
    return profile


# ---------------------------------------------------------------------------
# Pairing status / reassign / delete endpoints
# ---------------------------------------------------------------------------


@router.patch("/pairings/{pairing_id}/status", response_model=PairingRecord)
async def update_pairing_status(
    pairing_id: str, body: PairingStatusUpdate
) -> PairingRecord:
    """Transition a pairing's status (e.g. standby → confirmed)."""
    try:
        return pairing_store.update_pairing_status(pairing_id, body.status)
    except ValueError as exc:
        msg = str(exc)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=409, detail=msg)


@router.patch("/pairings/{pairing_id}/reassign", response_model=PairingRecord)
async def reassign_pairing(
    pairing_id: str, body: PairingReassign
) -> PairingRecord:
    """Reassign a pairing to a different tutor (resets status to standby)."""
    try:
        return pairing_store.reassign_pairing(pairing_id, body.tutor_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/pairings/{pairing_id}", status_code=204)
async def delete_pairing(pairing_id: str) -> Response:
    """Release (delete) a pairing."""
    try:
        pairing_store.delete_pairing(pairing_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Period lock CRUD endpoints
# ---------------------------------------------------------------------------


@router.get("/period-locks", response_model=list[PeriodLock])
async def get_period_locks(day: Optional[str] = None) -> list[PeriodLock]:
    """Return period locks, optionally filtered by day_of_week."""
    return pairing_store.get_period_locks(day)


@router.post("/period-locks", response_model=PeriodLock, status_code=201)
async def create_period_lock(body: PeriodLockCreate) -> PeriodLock:
    """Create a new period lock."""
    lock = PeriodLock(
        lock_id=str(uuid4()),
        day_of_week=body.day_of_week,
        period=body.period,
        locked_by=body.locked_by,
        locked_at=datetime.now(timezone.utc).isoformat(),
    )
    try:
        pairing_store.write_period_lock(lock)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return lock


@router.delete("/period-locks/{lock_id}", status_code=204)
async def delete_period_lock(lock_id: str) -> Response:
    """Remove a period lock."""
    try:
        pairing_store.delete_period_lock(lock_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return Response(status_code=204)
