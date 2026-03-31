# Implementation Plan: Analytics Dashboard Integration

## Overview

Implement the full analytics-to-dashboard pipeline: add a timeseries generator cell to the analytics notebook, expose six read-only API endpoints in a new FastAPI router, then wire four frontend pages to replace hardcoded mock data with live fetches — with graceful fallback throughout.

## Tasks

- [x] 1. Add timeseries generator cell to the analytics notebook
  - In `analytics-engine/analytics/mathvision_analytics.ipynb`, add a new cell after the scenario-rankings cell
  - Load `analytics-engine/data/raw/pairings_raw.csv` and `analytics-engine/data/pre-processed/analytics_scenario_rankings.csv` into DataFrames
  - Inner-join on `student_id`, group by `session_date`, compute `mean(final_score)` → `avg_final_score` and `count()` → `run_count`
  - Stamp every row with `run_timestamp = datetime.utcnow().isoformat() + "Z"`
  - Sort ascending by `date`, write to `analytics-engine/data/pre-processed/analytics_mapping_quality_timeseries.csv`
  - If the join produces zero rows, write only the header row and exit without raising
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 1.1 Write property test for timeseries aggregation correctness
    - **Property 1: Timeseries aggregation correctness**
    - **Validates: Requirements 1.2, 1.3, 1.7**
    - Use `hypothesis` `@given` with generated lists of pairing and ranking rows; assert `avg_final_score` equals arithmetic mean, `run_count` equals row count, output is sorted ascending
    - File: `api/tests/test_properties.py`

  - [ ]* 1.2 Write property test for timeseries output schema invariant
    - **Property 2: Timeseries output schema invariant**
    - **Validates: Requirements 1.4, 1.5**
    - Assert every output row has exactly the four columns `date`, `avg_final_score`, `run_count`, `run_timestamp`, and all rows share the same `run_timestamp` value
    - File: `api/tests/test_properties.py`

- [x] 2. Create the analytics API router
  - Create `api/routers/analytics.py` with `router = APIRouter(tags=["analytics"])`
  - Define module-level path constants for `PRE_PROCESSED_DIR` and `RAW_DIR` using `pathlib.Path`
  - Implement all six endpoints using the shared pattern: check file existence (404 if missing), `path.read_text`, `parse_csv` wrapped in try/except returning `[]` on `ValueError`
    - `GET /analytics/mapping-quality-timeseries` → `pre-processed/analytics_mapping_quality_timeseries.csv`
    - `GET /analytics/scenario-rankings` → `pre-processed/analytics_scenario_rankings.csv`
    - `GET /analytics/model-metrics` → `pre-processed/analytics_model_metrics.csv`
    - `GET /data/students` → `raw/students.csv`
    - `GET /data/tutors` → `raw/tutors.csv`
    - `GET /data/pairings` → `raw/pairings_raw.csv`
  - All endpoints use `Depends(verify_api_key)`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2, 7.1_

  - [ ]* 2.1 Write property test for endpoints returning file contents as JSON
    - **Property 3: Analytics endpoints return file contents as JSON**
    - **Validates: Requirements 2.1, 2.2, 2.3, 6.1, 6.2, 7.1**
    - Use `hypothesis` to generate valid CSV strings; write to a temp file; assert endpoint response equals `parse_csv(content)`
    - File: `api/tests/test_properties.py`

  - [ ]* 2.2 Write property test for missing file returns HTTP 404
    - **Property 4: Missing file returns HTTP 404**
    - **Validates: Requirements 2.4**
    - For each endpoint, assert that when the backing file does not exist the response status is 404 and body contains a descriptive message
    - File: `api/tests/test_properties.py`

  - [ ]* 2.3 Write property test for unauthenticated requests return HTTP 401
    - **Property 5: Unauthenticated requests return HTTP 401**
    - **Validates: Requirements 2.6**
    - For each endpoint, assert that omitting or providing a wrong `X-API-Key` header yields a 401 response with no data
    - File: `api/tests/test_properties.py`

