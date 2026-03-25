from pydantic import BaseModel


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
