# MathVision Matchmaking Pipeline (High-Level)

## Overview
This project builds tutor-student recommendations in two stages:
1. **Preprocessing**: Convert raw tutor feedback text into pairing-quality labels.
2. **Analytics**: Train a leakage-safe pair-quality model, rank tutors per student, and support class-level assignment.

Current notebooks:
- `pre-processing/mathvision_preprocessing.ipynb`
- `analytics/mathvision_analytics.ipynb`

---

## Data Needed
### Raw Inputs (`data/raw`)
- `students.csv`
  - `student_id`, `student_name`, `curriculum`, `grade_level`, `weak_topic`, `requested_slot`, `branch`
- `tutors.csv`
  - `tutor_id`, `tutor_name`, `tutor_type`, `primary_curriculum`, `specialty_topic`, `years_experience`, `rating`, `available_slots`, `preferred_min_grade`, `preferred_max_grade`, `past_success_rate`, `branch`
- `pairings_raw.csv`
  - `pairing_id`, `student_id`, `tutor_id`, `session_date`, `duration_hours`, `tutor_feedback_text`

### Preprocessed Outputs (`data/pre-processed`)
- `pairings_labeled.csv` from preprocessing
  - `pairing_id`, `student_id`, `tutor_id`, `lessons_count`, `total_hours`, `avg_feedback_score`, `positive_note_count`, `negative_note_count`, `good_pairing_label`
- Analytics outputs
  - `analytics_model_metrics.csv`
  - `analytics_scenario_rankings.csv`

---

## End-to-End Flow
1. Run preprocessing notebook:
   - Clean text, TF-IDF vectorization, cosine similarity vs positive/negative phrase banks.
   - Aggregate session-level scores to pairing-level.
   - Generate `good_pairing_label` and write `pairings_labeled.csv`.
   - Reminder: This could be replaced with NLP model (pre-trained RNN or throw it at the LLM and see what sticks)
2. Run analytics notebook:
   - Load `students.csv`, `tutors.csv`, `pairings_labeled.csv`.
   - Engineer fit + tutor-quality features.
   - Train leakage-safe logistic regression model.
   - Generate per-student tutor rankings.
   - Save metrics and scenario ranking outputs.

---

## Modeling Approach
### Pair-Quality Prediction (per student-tutor pair)
- **Cold-start model features**:
  - `topic_match`, `curriculum_match`, `grade_gap`, `availability_match`, `same_branch`
  - `tutor_rating`, `tutor_experience`, `past_success_rate`, `rule_score`, `tutor_type`
- **Leakage-safe policy**:
  - Do **not** train on pair-history fields used to derive labels (`avg_feedback_score`, `lessons_count`, note counts).

### Ranking Modes
- **Cold-start**: no prior history for that exact student-tutor pair.
- **Warm-start**: prior pair exists; apply a small history-based re-ranking signal after base scoring.

---

## Class-Level Assignment (Whole Class, Not One Student) [Not Implemented yet]
Pairwise ranking is not the final class allocation by itself. For a class/session, generate all feasible student-tutor pair scores, then assign globally with constraints.

### Choices for class-level assignation
1. **Greedy heuristic [If no time]**
   - Assign highest-score pairs first with capacity checks.
   - Pros: simple, quick.
   - Cons: may miss better global solution.
2. **Greedy + local improvement [Balanced]**
   - Start greedy, then swap/reassign to improve total score.
   - Pros: better than pure greedy, still practical.
   - Cons: still approximate.
3. **Optimization (recommended for quality)[FIWB option]**
   - Use max-weight bipartite matching / integer programming.
   - Objective: maximize total assignment score.
   - Constraints: tutor capacity, slot compatibility, min fit rules, optional fairness/load balance.
   - Pros: best global assignment under constraints.
   - Cons: more implementation complexity.

---

## Technology and Techniques
- **Language**: Python
- **Environment**: Jupyter notebooks
- **Core libraries**:
  - `pandas`, `numpy`
  - `scikit-learn` (TF-IDF, cosine similarity, logistic regression, preprocessing, metrics)
  - `matplotlib` (evaluation plots)
- **Techniques used**:
  - Text preprocessing and phrase-bank similarity scoring
  - Rule-based scoring + ML hybrid ranking
  - Leakage-aware feature policy
  - Cold-start vs warm-start ranking logic
  - (Planned/optional) combinatorial assignment optimization for class-level pairing

---

## Suggested Next Step
Add a dedicated **assignment layer** notebook/module that takes scored student-tutor pairs and solves class-level allocation using either:
- a baseline greedy heuristic, and
- an optimization solver for higher-quality global matching.
