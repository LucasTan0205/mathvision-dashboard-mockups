# MathVision Hybrid-Lite Matchmaking Notebook — Updated Spec (CSV-Driven)

## 1) Purpose

Build a single, presentation-ready Python notebook that recommends tutors for a student using a hybrid-lite approach:

- Rule-based match scoring for interpretability.
- Logistic regression success prediction for data-driven adjustment.
- Combined score for final ranking.

This version is driven by the provided CSV files and does not generate synthetic data in the notebook.

## 2) Inputs (required files)

Notebook must load data from these files in the project root:

- `mathvision_students_named.csv`
- `mathvision_tutors_named.csv`
- `mathvision_historical_matches_named.csv`

Expected behavior:

- Parse `available_slots` in tutors as semicolon-separated values (e.g., `"Mon_19;Tue_16"`).
- Keep names (e.g., `student_name`, `tutor_name`) in the data but modeling should be based on IDs and numeric fields.

## 3) Required columns

### Students CSV
- `student_id`
- `student_name`
- `curriculum`
- `grade_level`
- `weak_topic`
- `requested_slot`
- `branch`

### Tutors CSV
- `tutor_id`
- `tutor_name`
- `primary_curriculum`
- `specialty_topic`
- `years_experience`
- `rating`
- `available_slots`
- `branch`
- `past_success_rate`
- `preferred_min_grade`
- `preferred_max_grade`

### Historical matches CSV
- `student_id`
- `student_name`
- `tutor_id`
- `tutor_name`
- `topic_match`
- `curriculum_match`
- `availability_match`
- `grade_gap`
- `tutor_rating`
- `tutor_experience`
- `past_success_rate`
- `match_score_rule`
- `success_label`

## 4) Scoring and feature definitions

- `topic_match = 1` if tutor specialty topic equals student weak topic, else `0`.
- `curriculum_match = 1` if tutor primary curriculum equals student curriculum, else `0`.
- `availability_match = 1` if student `requested_slot` exists in tutor `available_slots`.
- `grade_gap = abs(student.grade_level - ((preferred_min_grade + preferred_max_grade) / 2))`.
- `tutor_rating`, `tutor_experience`, `past_success_rate` come from tutor row.
- Rule score:
  - `match_score_rule = 0.35*topic_match + 0.25*curriculum_match + 0.20*(tutor_rating/5) + 0.10*availability_match + 0.10*past_success_rate`
- Final ranking score:
  - `final_score = 0.6 * rule_score + 0.4 * predicted_success_probability`

## 5) Required notebook functions

Implement at least:

- `load_data_and_prepare(path_students, path_tutors, path_matches)`  
  - Loads CSVs, parses `available_slots`, converts numeric columns, prints schema/null checks, and returns `students_df`, `tutors_df`, `historical_matches_df`.
- `parse_slots(slot_value)`  
  - Converts semicolon-separated slot text into Python list.
- `compute_rule_features(student_row, tutor_row)`  
  - Returns topic/curriculum/availability matches, grade gap, tutor rating/experience/success, and rule score.
- `train_success_model(train_df)`  
  - Trains logistic regression using feature columns below, returns `(model, scaler, feature_cols)`.
- `rank_tutors_for_student(student_row, tutors_df, model, scaler, feature_cols)`  
  - Computes features for all tutors, predicts success probability, computes final score, builds explanation, and returns ranked dataframe.

## 6) Modeling requirements

- Use `train_test_split(..., test_size=0.2, random_state=42)`.
- Standardize numeric features with `StandardScaler`:
  - `grade_gap`
  - `tutor_rating`
  - `tutor_experience`
  - `past_success_rate`
  - `match_score_rule`
- Train logistic regression with fixed random state.
- Report:
  - Accuracy
  - Precision
  - Recall
  - F1-score
  - Confusion matrix plot

Feature columns:
- `topic_match`
- `curriculum_match`
- `availability_match`
- `grade_gap`
- `tutor_rating`
- `tutor_experience`
- `past_success_rate`
- `match_score_rule`

## 7) Ranking output

`rank_tutors_for_student` must return columns:
- `tutor_id`
- `specialty_topic`
- `primary_curriculum`
- `rating`
- `years_experience`
- `rule_score`
- `predicted_success_probability`
- `final_score`
- `explanation`

Explanation should be a readable string built from matching flags (topic match, curriculum match, availability, high rating, high past success rate).

## 8) Notebook sections

The notebook should retain a clear 10-part pedagogical structure:

1. Business context  
2. Imports and setup  
3. Load data from CSV files  
4. Exploratory analysis  
5. Rule-based scoring helper  
6. Train logistic regression model  
7. Ranking engine  
8. Demo scenarios (Local/Fractions, IB/Calculus, IGCSE/Geometry)  
9. Business interpretation  
10. Limitations and improvements

Required visuals include:
- Tutor rating histogram.
- Top-5 final-score bar chart.
- Confusion matrix.

## 9) Definition of done

- Notebook runs from top to bottom with all three CSVs.
- Functions execute without manual intervention.
- Model trains successfully and metrics are printed.
- Ranking works for the three required scenarios and includes top-5 output with `final_score`.
- Recommendation output includes explanations.
