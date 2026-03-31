"""
Seed script — pre-populates the pairing store with a class of students and tutors,
then runs the matching pipeline so pairings are ready before the demo.

Run from the project root:
    python -m api.seed

Sarah (student) and Jebron Lames (tutor) are intentionally excluded so they can
be added live during the demo.
"""

from api.services.pairing_store import init_db, write_student_profile, write_tutor_profile
from api.services.matching_service import run_matching
from api.models import StudentProfile, TutorProfile, MatchingRunRequest

# ---------------------------------------------------------------------------
# Pre-existing students (the class before the demo)
# ---------------------------------------------------------------------------

STUDENTS = [
    StudentProfile(
        student_id="s-001",
        name="Lucas Ong",
        curriculum="IB",
        grade_level=11,
        weak_topic="Calculus",
        branch="Central",
        availability_slots=["Mon_09:00", "Mon_09:30", "Wed_14:00", "Wed_14:30"],
    ),
    StudentProfile(
        student_id="s-002",
        name="Emma Lim",
        curriculum="IGCSE",
        grade_level=10,
        weak_topic="Geometry",
        branch="East",
        availability_slots=["Tue_10:00", "Tue_10:30", "Thu_16:00", "Thu_16:30"],
    ),
    StudentProfile(
        student_id="s-003",
        name="Aiden Tan",
        curriculum="Local",
        grade_level=8,
        weak_topic="Fractions",
        branch="West",
        availability_slots=["Mon_14:00", "Mon_14:30", "Fri_09:00", "Fri_09:30"],
    ),
    StudentProfile(
        student_id="s-004",
        name="Priya Nair",
        curriculum="IGCSE",
        grade_level=9,
        weak_topic="Algebra",
        branch="Central",
        availability_slots=["Wed_09:00", "Wed_09:30", "Sat_10:00", "Sat_10:30"],
    ),
    StudentProfile(
        student_id="s-005",
        name="Marcus Wong",
        curriculum="IB",
        grade_level=12,
        weak_topic="Statistics",
        branch="East",
        availability_slots=["Tue_14:00", "Tue_14:30", "Thu_09:00", "Thu_09:30"],
    ),
    StudentProfile(
        student_id="s-006",
        name="Chloe Yeo",
        curriculum="Local",
        grade_level=7,
        weak_topic="Fractions",
        branch="Central",
        availability_slots=["Mon_16:00", "Mon_16:30", "Wed_16:00", "Wed_16:30"],
    ),
    StudentProfile(
        student_id="s-007",
        name="Ryan Koh",
        curriculum="IGCSE",
        grade_level=11,
        weak_topic="Calculus",
        branch="West",
        availability_slots=["Fri_14:00", "Fri_14:30", "Sat_14:00", "Sat_14:30"],
    ),
    StudentProfile(
        student_id="s-008",
        name="Sophia Lee",
        curriculum="Local",
        grade_level=6,
        weak_topic="Fractions",
        branch="Central",
        availability_slots=["Tue_09:00", "Tue_09:30", "Thu_14:00", "Thu_14:30"],
    ),
]

# ---------------------------------------------------------------------------
# Pre-existing tutors (the bench before the demo)
# ---------------------------------------------------------------------------

