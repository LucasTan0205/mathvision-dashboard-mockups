"""
Matching Service — core orchestration logic for the student-tutor matching pipeline.

Task 4.1: group_by_availability
Task 4.4: score_group (Integer Programming via pulp)
Task 4.9: run_matching
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

import pulp
from fastapi import HTTPException

from api.models import MatchingRunRequest, MatchingRunResponse, PairingRecord, StudentProfile, TutorProfile
from api.services import hybrid_scorer
from api.services.pairing_store import DB_PATH, get_tutor_utilisation, write_pairing

logger = logging.getLogger(__name__)


@dataclass
class ScoredPairing:
    student_id: str
    tutor_id: str
    time_slot: str
    satisfaction_score: float
    tutor_utilisation: float


@dataclass
class AvailabilityGroup:
    time_slot: str
    students: list[StudentProfile] = field(default_factory=list)
    tutors: list[TutorProfile] = field(default_factory=list)


@dataclass
class GroupingResult:
    groups: list[AvailabilityGroup]
    unmatched_student_ids: list[str]


def group_by_availability(
    students: list[StudentProfile],
    tutors: list[TutorProfile],
) -> GroupingResult:
    """
    Group students and tutors by shared availability slots.

    - One AvailabilityGroup per distinct time slot that has >= 1 student AND >= 1 tutor
    - Each student appears in every group matching their availability slots
    - Each tutor appears in every group matching their availability slots
    - Students with no overlap with any tutor go into unmatched_student_ids

    Requirements: 3.1, 3.2, 3.3, 3.4
    """
    # Collect all time slots covered by at least one tutor
    tutor_slots: set[str] = set()
    for tutor in tutors:
        tutor_slots.update(tutor.availability_slots)

    # Determine which slots qualify: present in >= 1 student AND >= 1 tutor
    # Build a map: slot -> (students_in_slot, tutors_in_slot)
    slot_students: dict[str, list[StudentProfile]] = {}
    slot_tutors: dict[str, list[TutorProfile]] = {}

    for tutor in tutors:
        for slot in tutor.availability_slots:
            slot_tutors.setdefault(slot, []).append(tutor)

    for student in students:
        for slot in student.availability_slots:
            if slot in tutor_slots:
                slot_students.setdefault(slot, []).append(student)

    # Build one AvailabilityGroup per slot that has both students and tutors
    qualifying_slots = set(slot_students.keys()) & set(slot_tutors.keys())

    groups: list[AvailabilityGroup] = [
        AvailabilityGroup(
            time_slot=slot,
            students=slot_students[slot],
            tutors=slot_tutors[slot],
        )
        for slot in sorted(qualifying_slots)
    ]

    # A student is unmatched if none of their slots overlap with any tutor slot
    matched_student_ids: set[str] = {
        student.student_id
        for slot in qualifying_slots
        for student in slot_students[slot]
    }

    unmatched_student_ids: list[str] = [
        student.student_id
        for student in students
        if student.student_id not in matched_student_ids
    ]

    return GroupingResult(groups=groups, unmatched_student_ids=unmatched_student_ids)


def score_group(
    group: AvailabilityGroup,
    db_path: str = DB_PATH,
) -> list[ScoredPairing]:
    """
    Use Integer Programming to find the optimal whole-class assignment
    for an availability group.

    Returns a list of ScoredPairing for each assigned student-tutor pair.
    """
    students = group.students
    tutors = group.tutors

    if not students or not tutors:
        return []

    # Build score matrix: score[i][j] = final_score(student_i, tutor_j)
    scores: dict[tuple[int, int], float] = {}
    for i, student in enumerate(students):
        for j, tutor in enumerate(tutors):
            scores[(i, j)] = hybrid_scorer.final_score(student, tutor)

    # Fetch current utilisation for each tutor (percentage 0–100, normalised to 0–1)
    utilisations: list[float] = [
        get_tutor_utilisation(tutor.tutor_id, db_path) / 100.0
        for tutor in tutors
    ]

    # Formulate IP problem
    prob = pulp.LpProblem("student_tutor_matching", pulp.LpMaximize)

    # Binary decision variables x[i][j]
    x = {
        (i, j): pulp.LpVariable(f"x_{i}_{j}", cat="Binary")
        for i in range(len(students))
        for j in range(len(tutors))
    }

    # Objective: maximise Σ(score[i][j] × x[i][j]) + 0.0001 × Σ((1 − utilisation[j]) × x[i][j])
    prob += pulp.lpSum(
        scores[(i, j)] * x[(i, j)]
        + 0.0001 * (1.0 - utilisations[j]) * x[(i, j)]
        for i in range(len(students))
        for j in range(len(tutors))
    )

    # Constraint: each student assigned to at most one tutor
    for i in range(len(students)):
        prob += pulp.lpSum(x[(i, j)] for j in range(len(tutors))) <= 1

    # Constraint: each tutor assigned at most capacity[j] students
    for j, tutor in enumerate(tutors):
        prob += pulp.lpSum(x[(i, j)] for i in range(len(students))) <= tutor.max_students_per_slot

    # Solve
    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    # Extract assigned pairs
    result: list[ScoredPairing] = []
    for i, student in enumerate(students):
        for j, tutor in enumerate(tutors):
            if pulp.value(x[(i, j)]) == 1:
                result.append(
                    ScoredPairing(
                        student_id=student.student_id,
                        tutor_id=tutor.tutor_id,
                        time_slot=group.time_slot,
                        satisfaction_score=scores[(i, j)],
                        tutor_utilisation=utilisations[j] * 100.0,
                    )
                )

    return result


def run_matching(
    request: MatchingRunRequest,
    db_path: str = DB_PATH,
) -> MatchingRunResponse:
    """
    Orchestrate the full matching pipeline:
    1. Group students and tutors by availability
    2. For each group, run score_group (IP solver)
    3. Persist each pairing to the Pairing Store
    4. Return MatchingRunResponse

    Raises HTTPException(500) if any pairing write fails.
    """
    grouping = group_by_availability(request.students, request.tutors)

    all_pairings: list[PairingRecord] = []
    matched_at = datetime.now(timezone.utc).isoformat()

    for group in grouping.groups:
        scored = score_group(group, db_path)
        for sp in scored:
            record = PairingRecord(
                pairing_id=str(uuid.uuid4()),
                student_id=sp.student_id,
                tutor_id=sp.tutor_id,
                time_slot=sp.time_slot,
                satisfaction_score=sp.satisfaction_score,
                tutor_utilisation=sp.tutor_utilisation,
                matched_at=matched_at,
            )
            try:
                write_pairing(record, db_path)
            except Exception as exc:
                logger.error("Failed to write pairing %s: %s", record.pairing_id, exc)
                raise HTTPException(status_code=500, detail="Failed to persist pairing") from exc
            all_pairings.append(record)

    return MatchingRunResponse(
        job_id=str(uuid.uuid4()),
        status="complete",
        pairings=all_pairings,
        unmatched_student_ids=grouping.unmatched_student_ids,
    )
