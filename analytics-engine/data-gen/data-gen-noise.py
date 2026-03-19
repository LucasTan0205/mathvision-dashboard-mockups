# Raw Data Generator with Tunable Noise

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# -----------------------------
# PARAMETERS
# -----------------------------

N_STUDENTS = 80
N_TUTORS = 25
N_SESSIONS = 400

NOISE_LEVEL = 0.6  # 0.0 clean -> 1.0 very messy

random.seed(42)
np.random.seed(42)

curricula = ["Local","IB","IGCSE"]
topics = ["Algebra","Fractions","Geometry","Calculus","Statistics"]
slots = ["Mon_17","Mon_19","Tue_16","Wed_18","Sat_10"]
branches = ["Central","West","East"]
tutor_types = ["part-time","full-time","instructor"]

student_first = ["Liam","Emma","Noah","Olivia","Aiden","Sophia","Ethan","Isabella","Lucas","Mia","Benjamin","Charlotte","Daniel","Amelia","Matthew","Harper","Samuel","Evelyn","Ryan","Ella"]
last_names = ["Tan","Lim","Wong","Chua","Koh","Lee","Ng","Goh","Ong","Teo","Yeo","Toh","Ho","Chew","Loh","Neo"]

tutor_first = ["Wei Ming","Shu Ying","Daniel","Chloe","Aaron","Rachel","Kelvin","Jasmine","Marcus","Amanda","Adrian","Cheryl","Darren","Hannah","Jeremy","Valerie","Brandon","Alicia"]
titles = ["Mr","Ms"]

positive_templates=[
"Student showed improvement in {topic}.",
"Student understood {topic} well today.",
"Good progress in {topic}.",
"Student confidently solved {topic} questions."
]

neutral_templates=[
"Worked on {topic}. Student partially understood.",
"Student required some guidance for {topic}.",
"Covered {topic}. More practice needed."
]

negative_templates=[
"Student struggled with {topic}.",
"Student did not understand {topic}.",
"Student confused by {topic}."
]

def make_name():
    return f"{random.choice(student_first)} {random.choice(last_names)}"

def make_tutor():
    return f"{random.choice(titles)} {random.choice(tutor_first)} {random.choice(last_names)}"

def rand_date(start,end):
    return start + timedelta(days=random.randint(0,(end-start).days))

def noisy_score(base):
    return base + np.random.normal(0,NOISE_LEVEL)

def feedback(score,topic):
    if score > 0.6:
        return random.choice(positive_templates).format(topic=topic)
    elif score > 0.3:
        return random.choice(neutral_templates).format(topic=topic)
    else:
        return random.choice(negative_templates).format(topic=topic)

# -----------------------------
# STUDENTS
# -----------------------------

students=[{
"student_id":f"S{i+1:03d}",
"student_name":make_name(),
"curriculum":random.choice(curricula),
"grade_level":random.randint(5,12),
"weak_topic":random.choice(topics),
"requested_slot":random.choice(slots),
"branch":random.choice(branches)
} for i in range(N_STUDENTS)]

students_df=pd.DataFrame(students)

# -----------------------------
# TUTORS
# -----------------------------

tutors=[]
for i in range(N_TUTORS):

    min_g=random.randint(5,9)
    max_g=min(12,min_g+random.randint(2,4))

    tutors.append({
    "tutor_id":f"T{i+1:03d}",
    "tutor_name":make_tutor(),
    "tutor_type":random.choice(tutor_types),
    "primary_curriculum":random.choice(curricula),
    "specialty_topic":random.choice(topics),
    "years_experience":random.randint(1,8),
    "rating":round(random.uniform(3.5,5.0),2),
    "available_slots":";".join(random.sample(slots,3)),
    "preferred_min_grade":min_g,
    "preferred_max_grade":max_g,
    "branch":random.choice(branches)
    })

tutors_df=pd.DataFrame(tutors)

# -----------------------------
# RAW PAIRINGS
# -----------------------------

start=datetime(2025,1,1)
end=datetime(2025,5,31)

rows=[]

for i in range(N_SESSIONS):

    s=students_df.sample(1).iloc[0]
    t=tutors_df.sample(1).iloc[0]

    topic=random.choice(topics)

    topic_match=int(s["weak_topic"]==t["specialty_topic"])
    curriculum_match=int(s["curriculum"]==t["primary_curriculum"])

    base=(0.4*topic_match + 0.3*curriculum_match + 0.2*(t["rating"]/5))

    score=noisy_score(base)

    rows.append({
    "pairing_id":f"P{i+1:04d}",
    "student_id":s["student_id"],
    "student_name":s["student_name"],
    "tutor_id":t["tutor_id"],
    "tutor_name":t["tutor_name"],
    "session_date":rand_date(start,end).date(),
    "topic_covered":topic,
    "duration_hours":random.choice([1,1.5,2]),
    "tutor_feedback_text":feedback(score,topic)
    })

pairings_df=pd.DataFrame(rows)

# -----------------------------
# SAVE
# -----------------------------

students_path = "data/students.csv"
tutors_path = "data/tutors.csv"
pairings_path = "data/pairings_raw.csv"

students_df.to_csv(students_path, index=False)
tutors_df.to_csv(tutors_path, index=False)
pairings_df.to_csv(pairings_path, index=False)

print("Generated datasets")
print("students:",students_df.shape)
print("tutors:",tutors_df.shape)
print("pairings_raw:",pairings_df.shape)
print("Noise level:",NOISE_LEVEL)