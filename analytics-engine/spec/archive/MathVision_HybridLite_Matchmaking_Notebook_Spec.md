# MathVision Hybrid-Lite Matchmaking Notebook Spec

## Purpose

Build a **Jupyter notebook (`.ipynb`) analytics prototype** for MathVision that recommends and ranks tutors for a student using a **hybrid-lite approach**:

1. a **rule-based weighted match score**
2. a **simple machine learning success predictor**
3. a **final combined score** for ranking

This is intentionally designed to be:
- more advanced than a pure rule-based system
- still easy for a student with limited analytics background to understand and explain
- feasible in one notebook with synthetic data
- aligned with the project requirement for an analytics / AI Python prototype

The notebook should support the project brief's requirement for an analytics or AI Python prototype and should directly address the team's observed issues around random tutor assignment, missing student context, and curriculum variability.

## High-level idea

### Problem being solved
MathVision currently has issues such as:
- random tutor assignment
- no centralized student context
- curriculum variability across students
- reliance on manual coordination

This notebook demonstrates a better way to allocate tutors.

### Core prototype concept
For each student request, compute:
- a **rule score** based on obvious fit
- a **predicted success probability** using a simple model
- a **final hybrid score** used to rank tutors

### Recommended final formula
`final_score = 0.6 * rule_score + 0.4 * predicted_success_probability`

This gives:
- strong explainability from the rules
- a simple “data-driven” enhancement from machine learning

## Story the presenter should be able to explain

> We built a hybrid tutor matching system. First, it computes a rule-based score using topic fit, curriculum fit, availability, and tutor quality. Then, we train a simple classification model on historical matching outcomes to estimate the probability that a tutor-student pairing will succeed. Finally, we combine both into one hybrid score and rank tutors. This is better than random assignment because it is more consistent, more explainable, and uses historical data to improve decisions.

## Data design

### 1. Student table
Create a `students_df` dataframe with these columns:

- `student_id`
- `curriculum` -> Local / IB / IGCSE
- `grade_level` -> integer, e.g. 5 to 12
- `weak_topic` -> Algebra / Fractions / Geometry / Calculus / Statistics
- `requested_slot` -> e.g. Mon_17, Tue_16
- `branch` -> optional branch or location

### 2. Tutor table
Create a `tutors_df` dataframe with these columns:

- `tutor_id`
- `primary_curriculum`
- `specialty_topic`
- `years_experience`
- `rating`
- `available_slots`
- `branch`
- `past_success_rate`
- `preferred_min_grade`
- `preferred_max_grade`

### 3. Historical matches table
Create a `historical_matches_df` dataframe where each row is a past tutor-student pairing with:

- `student_id`
- `tutor_id`
- `topic_match`
- `curriculum_match`
- `availability_match`
- `grade_gap`
- `tutor_rating`
- `tutor_experience`
- `past_success_rate`
- `match_score_rule`
- `success_label`

## Synthetic data generation

### Recommended sizes
- 80 students
- 25 tutors
- 400 historical matches

### Student generation
Use:
- curricula from `["Local", "IB", "IGCSE"]`
- topics from `["Algebra", "Fractions", "Geometry", "Calculus", "Statistics"]`
- grades from 5 to 12
- slots from `["Mon_17", "Mon_19", "Tue_16", "Wed_18", "Sat_10"]`

### Tutor generation
Use:
- same curriculum and topic lists
- ratings from 3.5 to 5.0
- years_experience from 1 to 8
- past_success_rate from 0.55 to 0.95
- 2 to 4 available slots per tutor
- preferred grade range fields

### Historical label generation
For each synthetic historical match:
1. randomly choose a student
2. randomly choose a tutor
3. compute matching features
4. compute a latent success score
5. convert to `success_label`

Suggested latent score:
`latent_success = 0.35*topic_match + 0.30*curriculum_match + 0.15*availability_match + 0.10*(rating/5) + 0.10*past_success_rate - 0.05*grade_gap_normalized + noise`

Then threshold to produce a binary label.

## Rule-based score design

Use:
`rule_score = 0.35*topic_match + 0.25*curriculum_match + 0.20*(rating/5) + 0.10*availability_match + 0.10*past_success_rate`

Definitions:
- `topic_match` = 1 if tutor specialty equals student weak topic else 0
- `curriculum_match` = 1 if tutor curriculum equals student curriculum else 0
- `availability_match` = 1 if requested slot is in tutor available slots else 0
- `rating/5` = normalized tutor rating
- `past_success_rate` = already scaled between 0 and 1

## Machine learning design

### Main model
Use **Logistic Regression** as the main model.

Optional backup:
- Decision Tree Classifier

### Target
Predict `success_label`.

### Feature columns
Use:
- `topic_match`
- `curriculum_match`
- `availability_match`
- `grade_gap`
- `tutor_rating`
- `tutor_experience`
- `past_success_rate`
- `match_score_rule`

