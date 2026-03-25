# Implementation Plan: CSV Analytics Integration

## Overview

Implement a three-layer integration: a Python FastAPI backend (`api/`), a new Vite frontend page (`csv-upload`), and nav wiring. The backend handles file upload, validation, job execution, and status; the frontend provides upload UI, file manager, and processing monitor. Notebooks are invoked as subprocesses via `nbconvert` — no changes to existing notebooks.

## Tasks

- [x] 1. Set up backend API project structure and core models
  - Create `api/` directory with `main.py`, `models.py`, `auth.py`, and empty router/service stubs
  - Define all Pydantic models: `FileMetadata`, `ValidationResult`, `JobStatus`, `UploadResponse`, `JobCreateResponse`
  - Configure FastAPI app with CORS and `X-API-Key` middleware in `auth.py`
  - Add `requirements.txt` with `fastapi`, `uvicorn`, `python-multipart`, `hypothesis`
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Implement CSV parser/serializer utility
  - [x] 2.1 Create `api/services/csv_parser.py` with `parse_csv` and `serialize_csv` functions
    - `parse_csv(content: str) -> list[dict]` using Python's `csv` module; raise `ValueError` on malformed input
    - `serialize_csv(rows: list[dict], fieldnames: list[str]) -> str`
    - Handle quoted fields, escaped characters, and common delimiter variations
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 2.2 Write property test for CSV round-trip (Property 7)
    - **Property 7: CSV round-trip**
    - **Validates: Requirements 7.4, 7.5**
    - Use `@given(st.lists(...))` with Hypothesis; `parse_csv(serialize_csv(rows, fieldnames))` must produce equivalent row dicts
    - Place in `api/tests/test_properties.py`

- [x] 3. Implement CSV file validator
  - [x] 3.1 Create `api/services/validator.py` with column schema map and `validate_csv` function
    - Infer file type from filename stem (`students`, `tutors`, `pairings_raw`); unknown → accepted with warning
    - Return `ValidationResult` with `valid`, `file_type`, `missing_columns`, `warnings`
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 3.2 Write property test for missing-column validation (Property 3)
    - **Property 3: Missing-column validation**
    - **Validates: Requirements 2.2, 2.3, 2.5**
    - Use `@given(st.lists(st.sampled_from(ALL_STUDENT_COLUMNS), min_size=0))` — validator must return `valid: false` iff any required column is absent
    - Place in `api/tests/test_properties.py`

  - [ ]* 3.3 Write unit tests for validator
    - Test known-good and known-bad fixtures for each file type; test missing column combinations
    - Place in `api/tests/test_validator.py`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement data manager service
  - [x] 4.1 Create `api/services/data_manager.py`
    - `save_file(filename, content)` — writes to `analytics-engine/data/raw/`; if file exists, renames old to `<name>_backup_<ISO-timestamp>.csv` first
    - `delete_file(filename)` — removes file, raises if not found
    - `list_files()` — returns list of `FileMetadata` for all files in `data/raw/`
    - Append a JSON line to `analytics-engine/data/raw/.file_operations.log` for every upload, delete, and backup
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 4.2 Write property test for backup on overwrite (Property 5)
    - **Property 5: Backup on overwrite**
    - **Validates: Requirements 3.2**
    - Use `@given(st.text(min_size=1), st.text(min_size=1))` — original content must be preserved in a timestamped backup file
    - Place in `api/tests/test_properties.py`

  - [ ]* 4.3 Write property test for file operation log completeness (Property 6)
    - **Property 6: File operation log completeness**
    - **Validates: Requirements 3.5**
    - For any sequence of N file operations, log must contain exactly N entries
    - Place in `api/tests/test_properties.py`

  - [ ]* 4.4 Write unit tests for data manager
    - Test backup naming format, log JSON structure, delete behaviour, list metadata
    - Place in `api/tests/test_data_manager.py`
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 5. Implement job runner service
  - [x] 5.1 Create `api/services/job_runner.py`
    - `create_job() -> str` — generates UUID4 job ID, sets state to `queued`, persists to `analytics-engine/data/.job_state.json`
    - `run_job(job_id)` — executes preprocessing then analytics notebook via `jupyter nbconvert --to notebook --execute`; transitions state `queued → preprocessing → analytics → complete | failed`; captures stderr on failure
    - `get_job(job_id) -> JobStatus` — reads current state; raises 404 if not found
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.2_

  - [ ]* 5.2 Write property test for job status monotonicity (Property 8)
    - **Property 8: Job status monotonicity**
    - **Validates: Requirements 4.3, 5.2**
    - State sequence must follow `queued → preprocessing → analytics → complete | failed` and never go backwards
    - Place in `api/tests/test_properties.py`

  - [ ]* 5.3 Write property test for failed job error field (Property 9)
    - **Property 9: Failed job error field**
    - **Validates: Requirements 4.5, 5.5**
    - Any job reaching `failed` status must have a non-null, non-empty `error` field
    - Place in `api/tests/test_properties.py`

  - [ ]* 5.4 Write property test for completed job fields (Property 10)
    - **Property 10: Completed job fields**
    - **Validates: Requirements 5.4, 6.2, 6.3**
    - Any job reaching `complete` must have a valid ISO-8601 `completed_at` and `output_files` containing `analytics_model_metrics.csv` and `analytics_scenario_rankings.csv`
    - Place in `api/tests/test_properties.py`

