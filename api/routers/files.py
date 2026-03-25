"""File management router — upload, list, and delete CSV files."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from api.auth import verify_api_key
from api.models import FileMetadata, UploadResponse
from api.services.data_manager import delete_file, list_files, save_file
from api.services.validator import validate_csv

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=UploadResponse, status_code=200)
async def upload_files(
    files: list[UploadFile],
    _: str = Depends(verify_api_key),
) -> UploadResponse:
    """Upload one or more CSV files."""
    uploaded: list[FileMetadata] = []
    validation_results = []

    for file in files:
        # Enforce .csv extension
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not a CSV file. Only .csv files are accepted.",
            )

        content = await file.read()

        # Enforce 50 MB size limit
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds the 50 MB size limit.",
            )

        # Validate CSV schema
        text = content.decode("utf-8", errors="replace")
        result = validate_csv(file.filename, text)
        validation_results.append(result)

        # Save file to data/raw/
        metadata = save_file(file.filename, content)
        uploaded.append(metadata)

    return UploadResponse(uploaded=uploaded, validation=validation_results)


@router.get("", response_model=list[FileMetadata])
async def get_files(_: str = Depends(verify_api_key)) -> list[FileMetadata]:
    """List all uploaded CSV files."""
    return list_files()


@router.delete("/{filename}", status_code=204)
async def remove_file(filename: str, _: str = Depends(verify_api_key)) -> None:
    """Delete a CSV file by filename."""
    try:
        delete_file(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