### Why this level
It is more advanced than pure weighted scoring, but still easy to explain.

## Preprocessing

The notebook must:
1. inspect the data
2. check nulls
3. ensure numeric columns are numeric
4. split train / test
5. standardize numeric features for logistic regression

Use `StandardScaler` for:
- `grade_gap`
- `tutor_rating`
- `tutor_experience`
- `past_success_rate`
- `match_score_rule`

Use:
- 80 percent train
- 20 percent test
- `random_state=42`

## Evaluation metrics

Required:
- Accuracy
- Precision
- Recall
- F1-score
- Confusion matrix

Optional:
- ROC-AUC

The notebook should explain these in plain English.

## Final ranking process

For one selected student:
1. compute rule score for every tutor
2. generate model features for each student-tutor pair
3. predict success probability
4. compute final hybrid score
5. sort descending

Final output columns:
- `tutor_id`
- `specialty_topic`
- `primary_curriculum`
- `rating`
- `years_experience`
- `rule_score`
- `predicted_success_probability`
- `final_score`
- `explanation`

## Explanation generation

Generate a short explanation string.

Examples:
- “Strong topic and curriculum fit”
- “Available at requested slot”
- “High tutor rating”
- “Good past success rate”

Combine the applicable phrases into one readable explanation per tutor.

## Notebook structure

### Section 1 — Title and business context
Explain the MathVision problem and what the prototype solves.

### Section 2 — Imports and setup
Import:
- pandas
- numpy
- matplotlib.pyplot
- sklearn model selection tools
- sklearn preprocessing
- `LogisticRegression`
- sklearn metrics

### Section 3 — Synthetic data generation
Generate:
- `students_df`
- `tutors_df`
- `historical_matches_df`

Display sample rows and shapes.

### Section 4 — Exploratory analysis
Add 2 to 4 simple visuals:
- count of students by curriculum
- count of tutors by specialty topic
- tutor rating distribution
- success label distribution

### Section 5 — Rule-based scoring
Define helper functions and show one worked example.

### Section 6 — Model training
Prepare features and target, train logistic regression, and print metrics.

### Section 7 — Hybrid ranking engine
For one chosen student:
- score all tutors
- predict success probabilities
- compute final hybrid score
- display top 5 tutors

### Section 8 — Demo scenarios
Run the ranking for at least 3 student cases:
1. Local curriculum, weak in Fractions
2. IB curriculum, weak in Calculus
3. IGCSE curriculum, weak in Geometry

### Section 9 — Business interpretation
Explain why this is better than random assignment.

### Section 10 — Limitations and future improvements
Mention:
- synthetic data
- simple features
- no real scheduling engine
- future extension could include retention or manpower analytics

## Charts required

Include at least:
1. tutor rating histogram
2. top-5 tutor final score bar chart for one student
3. confusion matrix plot

Use matplotlib only.

## Function requirements

Implement at least these functions:

### `generate_students(n_students, seed)`
Returns the student dataframe.

### `generate_tutors(n_tutors, seed)`
Returns the tutor dataframe.

### `compute_rule_features(student_row, tutor_row)`
Returns:
- topic_match
- curriculum_match
- availability_match
- grade_gap
- tutor_rating
- tutor_experience
- past_success_rate
- match_score_rule

### `generate_historical_matches(students_df, tutors_df, n_samples, seed)`
Returns historical matches dataframe.

### `train_success_model(train_df)`
Returns:
- trained logistic regression model
- scaler
- feature column list

### `rank_tutors_for_student(student_row, tutors_df, model, scaler, feature_cols)`
Returns ranked tutor dataframe.

## Coding style requirements

- keep code beginner-friendly
- use clear variable names
- add comments for major blocks
- use short functions
- avoid classes unless absolutely necessary
- all synthetic data should be generated inside the notebook
- notebook must run top-to-bottom without external files

## Deliverables

The coding agent must produce:
1. `mathvision_hybrid_matchmaking.ipynb`
2. all code and markdown in one notebook
3. no external dataset required
4. top-5 tutor ranking output for 3 demo students

Optional:
- export ranked results to CSV
- save one chart as image

## Definition of done

The notebook is complete when:
- it runs successfully from top to bottom
- data is generated successfully
- logistic regression is trained successfully
- evaluation metrics are shown
- tutor recommendations are shown for at least 3 students
- final hybrid score is used
- explanations are shown for top tutors
- the user can explain the whole thing confidently in under 2 minutes

## Explicit non-goals

Do not implement:
- XGBoost
- neural networks
- learning-to-rank frameworks
- SHAP / LIME
- fairness toolkits
- production APIs
- databases
- real-time scheduling engines

## Final instruction to coding agent

Create the notebook at exactly this difficulty level:
- clearly more advanced than a pure scoring system
- clearly simpler than an advanced ML or ranking system
- presentation-ready
- easy for a beginner-to-intermediate analytics student to understand and explain