TUTORS = [
    TutorProfile(
        tutor_id="t-001",
        name="Ms Hafizah Rahman",
        tutor_type="full-time",
        primary_curriculum="Local",
        specialty_topic="Fractions",
        years_experience=6,
        rating=4.7,
        preferred_min_grade=5,
        preferred_max_grade=9,
        past_success_rate=0.88,
        branch="Central",
        availability_slots=[
            "Mon_09:00", "Mon_09:30", "Mon_14:00", "Mon_14:30",
            "Mon_16:00", "Mon_16:30", "Wed_09:00", "Wed_09:30",
            "Wed_14:00", "Wed_14:30", "Wed_16:00", "Wed_16:30",
        ],
        max_students_per_slot=1,
    ),
    TutorProfile(
        tutor_id="t-002",
        name="Mr Kevin Tan",
        tutor_type="full-time",
        primary_curriculum="IGCSE",
        specialty_topic="Algebra",
        years_experience=8,
        rating=4.5,
        preferred_min_grade=8,
        preferred_max_grade=12,
        past_success_rate=0.91,
        branch="East",
        availability_slots=[
            "Tue_10:00", "Tue_10:30", "Tue_14:00", "Tue_14:30",
            "Thu_09:00", "Thu_09:30", "Thu_16:00", "Thu_16:30",
            "Sat_10:00", "Sat_10:30", "Sat_14:00", "Sat_14:30",
        ],
        max_students_per_slot=1,
    ),
    TutorProfile(
        tutor_id="t-003",
        name="Ms Priscilla Goh",
        tutor_type="part-time",
        primary_curriculum="IB",
        specialty_topic="Calculus",
        years_experience=4,
        rating=4.3,
        preferred_min_grade=10,
        preferred_max_grade=12,
        past_success_rate=0.82,
        branch="Central",
        availability_slots=[
            "Mon_09:00", "Mon_09:30", "Wed_14:00", "Wed_14:30",
            "Tue_14:00", "Tue_14:30", "Thu_14:00", "Thu_14:30",
        ],
        max_students_per_slot=1,
    ),
    TutorProfile(
        tutor_id="t-004",
        name="Mr Darren Lim",
        tutor_type="instructor",
        primary_curriculum="IGCSE",
        specialty_topic="Geometry",
        years_experience=10,
        rating=4.8,
        preferred_min_grade=7,
        preferred_max_grade=11,
        past_success_rate=0.93,
        branch="East",
        availability_slots=[
            "Tue_10:00", "Tue_10:30", "Thu_16:00", "Thu_16:30",
            "Sat_10:00", "Sat_10:30", "Sat_14:00", "Sat_14:30",
        ],
        max_students_per_slot=1,
    ),
    TutorProfile(
        tutor_id="t-005",
        name="Ms Aisha Binte Yusof",
        tutor_type="part-time",
        primary_curriculum="Local",
        specialty_topic="Statistics",
        years_experience=3,
        rating=4.1,
        preferred_min_grade=5,
        preferred_max_grade=10,
        past_success_rate=0.78,
        branch="West",
        availability_slots=[
            "Mon_14:00", "Mon_14:30", "Fri_09:00", "Fri_09:30",
            "Fri_14:00", "Fri_14:30", "Sat_14:00", "Sat_14:30",
        ],
        max_students_per_slot=1,
    ),
]


def seed():
    print("Initialising database...")
    init_db()

    print("Flushing existing data...")
    from api.services.pairing_store import get_connection
    with get_connection() as conn:
        conn.execute("DELETE FROM pairings")
        conn.execute("DELETE FROM student_profiles")
        conn.execute("DELETE FROM tutor_profiles")
        conn.commit()
    print("  Cleared pairings, student_profiles, tutor_profiles.")

    print(f"Seeding {len(STUDENTS)} students...")
    for s in STUDENTS:
        write_student_profile(s)
        print(f"  + {s.name} ({s.curriculum}, Grade {s.grade_level}, {s.weak_topic})")

    print(f"\nSeeding {len(TUTORS)} tutors...")
    for t in TUTORS:
        write_tutor_profile(t)
        print(f"  + {t.name} ({t.tutor_type}, {t.specialty_topic})")

    print("\nRunning matching pipeline on seeded class...")
    request = MatchingRunRequest(students=STUDENTS, tutors=TUTORS)
    result = run_matching(request)
    print(f"  Matched {len(result.pairings)} pairings")
    if result.unmatched_student_ids:
        print(f"  Unmatched students: {result.unmatched_student_ids}")
    for p in result.pairings:
        print(f"  {p.student_id} → {p.tutor_id} @ {p.time_slot} (score: {p.satisfaction_score:.2f})")

    print("\nDone. Sarah and Jebron Lames can now be added live via the portals.")
    print("Then trigger matching via: POST /matching/run")


if __name__ == "__main__":
    seed()
