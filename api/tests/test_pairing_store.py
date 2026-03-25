"""Tests for pairing_store write/read helpers (Task 2.2)."""

import os
import tempfile

import pytest

from api.models import PairingRecord, StudentProfile, TutorProfile
from api.services.pairing_store import (
    get_all_tutor_profiles,
    get_pairings_for_student,
    get_pairings_for_tutor,
    get_student_profile,
    get_tutor_profile,
    init_db,
    write_pairing,
    write_student_profile,
    write_tutor_profile,
)


@pytest.fixture
def db(tmp_path):
    path = str(tmp_path / "test.db")
    init_db(path)
    return path


def make_student(**kwargs) -> StudentProfile:
    defaults = dict(
        student_id="s1",
        name="Alice",
        curriculum="IGCSE",
        grade_level=9,
        weak_topic="Algebra",
        branch="Central",
        availability_slots=["Mon 9am", "Tue 10am"],
    )
    defaults.update(kwargs)
    return StudentProfile(**defaults)


def make_tutor(**kwargs) -> TutorProfile:
    defaults = dict(
        tutor_id="t1",
        name="Bob",
        tutor_type="full-time",
        primary_curriculum="IGCSE",
        specialty_topic="Algebra",
        years_experience=5,
        rating=4.5,
        preferred_min_grade=7,
        preferred_max_grade=12,
        past_success_rate=0.85,
        branch="Central",
        availability_slots=["Mon 9am", "Wed 2pm"],
        max_students_per_slot=2,
    )
    defaults.update(kwargs)
    return TutorProfile(**defaults)


def make_pairing(**kwargs) -> PairingRecord:
    defaults = dict(
        pairing_id="p1",
        student_id="s1",
        tutor_id="t1",
        time_slot="Mon 9am",
        satisfaction_score=85.0,
        tutor_utilisation=50.0,
        matched_at="2024-01-01T09:00:00",
    )
    defaults.update(kwargs)
    return PairingRecord(**defaults)


# --- write_pairing / get_pairings_for_student / get_pairings_for_tutor ---

def test_write_and_get_pairing_for_student(db):
    p = make_pairing()
    write_pairing(p, db)
    results = get_pairings_for_student("s1", db)
    assert len(results) == 1
    assert results[0].pairing_id == "p1"
    assert results[0].satisfaction_score == 85.0


def test_write_and_get_pairing_for_tutor(db):
    p = make_pairing()
    write_pairing(p, db)
    results = get_pairings_for_tutor("t1", db)
    assert len(results) == 1
    assert results[0].pairing_id == "p1"


def test_get_pairings_returns_empty_for_unknown(db):
    assert get_pairings_for_student("unknown", db) == []
    assert get_pairings_for_tutor("unknown", db) == []


def test_write_pairing_insert_or_replace(db):
    p = make_pairing(satisfaction_score=70.0)
    write_pairing(p, db)
    updated = make_pairing(satisfaction_score=90.0)
    write_pairing(updated, db)
    results = get_pairings_for_student("s1", db)
    assert len(results) == 1
    assert results[0].satisfaction_score == 90.0


def test_multiple_pairings_for_student(db):
    write_pairing(make_pairing(pairing_id="p1", tutor_id="t1"), db)
    write_pairing(make_pairing(pairing_id="p2", tutor_id="t2"), db)
    results = get_pairings_for_student("s1", db)
    assert len(results) == 2


# --- write_student_profile / get_student_profile ---

def test_write_and_get_student_profile(db):
    s = make_student()
    write_student_profile(s, db)
    result = get_student_profile("s1", db)
    assert result is not None
    assert result.name == "Alice"
    assert result.availability_slots == ["Mon 9am", "Tue 10am"]


def test_get_student_profile_returns_none_for_unknown(db):
    assert get_student_profile("unknown", db) is None


def test_write_student_profile_insert_or_replace(db):
    write_student_profile(make_student(name="Alice"), db)
    write_student_profile(make_student(name="Alice Updated"), db)
    result = get_student_profile("s1", db)
    assert result.name == "Alice Updated"


# --- write_tutor_profile / get_tutor_profile / get_all_tutor_profiles ---

def test_write_and_get_tutor_profile(db):
    t = make_tutor()
    write_tutor_profile(t, db)
    result = get_tutor_profile("t1", db)
    assert result is not None
    assert result.name == "Bob"
    assert result.availability_slots == ["Mon 9am", "Wed 2pm"]
    assert result.max_students_per_slot == 2


def test_get_tutor_profile_returns_none_for_unknown(db):
    assert get_tutor_profile("unknown", db) is None


def test_get_all_tutor_profiles(db):
    write_tutor_profile(make_tutor(tutor_id="t1", name="Bob"), db)
    write_tutor_profile(make_tutor(tutor_id="t2", name="Carol"), db)
    results = get_all_tutor_profiles(db)
    assert len(results) == 2
    names = {r.name for r in results}
    assert names == {"Bob", "Carol"}


def test_get_all_tutor_profiles_empty(db):
    assert get_all_tutor_profiles(db) == []


# --- get_daily_stats ---

from api.services.pairing_store import get_daily_stats, get_tutor_utilisation, get_all_tutor_utilisation


