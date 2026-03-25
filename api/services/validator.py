"""CSV file validator — infers file type from filename stem and validates columns."""

import csv
import io
from pathlib import Path

from api.models import ValidationResult

COLUMN_SCHEMAS: dict[str, list[str]] = {
    "students": [
        "student_id",
        "student_name",
        "curriculum",
        "grade_level",
        "weak_topic",
        "requested_slot",
        "branch",
    ],
    "tutors": [
        "tutor_id",
        "tutor_name",
        "tutor_type",
        "primary_curriculum",
        "specialty_topic",
        "years_experience",
        "rating",
        "available_slots",
        "preferred_min_grade",
        "preferred_max_grade",
        "past_success_rate",
        "branch",
    ],
    "pairings_raw": [
        "pairing_id",
        "student_id",
        "tutor_id",
        "session_date",
        "duration_hours",
        "tutor_feedback_text",
    ],
}


def _infer_file_type(filename: str) -> str:
    """Return the file type key based on the filename stem, or 'unknown'."""
    stem = Path(filename).stem.lower()
    if stem in COLUMN_SCHEMAS:
        return stem
    return "unknown"


def validate_csv(filename: str, content: str) -> ValidationResult:
    """Validate CSV content against the known schema for the inferred file type.

    - Infers file type from the filename stem.
    - Unknown file types are accepted with a warning (no column checks).
    - Known file types are checked for required columns; missing ones are reported.
    """
    file_type = _infer_file_type(filename)
    warnings: list[str] = []
    missing_columns: list[str] = []

    if file_type == "unknown":
        warnings.append(
            f"Unknown file type for '{filename}'; column validation skipped."
        )
        return ValidationResult(
            valid=True,
            file_type=file_type,
            missing_columns=missing_columns,
            warnings=warnings,
        )

    # Parse the header row to get actual columns
    reader = csv.reader(io.StringIO(content))
    try:
        header = next(reader)
    except StopIteration:
        header = []

    actual_columns = {col.strip() for col in header}
    required_columns = COLUMN_SCHEMAS[file_type]
    missing_columns = [col for col in required_columns if col not in actual_columns]

    valid = len(missing_columns) == 0

    return ValidationResult(
        valid=valid,
        file_type=file_type,
        missing_columns=missing_columns,
        warnings=warnings,
    )
