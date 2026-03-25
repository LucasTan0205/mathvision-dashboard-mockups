"""CSV parser/serializer utility (Requirements 7.1, 7.2, 7.3, 7.5)."""

import csv
import io


_DELIMITERS = [",", ";", "\t"]


def _detect_delimiter(content: str) -> str:
    """Sniff the delimiter from the first ~4 KB of content, falling back to comma."""
    sample = content[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters="".join(_DELIMITERS))
        return dialect.delimiter
    except csv.Error:
        return ","


def parse_csv(content: str) -> list[dict]:
    """Parse a CSV string into a list of row dicts.

    Auto-detects delimiter (comma, semicolon, tab).
    Handles quoted fields and escaped characters via the csv module.

    Raises:
        ValueError: if the content is malformed or has no header row.
    """
    if not content or not content.strip():
        raise ValueError("CSV content is empty")

    delimiter = _detect_delimiter(content)

    try:
        reader = csv.DictReader(
            io.StringIO(content),
            delimiter=delimiter,
        )
        # Force evaluation so malformed rows raise here rather than lazily.
        rows = list(reader)
    except csv.Error as exc:
        raise ValueError(f"Malformed CSV: {exc}") from exc

    if reader.fieldnames is None:
        raise ValueError("CSV has no header row")

    return rows


def serialize_csv(rows: list[dict], fieldnames: list[str]) -> str:
    """Serialize a list of row dicts back to a CSV string.

    Uses comma as delimiter and quotes fields that contain special characters.
    """
    buf = io.StringIO()
    writer = csv.DictWriter(
        buf,
        fieldnames=fieldnames,
        lineterminator="\r\n",
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()
