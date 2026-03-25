"""File management router — upload, list, and delete CSV files."""

from fastapi import APIRouter, HTTPException, UploadFile

from api.models import FileMetadata, UploadResponse
from api.services.data_manager import delete_file, list_files, save_file
from api.services.validator import validate_csv

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=UploadResponse, status_code=200)
async def upload_files(files: list[UploadFile]) -> UploadResponse:
    """Upload one or more CSV files."""
    uploaded: list[FileMetadata] = []
    validation_results = []

    for file in files:
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not a CSV file. Only .csv files are accepted.",
            )

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds the 50 MB size limit.",
            )

        text = content.decode("utf-8", errors="replace")
        result = validate_csv(file.filename, text)
        validation_results.append(result)

        metadata = save_file(file.filename, content)
        uploaded.append(metadata)

    return UploadResponse(uploaded=uploaded, validation=validation_results)


@router.get("", response_model=list[FileMetadata])
async def get_files() -> list[FileMetadata]:
    """List all uploaded CSV files."""
    return list_files()


@router.delete("/{filename}", status_code=204)
async def remove_file(filename: str) -> None:
    """Delete a CSV file by filename."""
    try:
        delete_file(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
