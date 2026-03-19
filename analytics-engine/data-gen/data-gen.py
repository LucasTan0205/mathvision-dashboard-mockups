# Generate only the raw data needed at the start of the pipeline
# Outputs:
# 1. students.csv
# 2. tutors.csv
# 3. pairings_raw.csv
#
# pairings_raw.csv is raw session-level tutor feedback data.
# It does NOT contain good/bad labels. Those should be derived later
# in the preprocessing / cosine-similarity labeling stage.

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

random.seed(822)
np.random.seed(42)

# -----------------------------
# Parameters
# -----------------------------
n_students = 80
n_tutors = 25
n_pairing_sessions = 400

curricula = ["Local", "IB", "IGCSE"]
topics = ["Algebra", "Fractions", "Geometry", "Calculus", "Statistics"]
slots = ["Mon_17", "Mon_19", "Tue_16", "Wed_18", "Sat_10"]
branches = ["Central", "West", "East"]
tutor_types = ["part-time", "full-time", "instructor"]

student_first_names = [
    "Liam", "Emma", "Noah", "Olivia", "Aiden", "Sophia", "Ethan",
    "Isabella", "Lucas", "Mia", "Benjamin", "Charlotte", "Daniel",
    "Amelia", "Matthew", "Harper", "Samuel", "Evelyn", "Ryan", "Ella",
    "Nathan", "Grace", "Chloe", "Caleb", "Joshua", "Hannah", "David",
    "Zoe", "Gabriel", "Sarah", "Jonathan", "Natalie", "Isaac", "Claire",
]
student_last_names = [
    "Tan", "Lim", "Wong", "Chua", "Koh", "Lee", "Ng", "Goh", "Ong", "Teo",
    "Yeo", "Toh", "Ho", "Chew", "Loh", "Neo"
]

