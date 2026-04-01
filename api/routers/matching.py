"""Matching router — student-tutor matching pipeline endpoints."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException

import threading

from api.models import (
    DailyStats,
    MatchingRunRequest,
    MatchingRunResponse,
    PairingRecord,
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


def _normalise_slot(slot: str) -> str:
    """Normalise availability slot to canonical form: Mon_09:00"""
    parts = slot.split("_", 1)
    if len(parts) != 2:
        return slot
    day, time = parts
    return f"{day.capitalize()[:3]}_{time}"

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
    student.availability_slots = [_normalise_slot(s) for s in student.availability_slots]
    pairing_store.write_student_profile(student)
    threading.Thread(target=_run_matching_async, daemon=True).start()
    return student


@router.post("/tutors", response_model=TutorProfile, status_code=201)
async def create_tutor(tutor: TutorProfile) -> TutorProfile:
    """Persist a tutor profile and trigger re-matching in the background."""
    tutor.availability_slots = [_normalise_slot(s) for s in tutor.availability_slots]
    pairing_store.write_tutor_profile(tutor)
    threading.Thread(target=_run_matching_async, daemon=True).start()
    return tutor


@router.patch("/pairings/{pairing_id}/confirm", status_code=200)
async def confirm_pairing_endpoint(pairing_id: str) -> dict:
    """Confirm a pending pairing by ID."""
    updated = pairing_store.confirm_pairing(pairing_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Pairing not found")
    return {"pairing_id": pairing_id, "status": "confirmed"}


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
