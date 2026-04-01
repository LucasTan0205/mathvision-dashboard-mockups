# MathVision Analytics Engine

## Overview

The analytics engine powers the data-driven components of the MathVision tutoring platform. It processes historical session records, evaluates pairing quality using NLP, trains predictive models for tutor ranking, and generates daily mapping quality scores for the Ops dashboard.

## Data

All data lives under `analytics-engine/data/`.

### Raw inputs (`data/raw/`)

| File | Description |
|---|---|
| `students.csv` | Student profiles — ID, name, curriculum, grade, weak topic, requested slot, branch |
| `tutors.csv` | Tutor profiles — ID, name, type, curriculum, specialty, experience, rating, availability, grade range, past success rate, branch |
| `pairings_raw.csv` | Historical session records — session date, topic covered, duration, and tutor feedback text |

### Pre-processed outputs (`data/pre-processed/`)

| File | Produced by | Description |
|---|---|---|
| `pairings_labeled.csv` | Preprocessing notebook | Pairing-level aggregation with quality labels derived from NLP analysis |
| `analytics_model_metrics.csv` | Analytics notebook | Logistic regression model performance metrics |
| `analytics_scenario_rankings.csv` | Analytics notebook | Per-student tutor rankings under cold-start and warm-start scenarios |
| `analytics_mapping_quality_timeseries.csv` | Analytics notebook | Daily mapping quality scores for dashboard visualisation |

## Notebooks

Run these in order. Each notebook is self-contained and reads from the data directory.

### 1. Preprocessing — `pre-processing/mathvision_preprocessing.ipynb`

Converts raw tutor feedback text into pairing quality labels.

**Methods:**
- Pretrained NLP via `sentence-transformers` (all-MiniLM-L6-v2, 384-dim embeddings)
- Cosine similarity scoring against positive/negative reference phrase banks
- Session-level scores aggregated to pairing-level metrics
- Binary quality labelling (`good_pairing_label`)

**Input:** `data/raw/students.csv`, `data/raw/tutors.csv`, `data/raw/pairings_raw.csv`
**Output:** `data/pre-processed/pairings_labeled.csv`

### 2. Analytics — `analytics/mathvision_analytics.ipynb`

Trains a predictive model for tutor-student match quality and generates tutor rankings.

**Methods:**
- Leakage-safe feature engineering (excludes pair-history fields used to derive labels)
- Logistic Regression for pair-quality prediction
- Cold-start ranking (no prior history for the pair)
- Warm-start ranking (prior pair exists, history-based re-ranking signal)

**Features used:** `topic_match`, `curriculum_match`, `grade_gap`, `availability_match`, `same_branch`, `tutor_rating`, `tutor_experience`, `past_success_rate`, `rule_score`, `tutor_type`

**Input:** `data/raw/students.csv`, `data/raw/tutors.csv`, `data/pre-processed/pairings_labeled.csv`
**Output:** `data/pre-processed/analytics_model_metrics.csv`, `data/pre-processed/analytics_scenario_rankings.csv`, `data/pre-processed/analytics_mapping_quality_timeseries.csv`

## Matching Engine

The matching engine runs as a backend service (`api/services/`) and is not a notebook, but it consumes the analytics outputs.

**Methods:**
- Hybrid scoring: rule-based match score (curriculum, grade, topic, branch, rating) + predicted success probability, weighted 60/40
- Integer Programming optimisation via PuLP/CBC solver for whole-class assignment
- Tutor utilisation as a tie-breaker (under-utilised tutors preferred)

**Key files:**
- `api/services/hybrid_scorer.py` — rule-based + ML hybrid scoring
- `api/services/matching_service.py` — availability grouping + IP solver

## Specs

Detailed specifications for each notebook are in `spec/`:
- `mathvision_preprocessing_spec.md`
- `mathvision_analytics_spec.md`

## Setup

```bash
cd analytics-engine
python3 -m venv .venv
source .venv/bin/activate
pip install pandas numpy scikit-learn sentence-transformers matplotlib jupyter ipykernel
python -m ipykernel install --user --name=analytics-engine
```

Then open any notebook and select the `analytics-engine` kernel.
