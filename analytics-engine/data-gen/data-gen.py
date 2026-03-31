# Generate raw data for the MathVision pipeline
# Outputs: students.csv, tutors.csv, pairings_raw.csv
#
# v2 — expanded to ~2 years of sessions with realistic seasonality:
#   - Higher volume on evenings (PM/Eve) and weekends
#   - Exam-season spikes (Mar, Oct) with ~2× normal volume
#   - ~3,000 sessions total for meaningful Prophet forecasting

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

random.seed(822)
np.random.seed(42)

# ── Parameters ────────────────────────────────────────────────────
n_students = 80
n_tutors = 25

START_DATE = datetime(2024, 1, 1)
END_DATE   = datetime(2025, 12, 31)

# Base daily session counts per day-of-week (0=Mon … 6=Sun)
# Weekends and Fri evenings are busier
BASE_DAILY_SESSIONS = {0: 8, 1: 8, 2: 8, 3: 9, 4: 10, 5: 16, 6: 6}

# Exam-season months get a multiplier
EXAM_MONTHS = {3: 1.8, 4: 1.5, 9: 1.4, 10: 1.9, 11: 1.6}

# Time-slot distribution per day-of-week
# (morning, afternoon, evening) weights
SLOT_WEIGHTS = {
    0: (0.1, 0.4, 0.5),   # Mon — mostly PM/Eve
    1: (0.1, 0.4, 0.5),
    2: (0.1, 0.4, 0.5),
    3: (0.1, 0.4, 0.5),
    4: (0.1, 0.3, 0.6),   # Fri — heavy evening
    5: (0.3, 0.5, 0.2),   # Sat — morning/afternoon
    6: (0.2, 0.5, 0.3),   # Sun
}

curricula   = ["Local", "IB", "IGCSE"]
topics      = ["Algebra", "Fractions", "Geometry", "Calculus", "Statistics"]
slots       = ["Mon_17", "Mon_19", "Tue_16", "Wed_18", "Sat_10"]
branches    = ["Central", "West", "East"]
tutor_types = ["part-time", "full-time", "instructor"]

student_first_names = [
    "Liam","Emma","Noah","Olivia","Aiden","Sophia","Ethan","Isabella","Lucas","Mia",
    "Benjamin","Charlotte","Daniel","Amelia","Matthew","Harper","Samuel","Evelyn",
    "Ryan","Ella","Nathan","Grace","Chloe","Caleb","Joshua","Hannah","David","Zoe",
    "Gabriel","Sarah","Jonathan","Natalie","Isaac","Claire",
]
student_last_names = [
    "Tan","Lim","Wong","Chua","Koh","Lee","Ng","Goh","Ong","Teo","Yeo","Toh","Ho","Chew","Loh","Neo"
]
tutor_titles     = ["Mr", "Ms"]
tutor_first_names = [
    "Wei Ming","Shu Ying","Daniel","Chloe","Aaron","Rachel","Kelvin","Jasmine","Marcus",
    "Amanda","Adrian","Cheryl","Darren","Hannah","Jeremy","Valerie","Brandon","Alicia",
    "Nicholas","Melissa","Terence","Serene","Jason","Joanna","Marcus","Sabrina"
]
tutor_last_names = [
    "Tan","Lim","Wong","Chua","Koh","Lee","Ng","Goh","Ong","Teo","Yeo","Toh","Ho","Chew","Loh","Neo"
]

positive_templates = [
    "Student showed improvement in {topic} and was more confident today.",
    "Good progress in {topic}. Student understood the practice questions better.",
    "Student was engaged and demonstrated stronger understanding of {topic}.",
    "Clear improvement in {topic}; can move towards more advanced questions next lesson.",
]
neutral_templates = [
    "Covered {topic}. Student showed partial understanding and needs more reinforcement.",
    "Student was able to follow {topic} with guidance but still needs practice.",
    "Session on {topic} was steady. Student grasped some parts but not yet fully consistent.",
    "Worked through {topic}. More repetition will be needed to build confidence.",
]
negative_templates = [
    "Student still struggles with {topic} and needs more guided practice.",
    "Student did not fully understand {topic} today and showed some confusion.",
    "Progress in {topic} remains limited. More foundational work is needed.",
    "Student was distracted during {topic} and could not apply the concepts independently.",
]

# ── Helpers ───────────────────────────────────────────────────────
def generate_unique_name(used, firsts, lasts, prefix=None):
    while True:
        first = random.choice(firsts)
        last  = random.choice(lasts)
        name  = f"{random.choice(prefix)} {first} {last}" if prefix else f"{first} {last}"
        if name not in used:
            used.add(name)
            return name