- [x] 3. Register the analytics router in `api/main.py`
  - Add `from api.routers import analytics` and `app.include_router(analytics.router)` in `api/main.py`
  - _Requirements: 2.7_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Wire the Manpower Management mapping quality chart
  - In `src/pages/manpower-management-page.js`, extend `initManpowerManagementCharts()` to fetch from `/analytics/mapping-quality-timeseries` with `X-API-Key` header before mounting `skillMappingChart`
  - Take the last 7 rows from the sorted response; scale `avg_final_score × 100` for y-axis values; use `date` values as x-axis labels
  - On empty array: replace the canvas element with `<p class="mp-no-data">No data available</p>`
  - On fetch error: replace the canvas element with `<p class="mp-error-state">Could not load mapping quality data</p>`; do not throw
  - Always render the 90% target reference line dataset regardless of data state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.1 Write property test for timeseries data transformation for chart
    - **Property 8: Timeseries data transformation for chart**
    - **Validates: Requirements 4.2**
    - Use `fast-check` to generate arrays of timeseries rows; assert x-axis labels equal `date` values and y-axis data equals `avg_final_score * 100` in the same order
    - File: `src/tests/analytics.properties.test.js` (or equivalent fast-check test file)

  - [ ]* 5.2 Write property test for most-recent-7 slicing
    - **Property 9: Most-recent-7 slicing**
    - **Validates: Requirements 4.5**
    - Use `fast-check` to generate arrays with more than 7 rows sorted ascending; assert the chart receives exactly the last 7 rows
    - File: `src/tests/analytics.properties.test.js`

- [x] 6. Wire the Dashboard KPI cards
  - Add `initDashboard()` as a new export in `src/pages/dashboard-page.js`
  - Fetch `GET /analytics/model-metrics`; read `rows[0].accuracy`; format as `(parseFloat(accuracy) * 100).toFixed(1) + '%'`; update the "Match score" KPI card DOM element
  - Fetch `GET /analytics/scenario-rankings`; compute `new Set(rows.map(r => r.student_id)).size`; update the student coverage indicator DOM element
  - On success, persist `{ matchScore, studentCount, fetchedAt, runTimestamp }` to `localStorage` under `mathvision-analytics-metrics`
  - On error or empty array, read from `localStorage`; if absent display `"—"`
  - Read `run_timestamp` from the model-metrics response (or timeseries if absent); display as "Last updated" label; add amber CSS class if `Date.now() - new Date(runTimestamp) > 24 * 3600 * 1000`; display "Data freshness unknown" if no timestamp
  - Wire `initDashboard()` into the dashboard entry point (`src/entries/dashboard-entry.js`)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.1, 8.2, 8.3_

  - [ ]* 6.1 Write property test for accuracy value formatting
    - **Property 10: Accuracy value formatting**
    - **Validates: Requirements 5.1**
    - Use `fast-check` to generate float strings in [0, 1]; assert formatted result equals `(parseFloat(v) * 100).toFixed(1) + '%'`
    - File: `src/tests/analytics.properties.test.js`

  - [ ]* 6.2 Write property test for distinct student count
    - **Property 11: Distinct student count**
    - **Validates: Requirements 5.2**
    - Use `fast-check` to generate arrays of ranking rows with varying `student_id` values; assert computed count equals `new Set(rows.map(r => r.student_id)).size`
    - File: `src/tests/analytics.properties.test.js`

  - [ ]* 6.3 Write property test for analytics metrics localStorage persistence
    - **Property 12: Analytics metrics localStorage persistence**
    - **Validates: Requirements 5.4**
    - Use `fast-check` to generate metrics objects; assert that after a successful fetch the values written to `localStorage` under `mathvision-analytics-metrics` are derivable from the fetched data and survive a subsequent read
    - File: `src/tests/analytics.properties.test.js`

  - [ ]* 6.4 Write property test for staleness classification
    - **Property 16: Staleness classification**
    - **Validates: Requirements 8.2**
    - Use `fast-check` to generate ISO-8601 timestamps; assert amber indicator is shown if and only if the timestamp is more than 24 hours before `Date.now()`
    - File: `src/tests/analytics.properties.test.js`