tutor_titles = ["Mr", "Ms"]
tutor_first_names = [
    "Wei Ming", "Shu Ying", "Daniel", "Chloe", "Aaron", "Rachel", "Kelvin",
    "Jasmine", "Marcus", "Amanda", "Adrian", "Cheryl", "Darren", "Hannah",
    "Jeremy", "Valerie", "Brandon", "Alicia", "Nicholas", "Melissa",
    "Terence", "Serene", "Jason", "Joanna", "Marcus", "Sabrina"
]
tutor_last_names = [
    "Tan", "Lim", "Wong", "Chua", "Koh", "Lee", "Ng", "Goh", "Ong", "Teo",
    "Yeo", "Toh", "Ho", "Chew", "Loh", "Neo"
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

# -----------------------------
# Helpers
# -----------------------------
def generate_unique_name(used_names, first_names, last_names, prefix=None):
    max_combinations = len(first_names) * len(last_names)
    if prefix:
        max_combinations *= len(prefix)
    if len(used_names) >= max_combinations:
        raise ValueError("Ran out of unique name combinations.")

    while True:
        first = random.choice(first_names)
        last = random.choice(last_names)
        if prefix:
            title = random.choice(prefix)
            name = f"{title} {first} {last}"
        else:
            name = f"{first} {last}"
        if name not in used_names:
            used_names.add(name)
            return name


def random_date(start_date, end_date):
    delta_days = (end_date - start_date).days
    return start_date + timedelta(days=random.randint(0, delta_days))


def compute_grade_gap(student_grade, tutor_min, tutor_max):
    if tutor_min <= student_grade <= tutor_max:
        return 0
    return min(abs(student_grade - tutor_min), abs(student_grade - tutor_max))


def generate_feedback_text(student_row, tutor_row, topic):
    topic_match = int(student_row["weak_topic"] == tutor_row["specialty_topic"])
    curriculum_match = int(student_row["curriculum"] == tutor_row["primary_curriculum"])
    availability_match = int(student_row["requested_slot"] in tutor_row["available_slots"].split(";"))
    grade_gap = compute_grade_gap(
        student_row["grade_level"],
        tutor_row["preferred_min_grade"],
        tutor_row["preferred_max_grade"]
    )

    latent = (
        0.35 * topic_match +
        0.30 * curriculum_match +
        0.15 * availability_match +
        0.10 * (tutor_row["rating"] / 5.0) +
        0.10 * tutor_row["past_success_rate"] -
        0.05 * (grade_gap / 7.0) +
        np.random.normal(0, 0.08)
    )

    if latent >= 0.72:
        return random.choice(positive_templates).format(topic=topic)
    elif latent >= 0.50:
        return random.choice(neutral_templates).format(topic=topic)
    else:
        return random.choice(negative_templates).format(topic=topic)

# -----------------------------
# Generate Students
# -----------------------------
student_rows = []
used_student_names = set()

for i in range(n_students):
    student_rows.append({
        "student_id": f"S{i+1:03d}",
        "student_name": generate_unique_name(
            used_student_names,
            student_first_names,
            student_last_names
        ),
        "curriculum": random.choice(curricula),
        "grade_level": random.randint(5, 12),
        "weak_topic": random.choice(topics),
        "requested_slot": random.choice(slots),
        "branch": random.choice(branches),
    })

students_df = pd.DataFrame(student_rows)

# -----------------------------
# Generate Tutors
# -----------------------------
tutor_rows = []
used_tutor_names = set()

for i in range(n_tutors):
    min_grade = random.randint(5, 9)
    max_grade = min(12, min_grade + random.randint(2, 4))

    tutor_rows.append({
        "tutor_id": f"T{i+1:03d}",
        "tutor_name": generate_unique_name(
            used_tutor_names,
            tutor_first_names,
            tutor_last_names,
            prefix=tutor_titles
        ),
        "tutor_type": random.choices(tutor_types, weights=[0.5, 0.35, 0.15], k=1)[0],
        "primary_curriculum": random.choice(curricula),
        "specialty_topic": random.choice(topics),
        "years_experience": random.randint(1, 8),
        "rating": round(random.uniform(3.5, 5.0), 2),
        "available_slots": ";".join(sorted(random.sample(slots, random.randint(2, 4)))),
        "preferred_min_grade": min_grade,
        "preferred_max_grade": max_grade,
        "past_success_rate": round(random.uniform(0.55, 0.95), 2),
        "branch": random.choice(branches),
    })

tutors_df = pd.DataFrame(tutor_rows)

# -----------------------------
# Generate Raw Pairings
# -----------------------------
start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 5, 31)

pairing_rows = []

for i in range(n_pairing_sessions):
    student = students_df.sample(1).iloc[0]
    tutor = tutors_df.sample(1).iloc[0]
    topic = random.choice(topics)

    pairing_rows.append({
        "pairing_id": f"P{i+1:04d}",
        "student_id": student["student_id"],
        "student_name": student["student_name"],
        "tutor_id": tutor["tutor_id"],
        "tutor_name": tutor["tutor_name"],
        "session_date": random_date(start_date, end_date).date().isoformat(),
        "topic_covered": topic,
        "duration_hours": random.choice([1.0, 1.5, 2.0]),
        "tutor_feedback_text": generate_feedback_text(student, tutor, topic),
    })

pairings_raw_df = pd.DataFrame(pairing_rows).sort_values("session_date").reset_index(drop=True)

# -----------------------------
# Save files
# -----------------------------
students_path = "data/students.csv"
tutors_path = "data/tutors.csv"
pairings_path = "data/pairings_raw.csv"

students_df.to_csv(students_path, index=False)
tutors_df.to_csv(tutors_path, index=False)
pairings_raw_df.to_csv(pairings_path, index=False)

print("Generated:")
print(students_path)
print(tutors_path)
print(pairings_path)

print("\nShapes:")
print("students:", students_df.shape)
print("tutors:", tutors_df.shape)
print("pairings_raw:", pairings_raw_df.shape)