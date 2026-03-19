
# MathVision Tutor Matchmaking Prototype
## Spec B — Analytics & Tutor Matchmaking

## 1. Purpose

This stage performs analytics on the **labeled pairing dataset** produced by the preprocessing pipeline.

Input:
- students.csv
- tutors.csv
- pairings_labeled.csv

Outputs:
- tutor recommendation rankings
- model evaluation metrics
- decision-support insights

---

# 2. Objective

Predict which tutor is most likely to be effective for a student using:

- student–tutor compatibility
- tutor quality
- historical pairing outcomes

Approach:
Hybrid model combining rule scoring and machine learning.

---

# 3. Feature Engineering

## Student–Tutor Fit Features

- topic_match
- curriculum_match
- grade_gap
- availability_match
- same_branch

---

## Tutor Quality Features

- tutor_rating
- tutor_experience
- tutor_type
- past_success_rate

past_success_rate is derived from historical pairing outcomes.

---

## Pairing History Features

From labeled pairing data:

- avg_feedback_score
- lessons_count
- positive_note_count
- negative_note_count

---

# 4. Rule-Based Match Score

rule_score =
0.35 * topic_match +
0.25 * curriculum_match +
0.20 * (tutor_rating / 5) +
0.10 * availability_match +
0.10 * past_success_rate

Provides interpretable baseline ranking.

---

# 5. Machine Learning Model

Model:
Logistic Regression

Target:
good_pairing_label

Features:

- topic_match
- curriculum_match
- grade_gap
- availability_match
- same_branch
- tutor_rating
- tutor_experience
- past_success_rate
- avg_feedback_score
- lessons_count
- rule_score

---

# 6. Model Evaluation

Metrics:

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

---

# 7. Hybrid Tutor Ranking

final_score =
0.6 * rule_score +
0.4 * predicted_success_probability

Tutors ranked by final_score.

---

# 8. Explanation Layer

Provide reasoning for recommendations:

Examples:

- strong topic match
- high tutor rating
- positive historical outcomes

Example output:

"Recommended because tutor specializes in algebra and has strong historical success with similar students."

---

# 9. Demo Scenarios

Example students:

Sophia Lee — Local curriculum, weak in Fractions

Lucas Ong — IB curriculum, weak in Calculus

Emma Lim — IGCSE curriculum, weak in Geometry

---

# 10. Deliverables

The notebook should produce:

- tutor rankings
- model metrics
- example matchmaking scenarios
