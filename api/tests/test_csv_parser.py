"""Unit tests for api/services/csv_parser.py (Requirements 7.1, 7.2, 7.3, 7.5)."""

import pytest
from api.services.csv_parser import parse_csv, serialize_csv


# ---------------------------------------------------------------------------
# parse_csv — happy paths
# ---------------------------------------------------------------------------

def test_parse_basic_comma():
    content = "name,age\nAlice,30\nBob,25"
    rows = parse_csv(content)
    assert rows == [{"name": "Alice", "age": "30"}, {"name": "Bob", "age": "25"}]


def test_parse_semicolon_delimiter():
    content = "name;age\nAlice;30\nBob;25"
    rows = parse_csv(content)
    assert rows == [{"name": "Alice", "age": "30"}, {"name": "Bob", "age": "25"}]


def test_parse_tab_delimiter():
    content = "name\tage\nAlice\t30\nBob\t25"
    rows = parse_csv(content)
    assert rows == [{"name": "Alice", "age": "30"}, {"name": "Bob", "age": "25"}]


def test_parse_quoted_fields():
    content = 'name,bio\n"Alice","loves ""coding"""\n"Bob","hello, world"'
    rows = parse_csv(content)
    assert rows[0]["bio"] == 'loves "coding"'
    assert rows[1]["bio"] == "hello, world"


def test_parse_field_with_newline():
    content = 'name,note\n"Alice","line1\nline2"'
    rows = parse_csv(content)
    assert rows[0]["note"] == "line1\nline2"


def test_parse_single_row():
    content = "id,value\n1,hello"
    rows = parse_csv(content)
    assert len(rows) == 1
    assert rows[0] == {"id": "1", "value": "hello"}


def test_parse_header_only():
    content = "id,name"
    rows = parse_csv(content)
    assert rows == []


# ---------------------------------------------------------------------------
# parse_csv — error cases
# ---------------------------------------------------------------------------

def test_parse_empty_string_raises():
    with pytest.raises(ValueError, match="empty"):
        parse_csv("")


def test_parse_whitespace_only_raises():
    with pytest.raises(ValueError, match="empty"):
        parse_csv("   \n  ")


# ---------------------------------------------------------------------------
# serialize_csv
# ---------------------------------------------------------------------------

def test_serialize_basic():
    rows = [{"name": "Alice", "age": "30"}]
    result = serialize_csv(rows, ["name", "age"])
    assert "name,age" in result
    assert "Alice,30" in result


def test_serialize_quotes_special_chars():
    rows = [{"name": "Alice", "note": "hello, world"}]
    result = serialize_csv(rows, ["name", "note"])
    assert '"hello, world"' in result


def test_serialize_extra_fields_ignored():
    rows = [{"name": "Alice", "age": "30", "extra": "ignored"}]
    result = serialize_csv(rows, ["name", "age"])
    assert "extra" not in result
    assert "ignored" not in result


def test_serialize_empty_rows():
    result = serialize_csv([], ["name", "age"])
    assert "name,age" in result


# ---------------------------------------------------------------------------
# Round-trip
# ---------------------------------------------------------------------------

def test_round_trip_comma():
    original = "id,name,score\n1,Alice,95\n2,Bob,87"
    rows = parse_csv(original)
    serialized = serialize_csv(rows, ["id", "name", "score"])
    reparsed = parse_csv(serialized)
    assert reparsed == rows


def test_round_trip_quoted():
    original = 'id,note\n1,"hello, world"\n2,"she said ""hi"""'
    rows = parse_csv(original)
    serialized = serialize_csv(rows, ["id", "note"])
    reparsed = parse_csv(serialized)
    assert reparsed == rows


def test_round_trip_semicolon_becomes_comma():
    """Semicolon-delimited input round-trips correctly (output is comma-delimited)."""
    original = "id;name\n1;Alice\n2;Bob"
    rows = parse_csv(original)
    serialized = serialize_csv(rows, ["id", "name"])
    reparsed = parse_csv(serialized)
    assert reparsed == rows