def test_get_daily_stats_basic(db):
    write_pairing(make_pairing(pairing_id="p1", satisfaction_score=80.0, matched_at="2024-03-01T09:00:00"), db)
    write_pairing(make_pairing(pairing_id="p2", satisfaction_score=60.0, matched_at="2024-03-01T11:00:00"), db)
    write_pairing(make_pairing(pairing_id="p3", satisfaction_score=90.0, matched_at="2024-03-02T09:00:00"), db)

    stats = get_daily_stats(db_path=db)
    assert len(stats) == 2

    day1 = next(s for s in stats if s.date == "2024-03-01")
    assert day1.pairing_count == 2
    assert abs(day1.avg_satisfaction_score - 70.0) < 1e-9

    day2 = next(s for s in stats if s.date == "2024-03-02")
    assert day2.pairing_count == 1
    assert abs(day2.avg_satisfaction_score - 90.0) < 1e-9


def test_get_daily_stats_empty(db):
    assert get_daily_stats(db_path=db) == []


def test_get_daily_stats_start_date_filter(db):
    write_pairing(make_pairing(pairing_id="p1", matched_at="2024-03-01T09:00:00"), db)
    write_pairing(make_pairing(pairing_id="p2", matched_at="2024-03-05T09:00:00"), db)

    stats = get_daily_stats(start_date="2024-03-03", db_path=db)
    assert len(stats) == 1
    assert stats[0].date == "2024-03-05"


def test_get_daily_stats_end_date_filter(db):
    write_pairing(make_pairing(pairing_id="p1", matched_at="2024-03-01T09:00:00"), db)
    write_pairing(make_pairing(pairing_id="p2", matched_at="2024-03-05T09:00:00"), db)

    stats = get_daily_stats(end_date="2024-03-03", db_path=db)
    assert len(stats) == 1
    assert stats[0].date == "2024-03-01"


def test_get_daily_stats_date_range_filter(db):
    write_pairing(make_pairing(pairing_id="p1", matched_at="2024-03-01T09:00:00"), db)
    write_pairing(make_pairing(pairing_id="p2", matched_at="2024-03-05T09:00:00"), db)
    write_pairing(make_pairing(pairing_id="p3", matched_at="2024-03-10T09:00:00"), db)

    stats = get_daily_stats(start_date="2024-03-03", end_date="2024-03-07", db_path=db)
    assert len(stats) == 1
    assert stats[0].date == "2024-03-05"


# --- get_tutor_utilisation ---

def test_get_tutor_utilisation_basic(db):
    # Tutor has 2 availability slots; 1 confirmed pairing → 50%
    write_tutor_profile(make_tutor(tutor_id="t1", availability_slots=["Mon 9am", "Wed 2pm"]), db)
    write_pairing(make_pairing(pairing_id="p1", tutor_id="t1"), db)

    util = get_tutor_utilisation("t1", db)
    assert abs(util - 50.0) < 1e-9


def test_get_tutor_utilisation_zero_pairings(db):
    write_tutor_profile(make_tutor(tutor_id="t1", availability_slots=["Mon 9am", "Wed 2pm"]), db)
    assert get_tutor_utilisation("t1", db) == 0.0


def test_get_tutor_utilisation_unknown_tutor(db):
    assert get_tutor_utilisation("nonexistent", db) == 0.0


def test_get_tutor_utilisation_full(db):
    # 2 slots, 2 pairings → 100%
    write_tutor_profile(make_tutor(tutor_id="t1", availability_slots=["Mon 9am", "Wed 2pm"]), db)
    write_pairing(make_pairing(pairing_id="p1", tutor_id="t1"), db)
    write_pairing(make_pairing(pairing_id="p2", tutor_id="t1"), db)

    util = get_tutor_utilisation("t1", db)
    assert abs(util - 100.0) < 1e-9


# --- get_all_tutor_utilisation ---

def test_get_all_tutor_utilisation_empty(db):
    assert get_all_tutor_utilisation(db) == []


def test_get_all_tutor_utilisation_statuses(db):
    # Under-utilised: 1/4 slots = 25%
    write_tutor_profile(make_tutor(tutor_id="t1", name="Under", availability_slots=["a", "b", "c", "d"]), db)
    write_pairing(make_pairing(pairing_id="p1", tutor_id="t1"), db)

    # Appropriately-utilised: 3/4 slots = 75%
    write_tutor_profile(make_tutor(tutor_id="t2", name="Approp", availability_slots=["a", "b", "c", "d"]), db)
    write_pairing(make_pairing(pairing_id="p2", tutor_id="t2"), db)
    write_pairing(make_pairing(pairing_id="p3", tutor_id="t2"), db)
    write_pairing(make_pairing(pairing_id="p4", tutor_id="t2"), db)

    # Over-utilised: 4/4 slots = 100% (> 90)
    write_tutor_profile(make_tutor(tutor_id="t3", name="Over", availability_slots=["a", "b", "c", "d"]), db)
    write_pairing(make_pairing(pairing_id="p5", tutor_id="t3"), db)
    write_pairing(make_pairing(pairing_id="p6", tutor_id="t3"), db)
    write_pairing(make_pairing(pairing_id="p7", tutor_id="t3"), db)
    write_pairing(make_pairing(pairing_id="p8", tutor_id="t3"), db)

    results = get_all_tutor_utilisation(db)
    assert len(results) == 3

    by_id = {r.tutor_id: r for r in results}
    assert by_id["t1"].utilisation_status == "Under-utilised"
    assert by_id["t2"].utilisation_status == "Appropriately-utilised"
    assert by_id["t3"].utilisation_status == "Over-utilised"
