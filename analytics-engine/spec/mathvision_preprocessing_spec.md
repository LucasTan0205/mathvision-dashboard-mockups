
# MathVision Tutor Matchmaking Prototype
## Spec A — Preprocessing & Pairing Quality Labeling

## 1. Purpose
This preprocessing stage converts **raw tutor–student pairing feedback** into a labeled dataset that can be used for analytics.

Inputs:
- students.csv
- tutors.csv
- pairings_raw.csv (contains tutor session feedback text)

Output:
- pairings_labeled.csv

This step determines whether a tutor–student pairing is **good or bad** using a modular **Pairing Quality Inference Module**.

The baseline implementation uses **cosine similarity against positive and negative reference phrases**.
The module is designed so it can later be replaced by a stronger NLP classifier.

---

# 2. Input Data

## Students Table
Fields:
- student_id
- student_name
- curriculum
- grade_level
- weak_topic
- requested_slot
- branch

Purpose:
Describes the student learning needs.

---

## Tutors Table
Fields:
- tutor_id
- tutor_name
- tutor_type
- primary_curriculum
- specialty_topic
- years_experience
- rating
- available_slots
- preferred_min_grade
- preferred_max_grade
- branch

Purpose:
Describes tutor capabilities.

---

## Raw Tutor–Student Pairings Table

Fields:
- pairing_id
- student_id
- tutor_id
- session_date
- topic_covered
- duration_hours
- tutor_feedback_text

Purpose:
Represents tutor feedback recorded after each tutoring session.
This dataset **does not yet contain good/bad pairing labels**.

---

# 3. Preprocessing Pipeline

Steps:

1. Clean tutor feedback text
2. Convert text into numerical vectors
3. Compare notes to positive and negative phrase banks using cosine similarity
4. Compute a session-level feedback score
5. Aggregate scores across sessions for each tutor–student pairing
6. Generate a final pairing quality label

---

# 4. Text Cleaning

Basic preprocessing:
- convert to lowercase
- remove punctuation
- remove extra whitespace

Example:
Input:
"Student showed Improvement in Fractions!"

Output:
"student showed improvement in fractions"

---

# 5. Reference Phrase Banks

Two phrase banks define good vs bad tutoring outcomes.

## Positive phrases
Examples:
- improving understanding
- good progress
- grasped the concept
- more confident
- able to solve independently
- ready for next topic

## Negative phrases
Examples:
- still struggling
- weak understanding
- confused about topic
- many mistakes
- needs repeated explanation
- unable to solve independently

---

# 6. Vectorization

Use TF-IDF vectorization to represent text numerically.

Vectors required:
- tutor feedback text
- positive phrase bank text
- negative phrase bank text

---

# 7. Cosine Similarity Scoring

similarity_positive = cosine(note_vector, positive_reference_vector)

similarity_negative = cosine(note_vector, negative_reference_vector)

score = similarity_positive - similarity_negative

score > 0 → positive signal
score < 0 → negative signal

---

# 8. Aggregation to Pairing Level

Aggregate across sessions:
- lessons_count
- total_hours
- average_feedback_score
- positive_note_count
- negative_note_count

---

# 9. Pairing Quality Label

good_pairing_label = 1 if average_feedback_score > 0

Else:

good_pairing_label = 0

---

# 10. Output Dataset

pairings_labeled.csv fields:

- pairing_id
- student_id
- tutor_id
- lessons_count
- total_hours
- avg_feedback_score
- positive_note_count
- negative_note_count
- good_pairing_label

This dataset feeds the analytics stage.

---

# 11. Modular Design

Baseline method:
- cosine similarity

Possible upgrades:
- logistic regression text classifier
- Naive Bayes sentiment model
- sentence embeddings
- transformer-based classification
