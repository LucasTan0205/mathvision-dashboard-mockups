from datetime import date
from typing import Literal
from pydantic import BaseModel, field_validator


class FileMetadata(BaseModel):
    filename: str
    size_bytes: int
    uploaded_at: str          # ISO-8601
    file_type: str            # "students" | "tutors" | "pairings_raw" | "unknown"


class ValidationResult(BaseModel):
    valid: bool
    file_type: str
    missing_columns: list[str]
    warnings: list[str]


class JobStatus(BaseModel):
    job_id: str               # UUID4
    status: str               # "queued" | "preprocessing" | "analytics" | "complete" | "failed"
    current_step: str
    started_at: str | None
    completed_at: str | None
    error: str | None
    output_files: list[str]   # populated on complete


class UploadResponse(BaseModel):
    uploaded: list[FileMetadata]
    validation: list[ValidationResult]


class JobCreateResponse(BaseModel):
    job_id: str
    status: str


# --- Matching Pipeline Models ---

class StudentProfile(BaseModel):
    student_id: str
    name: str
    curriculum: Literal["Local", "IGCSE", "IB"]
    grade_level: int                 # 5–12
    weak_topic: Literal["Fractions", "Algebra", "Geometry", "Calculus", "Statistics"]
    branch: Literal["Central", "East", "West"]
    availability_slots: list[str]

    @field_validator("grade_level")
    @classmethod
    def validate_grade_level(cls, v: int) -> int:
        if not (5 <= v <= 12):
            raise ValueError("grade_level must be between 5 and 12")
        return v


class TutorProfile(BaseModel):
    tutor_id: str
    name: str
    tutor_type: Literal["part-time", "full-time", "instructor"]
    primary_curriculum: Literal["Local", "IGCSE", "IB"]
    specialty_topic: Literal["Fractions", "Algebra", "Geometry", "Calculus", "Statistics"]
    years_experience: int
    rating: float = 3.0              # 1.0–5.0, system-assigned
    preferred_min_grade: int         # 5–12
    preferred_max_grade: int         # 5–12
    past_success_rate: float = 0.0   # 0.0–1.0, system-assigned
    branch: Literal["Central", "East", "West"]
    availability_slots: list[str]
    max_students_per_slot: int = 1

    @field_validator("years_experience")
    @classmethod
    def validate_years_experience(cls, v: int) -> int:
        if v < 0:
            raise ValueError("years_experience must be >= 0")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: float) -> float:
        if not (1.0 <= v <= 5.0):
            raise ValueError("rating must be between 1.0 and 5.0")
        return v

    @field_validator("preferred_min_grade", "preferred_max_grade")
    @classmethod
    def validate_preferred_grade(cls, v: int) -> int:
        if not (5 <= v <= 12):
            raise ValueError("preferred grade must be between 5 and 12")
        return v

    @field_validator("past_success_rate")
    @classmethod
    def validate_past_success_rate(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError("past_success_rate must be between 0.0 and 1.0")
        return v

    @field_validator("max_students_per_slot")
    @classmethod
    def validate_max_students_per_slot(cls, v: int) -> int:
        if v < 1:
            raise ValueError("max_students_per_slot must be >= 1")
        return v


class PairingRecord(BaseModel):
    pairing_id: str
    student_id: str
    tutor_id: str
    time_slot: str
    satisfaction_score: float        # 0–100
    tutor_utilisation: float         # percentage
    matched_at: str                  # ISO-8601
    status: str = "pending"          # "pending" | "confirmed"

    @field_validator("satisfaction_score")
    @classmethod
    def validate_satisfaction_score(cls, v: float) -> float:
        if not (0.0 <= v <= 100.0):
            raise ValueError("satisfaction_score must be between 0 and 100")
        return v

    @field_validator("tutor_utilisation")
    @classmethod
    def validate_tutor_utilisation(cls, v: float) -> float:
        if v < 0.0:
            raise ValueError("tutor_utilisation must be >= 0")
        return v


class MatchingRunRequest(BaseModel):
    students: list[StudentProfile]
    tutors: list[TutorProfile]


class MatchingRunResponse(BaseModel):
    job_id: str
    status: str
    pairings: list[PairingRecord]
    unmatched_student_ids: list[str]


class DailyStats(BaseModel):
    date: str                        # YYYY-MM-DD
    avg_satisfaction_score: float
    pairing_count: int


class TutorUtilisation(BaseModel):
    tutor_id: str
    name: str
    utilisation: float               # percentage
    utilisation_status: Literal["Under-utilised", "Appropriately-utilised", "Over-utilised"]

    @field_validator("utilisation")
    @classmethod
    def validate_utilisation(cls, v: float) -> float:
        if v < 0.0:
            raise ValueError("utilisation must be >= 0")
        return v


# --- Peak Demand Prediction Models ---

class SessionRecord(BaseModel):
    pairing_id: str
    student_id: str
    tutor_id: str
    session_date: date
    duration_hours: float
    day_of_week: int            # 0=Mon, 6=Sun
    time_slot: Literal["morning", "afternoon", "evening"]


class DemandCell(BaseModel):
    day_of_week: int            # 0–6
    day_label: str              # "Monday"–"Sunday"
    time_slot: Literal["morning", "afternoon", "evening"]
    demand_score: float         # 0.0–1.0 normalised
    raw_session_count: int      # Prophet yhat (rounded) or historical count
    weighted_session_count: float
    is_peak: bool
    forecast_lower: float | None = None   # Prophet yhat_lower
    forecast_upper: float | None = None   # Prophet yhat_upper


class RampUpRecommendation(BaseModel):
    day_of_week: int
    day_label: str
    time_slot: Literal["morning", "afternoon", "evening"]
    demand_score: float
    raw_session_count: int
    weighted_session_count: float
    recommended_additional_tutors: int  # >= 1
    branch: str | None = None


class DemandPredictionResponse(BaseModel):
    demand_matrix: list[list[DemandCell]]  # 3 rows × 7 cols
    peak_periods: list[DemandCell]
    recommendations: list[RampUpRecommendation]
    peak_threshold: float
    branch: str | None = None
    data_warning: str | None = None