- [x] 7. Seed Records page from CSV data
  - In `src/pages/student-intake-page.js`, add `seedStudentsIfEmpty()` called at the end of `initStudentIntake()`: if `loadStudents()` returns a non-empty array, return immediately without calling the API
  - Fetch `GET /data/students`; map CSV columns to the existing record schema (`id: uid()`, `name`, `studentId`, `curriculum`, `grade`, `topics: []`, `slots: []`, `notes: ''`, `parent: ''`, `createdAt: Date.now()`); call `saveStudents(mapped)` then `render()`
  - On fetch error or empty response, show the existing empty state silently
  - Apply the same pattern in `src/pages/tutor-profiles-page.js` via `seedTutorsIfEmpty()` called at the end of `initTutorProfiles()`: fetch `GET /data/tutors`, map to tutor schema (`id`, `name`, `experience`, `curricula: []`, `topics: []`, `availability: []`, `history: ''`, `createdAt`), call `saveTutors(mapped)` then `render()`
  - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.1 Write property test for existing records are never overwritten
    - **Property 13: Existing records are never overwritten**
    - **Validates: Requirements 6.6**
    - Use `fast-check` to generate non-empty student/tutor arrays already in `localStorage`; assert that calling the seeding function leaves `localStorage` unchanged and does not invoke `fetch`
    - File: `src/tests/analytics.properties.test.js`

- [x] 8. Wire Capacity Utilization from pairings data
  - In `src/pages/capacity-utilization-page.js`, extend `initCapacityUtilizationCharts()` to fetch `GET /data/pairings` before building the tutor table
  - Compute `maxDate = max(rows.map(r => new Date(r.session_date)))`; filter rows where `session_date >= maxDate - 30 days`; group by `tutor_name`, sum `duration_hours`
  - Build a replacement `tutors` array `[{ name, hours, lastMonth: 0, avail: [] }]` and pass it to `buildDistribution()` and the table renderer
  - On fetch error or empty response, keep the hardcoded `tutors` array and insert a `<div class="cu-sample-indicator">Using sample data</div>` banner before the tutor table section
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.1 Write property test for pairings aggregation per tutor
    - **Property 14: Pairings aggregation per tutor**
    - **Validates: Requirements 7.2**
    - Use `fast-check` to generate arrays of pairing rows; assert aggregated `hours` per `tutor_name` equals the sum of `duration_hours` for that tutor within the filtered window
    - File: `src/tests/analytics.properties.test.js`

  - [ ]* 8.2 Write property test for 30-day window filter
    - **Property 15: 30-day window filter**
    - **Validates: Requirements 7.5**
    - Use `fast-check` to generate pairing rows with varying `session_date` values; assert the filter includes exactly rows where `session_date >= maxDate - 30 days` and excludes all others
    - File: `src/tests/analytics.properties.test.js`

- [ ] 9. Write property tests for CSV utilities
  - In `api/tests/test_properties.py`, add Hypothesis tests for the existing `parse_csv` / `serialize_csv` functions

  - [ ]* 9.1 Write property test for CSV round-trip
    - **Property 6: CSV round-trip**
    - **Validates: Requirements 3.4**
    - Use `hypothesis` to generate valid CSV strings; assert `parse_csv(serialize_csv(parse_csv(content), fieldnames))` equals the first parse result
    - File: `api/tests/test_properties.py`

  - [ ]* 9.2 Write property test for CSV parse keys match column headers
    - **Property 7: CSV parse keys match column headers**
    - **Validates: Requirements 3.1**
    - Use `hypothesis` to generate CSV strings with arbitrary headers; assert every dict returned by `parse_csv` has exactly the keys from the header row
    - File: `api/tests/test_properties.py`

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Python property tests use `hypothesis` (`@given`); JS property tests use `fast-check` (`fc.assert` / `fc.property`), minimum 100 iterations each
- The `MATHVISION_API_KEY` env var must be set for API tests; use `"dev-key"` in local development
- `lastMonth` and `avail` fields default to `0` / `[]` for pairings-derived tutor rows since those fields are not present in `pairings_raw.csv`
