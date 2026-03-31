"""
Hybrid scoring module for student-tutor matching.

Implements rule_score, predicted_success_probability, and final_score
as defined in the MathVision analytics spec (Section 4 & 7).
"""

from api.models import StudentProfile, TutorProfile


def rule_score(student: StudentProfile, tutor: TutorProfile) -> float:
    """
    Compute the rule-based match score (0–100).

    Components and weights:
      - curriculum_match : weight 30
      - grade_overlap     : weight 25
      - topic_match       : weight 25
      - branch_match      : weight 10
      - rating_score      : weight 10
    """
    curriculum_match = 1.0 if tutor.primary_curriculum == student.curriculum else 0.0

    grade_overlap = (
        1.0
        if tutor.preferred_min_grade <= student.grade_level <= tutor.preferred_max_grade
        else 0.0
    )

    topic_match = 1.0 if tutor.specialty_topic == student.weak_topic else 0.0

    branch_match = 1.0 if tutor.branch == student.branch else 0.5

    rating_score = (tutor.rating - 1.0) / 4.0  # normalised 0–1

    score = (
        curriculum_match * 30
        + grade_overlap * 25
        + topic_match * 25
        + branch_match * 10
        + rating_score * 10
    )

    return score


def predicted_success_probability(student: StudentProfile, tutor: TutorProfile) -> float:
    """
    Estimate the probability of a successful pairing (0–100).

    Uses tutor's past_success_rate as the base, boosted by years of experience.
    """
    base = tutor.past_success_rate
    experience_boost = min(tutor.years_experience / 10.0, 1.0) * 0.1
    result = min(base + experience_boost, 1.0) * 100
    return result


def final_score(student: StudentProfile, tutor: TutorProfile) -> float:
    """
    Compute the hybrid final score (0–100).

    final_score = 0.6 × rule_score + 0.4 × predicted_success_probability
    """
    return 0.6 * rule_score(student, tutor) + 0.4 * predicted_success_probability(student, tutor)