def compute_grade_gap(grade, mn, mx):
    if mn <= grade <= mx:
        return 0
    return min(abs(grade - mn), abs(grade - mx))

def generate_feedback(student, tutor, topic):
    latent = (
        0.35 * int(student["weak_topic"] == tutor["specialty_topic"]) +
        0.30 * int(student["curriculum"] == tutor["primary_curriculum"]) +
        0.15 * int(student["requested_slot"] in tutor["available_slots"].split(";")) +
        0.10 * (tutor["rating"] / 5.0) +
        0.10 * tutor["past_success_rate"] -
        0.05 * (compute_grade_gap(student["grade_level"], tutor["preferred_min_grade"], tutor["preferred_max_grade"]) / 7.0) +
        np.random.normal(0, 0.08)
    )
    if latent >= 0.72:
        return random.choice(positive_templates).format(topic=topic)
    elif latent >= 0.50:
        return random.choice(neutral_templates).format(topic=topic)
    return random.choice(negative_templates).format(topic=topic)

# ── Students ──────────────────────────────────────────────────────
used_student_names = set()
student_rows = []
for i in range(n_students):
    student_rows.append({
        "student_id":    f"S{i+1:03d}",
        "student_name":  generate_unique_name(used_student_names, student_first_names, student_last_names),
        "curriculum":    random.choice(curricula),
        "grade_level":   random.randint(5, 12),
        "weak_topic":    random.choice(topics),
        "requested_slot":random.choice(slots),
        "branch":        random.choice(branches),
    })
students_df = pd.DataFrame(student_rows)

# ── Tutors ────────────────────────────────────────────────────────
used_tutor_names = set()
tutor_rows = []
for i in range(n_tutors):
    mn = random.randint(5, 9)
    mx = min(12, mn + random.randint(2, 4))
    tutor_rows.append({
        "tutor_id":           f"T{i+1:03d}",
        "tutor_name":         generate_unique_name(used_tutor_names, tutor_first_names, tutor_last_names, prefix=tutor_titles),
        "tutor_type":         random.choices(tutor_types, weights=[0.5, 0.35, 0.15], k=1)[0],
        "primary_curriculum": random.choice(curricula),
        "specialty_topic":    random.choice(topics),
        "years_experience":   random.randint(1, 8),
        "rating":             round(random.uniform(3.5, 5.0), 2),
        "available_slots":    ";".join(sorted(random.sample(slots, random.randint(2, 4)))),
        "preferred_min_grade":mn,
        "preferred_max_grade":mx,
        "past_success_rate":  round(random.uniform(0.55, 0.95), 2),
        "branch":             random.choice(branches),
    })
tutors_df = pd.DataFrame(tutor_rows)

# ── Pairings — seasonality-aware generation ───────────────────────
TIME_SLOTS = ["morning", "afternoon", "evening"]

pairing_rows = []
pairing_id   = 1
current      = START_DATE

while current <= END_DATE:
    dow        = current.weekday()
    month      = current.month
    base_count = BASE_DAILY_SESSIONS[dow]
    multiplier = EXAM_MONTHS.get(month, 1.0)
    # Add Gaussian noise so it doesn't look perfectly regular
    n_sessions = max(0, int(np.random.normal(base_count * multiplier, base_count * 0.2)))

    slot_w = SLOT_WEIGHTS[dow]

    for _ in range(n_sessions):
        student  = students_df.sample(1).iloc[0]
        tutor    = tutors_df.sample(1).iloc[0]
        topic    = random.choice(topics)
        time_slot = random.choices(TIME_SLOTS, weights=slot_w, k=1)[0]

        pairing_rows.append({
            "pairing_id":         f"P{pairing_id:05d}",
            "student_id":         student["student_id"],
            "student_name":       student["student_name"],
            "tutor_id":           tutor["tutor_id"],
            "tutor_name":         tutor["tutor_name"],
            "session_date":       current.date().isoformat(),
            "time_slot":          time_slot,
            "topic_covered":      topic,
            "duration_hours":     random.choice([1.0, 1.5, 2.0]),
            "tutor_feedback_text":generate_feedback(student, tutor, topic),
        })
        pairing_id += 1

    current += timedelta(days=1)

pairings_df = pd.DataFrame(pairing_rows)

# ── Save ──────────────────────────────────────────────────────────
students_df.to_csv("data/raw/students.csv", index=False)
tutors_df.to_csv("data/raw/tutors.csv", index=False)
pairings_df.to_csv("data/raw/pairings_raw.csv", index=False)

print(f"students:     {students_df.shape}")
print(f"tutors:       {tutors_df.shape}")
print(f"pairings_raw: {pairings_df.shape}")
print(f"Date range:   {pairings_df['session_date'].min()} → {pairings_df['session_date'].max()}")
