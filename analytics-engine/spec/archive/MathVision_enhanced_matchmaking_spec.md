# MathVision Tutor Matchmaking Prototype (Enhanced Spec)

## Overview

This prototype demonstrates a **hybrid tutor matching system** that recommends tutors for students using:

1. Rule-based matching logic
2. Machine learning prediction (Logistic Regression)
3. Signals derived from **tutor session notes**

Unlike a simplified prototype that assumes historical match data already exists, this design explicitly models the **data pipeline required to construct the training dataset** from operational records.

The notebook will simulate the full pipeline using synthetic data.

---

# 1. Problem Context

From operational observations:

- Tutor assignments are manually coordinated.
- Tutors lack centralized visibility of student history.
- Session feedback exists but is stored only as notes.
- Curriculum variability makes tutor matching inconsistent.

Operational records currently include:

- Tutor check-in / check-out
- Tutor teaching logs
- Student attendance
- Tutor session notes

These datasets contain the raw signals required to construct a **historical tutor-student match dataset**.

The prototype demonstrates how these operational records can be transformed into an analytics dataset used to improve tutor assignment decisions.

---

# 2. System Architecture

The prototype simulates four logical layers.

## Layer 1 — Raw Operational Data

Simulated datasets representing MathVision's current operations:

1. Students Master Table
2. Tutors Master Table
3. Lesson Logs
4. Tutor Attendance Logs
5. Student Attendance Logs
6. Tutor Session Notes

These represent the data currently collected by the centre.

---

## Layer 2 — Data Processing Pipeline

Raw data is transformed into tutor-student engagement records.

Key transformations:

- Identify **who taught who**
- Aggregate lessons into tutoring engagements
- Extract signals from tutor notes
- Engineer matching features

Output:

**Historical Match Dataset**

---

## Layer 3 — Machine Learning Dataset

Each row represents a tutor-student pairing with engineered features and a success label.

Example row:

| student_id | tutor_id | topic_match | curriculum_match | tutor_rating | lessons_count | avg_understanding | success_label |

This dataset trains the model.

---

## Layer 4 — Tutor Recommendation Engine

For a new student request:

1. Compute rule-based match score
2. Predict success probability using ML
3. Combine both scores
4. Rank tutors

Final score:

final_score = 0.6 × rule_score + 0.4 × predicted_success_probability

---

# 3. Raw Data Specifications

## 3.1 Students Master Table

Columns:

- student_id
- student_name
- curriculum (Local / IB / IGCSE)
- grade_level
- branch

Purpose:

Defines student profile used in tutor matching.

---

## 3.2 Tutors Master Table

Columns:

- tutor_id
- tutor_name
- tutor_type (part-time / full-time / instructor)
- primary_curriculum
- specialty_topic
- years_experience
- rating
- preferred_min_grade
- preferred_max_grade
- available_slots
- branch

Purpose:

Defines tutor profile and capabilities.

---

## 3.3 Lesson Logs

Columns:

- lesson_id
- lesson_date
- student_id
- tutor_id
- duration_hours
- topic_taught
- requested_slot

Purpose:

Identifies tutor-student pairings and session duration.

---

## 3.4 Student Attendance Logs

Columns:

- attendance_id
- student_id
- lesson_date
- check_in_time
- check_out_time

Purpose:

Confirms student presence during lesson.

---

## 3.5 Tutor Attendance Logs

Columns:

- attendance_id
- tutor_id
- lesson_date
- check_in_time
- check_out_time

Purpose:

Confirms tutor availability during lessons.

---

## 3.6 Tutor Session Notes

Columns:

- note_id
- lesson_id
- student_id
- tutor_id
- topics_covered
- understanding_level (low / medium / high)
- behaviour_flag (distracted / neutral / engaged)
- tutor_impression (struggling / steady / improving)
- note_text

Purpose:

Provides qualitative assessment of student performance.

This dataset is used to derive **success signals**.

---

# 4. Success Label Definition

Because the centre does not collect student feedback ratings, success must be derived from tutor observations.

Success is defined using tutor note indicators.

Example rule:

success_label = 1 if

- tutor_impression == "improving"
OR
- average understanding level >= medium

Otherwise:

success_label = 0

This creates the supervised learning target.

---

# 5. Feature Engineering

The notebook constructs a historical match dataset by aggregating lessons.

Grouping key:

(student_id, tutor_id)

Features engineered:

### Matching Features

- topic_match
- curriculum_match
- availability_match
- grade_gap
- same_branch

### Tutor Quality Features

- tutor_rating
- tutor_experience
- tutor_type
- past_success_rate

### Engagement Features

- lessons_count
- total_hours
- recency_days
- avg_understanding_score
- improving_trend_flag

### Derived Score

- match_score_rule

### Target

- success_label

---

# 6. Rule-Based Matching Score

Rule score formula:

rule_score =
0.35 × topic_match +
0.25 × curriculum_match +
0.20 × (rating / 5) +
0.10 × availability_match +
0.10 × past_success_rate

This score provides an interpretable baseline ranking.

---

# 7. Machine Learning Model

Model:

Logistic Regression

Goal:

Predict probability that a tutor-student pairing results in successful learning outcomes.

Input features:

- topic_match
- curriculum_match
- availability_match
- grade_gap
- same_branch
- tutor_rating
- tutor_experience
- past_success_rate
- lessons_count
- avg_understanding_score
- improving_trend_flag
- match_score_rule

Evaluation metrics:

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

---

# 8. Tutor Recommendation Logic

For a new student request:

1. Extract student profile
2. Compare against all tutors
3. Compute rule score
4. Predict success probability
5. Combine scores

Final ranking:

sort tutors by final_score descending

---

# 9. Explanation Generation

Each recommendation should include a readable explanation.

Example:

"Strong curriculum and topic match, high tutor rating, and positive historical engagement outcomes."

Possible explanation signals:

- strong topic match
- curriculum familiarity
- high tutor rating
- positive engagement history

---

# 10. Notebook Structure

## Section 1 — Business Context

Explain the tutor assignment problem.

## Section 2 — Raw Data Generation

Generate synthetic datasets:

- students
- tutors
- lesson logs
- attendance logs
- tutor notes

## Section 3 — Data Pipeline Construction

Transform raw operational records into historical match dataset.

## Section 4 — Exploratory Data Analysis

Visualizations:

- tutor experience distribution
- curriculum distribution
- tutor note impression distribution

## Section 5 — Rule-Based Matching

Compute rule scores.

## Section 6 — Success Label Construction

Derive labels from tutor notes.

## Section 7 — Model Training

Train logistic regression model.

## Section 8 — Tutor Ranking Engine

Rank tutors for new student requests.

## Section 9 — Demo Scenarios

Example students:

- Sophia Lee (Local, Fractions)
- Lucas Ong (IB, Calculus)
- Emma Lim (IGCSE, Geometry)

## Section 10 — Limitations

- Synthetic data
- Simplified tutor notes
- Prototype only

---

# 11. Deliverables

The coding agent should generate:

1. `mathvision_tutor_matching.ipynb`
2. Synthetic datasets
3. Model training pipeline
4. Tutor ranking demonstration

The notebook must run **end-to-end with no external files required**.

---

# End of Spec