- [x] 6. Implement file upload and files router
  - [x] 6.1 Create `api/routers/files.py` with `POST /files/upload`, `GET /files`, `DELETE /files/{filename}`
    - `POST /files/upload`: enforce 50 MB size limit (→ 413) and `.csv` extension (→ 400); call validator; call data manager; return `UploadResponse`
    - `GET /files`: return list of `FileMetadata` from data manager
    - `DELETE /files/{filename}`: call data manager delete; return 404 if not found
    - Wire router into `main.py`
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 3.1, 3.4, 8.1_

  - [ ]* 6.2 Write property test for file size rejection (Property 1)
    - **Property 1: File size rejection**
    - **Validates: Requirements 1.4**
    - Any file exceeding 50 MB must be rejected with 413 and not written to disk
    - Place in `api/tests/test_properties.py`

  - [ ]* 6.3 Write property test for extension enforcement (Property 2)
    - **Property 2: Extension enforcement**
    - **Validates: Requirements 1.5**
    - Any upload with a non-`.csv` filename must be rejected with 400 and not written to disk
    - Place in `api/tests/test_properties.py`

  - [ ]* 6.4 Write property test for file storage round-trip (Property 4)
    - **Property 4: File storage round-trip**
    - **Validates: Requirements 3.1**
    - Any valid uploaded file must exist at `data/raw/<filename>` with byte-for-byte identical content
    - Place in `api/tests/test_properties.py`

- [x] 7. Implement jobs router and wire authentication
  - [x] 7.1 Create `api/routers/jobs.py` with `POST /jobs` and `GET /jobs/{job_id}`
    - `POST /jobs`: call `job_runner.create_job()`, launch `run_job` in a background thread, return `JobCreateResponse`
    - `GET /jobs/{job_id}`: return `JobStatus`; 404 if unknown
    - Wire router into `main.py`
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 8.4, 8.5_

  - [x] 7.2 Add `GET /results` endpoint in `api/routers/jobs.py`
    - List files in `analytics-engine/data/pre-processed/` and return filenames
    - _Requirements: 6.2, 6.4_

  - [ ]* 7.3 Write property test for authentication rejection (Property 11)
    - **Property 11: Authentication rejection**
    - **Validates: Requirements 8.2**
    - Any request missing or with wrong `X-API-Key` must return 401 regardless of endpoint
    - Place in `api/tests/test_properties.py`

  - [ ]* 7.4 Write property test for JSON response contract (Property 12)
    - **Property 12: JSON response contract**
    - **Validates: Requirements 8.3, 8.5**
    - Any valid request to any endpoint must return `Content-Type: application/json` with a valid JSON body
    - Place in `api/tests/test_properties.py`

  - [ ]* 7.5 Write unit tests for auth middleware
    - Test missing key, wrong key, correct key scenarios
    - Place in `api/tests/test_auth.py`
    - _Requirements: 8.2_

- [x] 8. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend CSV upload page
  - [x] 9.1 Create `src/pages/csv-upload-page.js` following the `createXxxContent()` pattern
    - Upload panel: drag-and-drop zone + file picker; on file select show name, size, and 5-row preview table
    - File manager table: fetches `GET /files` on load; columns for filename, size, uploaded_at, file_type, delete button
    - Processing panel: "Run Analytics" button (`POST /jobs`), step indicator, output file links
    - All API calls include `X-API-Key` header read from `window.MATHVISION_API_KEY` or a config constant
    - _Requirements: 1.1, 1.2, 1.3, 3.3, 4.1, 6.2, 6.4_

  - [x] 9.2 Create `src/entries/csv-upload-entry.js` following the `mountPage` pattern
    - Import `mountPage` from `/src/app.js` and `createCsvUploadContent` from the page module
    - Set `route: '/csv-upload.html'`, `title: 'CSV Upload'`, `breadcrumb: 'CSV Upload'`
    - _Requirements: 1.1_

  - [x] 9.3 Create `csv-upload.html` HTML shell following the pattern of existing HTML files (e.g. `dashboard.html`)
    - Reference `src/entries/csv-upload-entry.js` as the entry script
    - _Requirements: 1.1_

  - [x] 9.4 Register the new page in `vite.config.js` `rollupOptions.input`
    - Add `csvUpload: 'csv-upload.html'`
    - _Requirements: 1.1_

- [x] 10. Add CSV Upload to navigation and implement status polling
  - [x] 10.1 Add nav entry in `src/config/nav.js`
    - Append `{ label: 'CSV Upload', path: '/csv-upload.html', icon: 'cloud-upload' }` to `navLinks`
    - _Requirements: 1.1_

  - [x] 10.2 Implement 5-second polling loop in `csv-upload-page.js`
    - After `POST /jobs` succeeds, start `setInterval` calling `GET /jobs/{job_id}` every 5 seconds
    - Update step indicator and status text on each poll; stop polling on `complete` or `failed`
    - On `failed`, display stderr excerpt and a "Retry" button
    - On `complete`, show `completed_at`, output file links, and download anchors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Hypothesis (`pip install hypothesis`) and live in `api/tests/test_properties.py`
- The backend must be started separately (`uvicorn api.main:app --reload`) before the frontend can call it
- No changes are made to existing notebooks or CSV schemas
