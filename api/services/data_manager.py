"""Data manager service — file storage, backup, and operation logging."""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from api.models import FileMetadata

logger = logging.getLogger(__name__)

# Resolve project root as the directory containing the `api/` folder.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_RAW_DIR = _PROJECT_ROOT / "analytics-engine" / "data" / "raw"

RAW_DATA_DIR = Path(os.environ.get("MATHVISION_DATA_DIR", str(_DEFAULT_RAW_DIR)))
_LOG_FILE = RAW_DATA_DIR / ".file_operations.log"


def _ensure_dir() -> None:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


def _append_log(operation: str, filename: str) -> None:
    _ensure_dir()
    entry = {
        "operation": operation,
        "filename": filename,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with _LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")
    logger.info("file_operation operation=%s filename=%s", operation, filename)


def _file_type(filename: str) -> str:
    stem = Path(filename).stem.lower()
    if "student" in stem:
        return "students"
    if "tutor" in stem:
        return "tutors"
    if "pairing" in stem:
        return "pairings_raw"
    return "unknown"


def _metadata(path: Path) -> FileMetadata:
    stat = path.stat()
    return FileMetadata(
        filename=path.name,
        size_bytes=stat.st_size,
        uploaded_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        file_type=_file_type(path.name),
    )


def save_file(filename: str, content: bytes) -> FileMetadata:
    """Write *content* to RAW_DATA_DIR/<filename>.

    If a file with the same name already exists it is renamed to
    ``<stem>_backup_<ISO-timestamp>.csv`` before the new file is written.
    Both the backup (if any) and the upload are recorded in the operations log.
    """
    _ensure_dir()
    dest = RAW_DATA_DIR / filename

    if dest.exists():
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        stem = dest.stem
        backup_name = f"{stem}_backup_{ts}.csv"
        backup_path = RAW_DATA_DIR / backup_name
        dest.rename(backup_path)
        _append_log("backup", backup_name)

    dest.write_bytes(content)
    _append_log("upload", filename)

    return _metadata(dest)


def delete_file(filename: str) -> None:
    """Remove *filename* from RAW_DATA_DIR.

    Raises FileNotFoundError if the file does not exist.
    """
    _ensure_dir()
    target = RAW_DATA_DIR / filename

    if not target.exists():
        raise FileNotFoundError(f"{filename} not found in data/raw/")

    target.unlink()
    _append_log("delete", filename)


def list_files() -> list[FileMetadata]:
    """Return FileMetadata for every .csv file in RAW_DATA_DIR."""
    _ensure_dir()
    return [_metadata(p) for p in sorted(RAW_DATA_DIR.glob("*.csv"))]
