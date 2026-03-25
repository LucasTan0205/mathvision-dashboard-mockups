# Requirements Document

## Introduction

The Analytics Dashboard Integration feature closes the gap between the MathVision analytics engine and the web dashboard. Currently the analytics engine produces `analytics_scenario_rankings.csv` and `analytics_model_metrics.csv`, but no API endpoints serve their content and every dashboard chart is hardcoded with static mock data. This feature adds three interconnected capabilities: (1) a time-series output from the analytics engine that aggregates mapping quality by `session_date`; (2) new API endpoints that expose analytics output files as JSON; and (3) frontend wiring that replaces hardcoded mock data across all dashboard pages with real data fetched from those endpoints.

## Glossary

- **Analytics_Engine**: The Python-based analytics system (Jupyter notebooks) that processes student/tutor data and writes output CSVs to `analytics-engine/data/pre-processed/`
- **API**: The FastAPI backend at `api/`, which exposes REST endpoints consumed by the frontend
- **Dashboard**: The MathVision multi-page web application built with Vite and JavaScript
- **Timeseries_Generator**: The new analytics component that aggregates `final_score` from `analytics_scenario_rankings.csv` by `session_date` from `pairings_raw.csv` and writes `analytics_mapping_quality_timeseries.csv`
- **Analytics_Data_Router**: The new or extended FastAPI router that serves analytics output CSV content as JSON
- **Mapping_Quality_Chart**: The "Tutor-to-student mapping quality" line chart on the Manpower Management page (`src/pages/manpower-management-page.js`)
- **Scenario_Rankings**: The output file `analytics_scenario_rankings.csv` containing per-student tutor ranking rows with `final_score`, `predicted_success_probability`, and `explanation` columns
- **Model_Metrics**: The output file `analytics_model_metrics.csv` containing model evaluation metrics: `accuracy`, `precision`, `recall`, `f1`, `test_size`, `positive_rate_test`, `feature_policy`
- **Mapping_Quality_Timeseries**: The new output file `analytics_mapping_quality_timeseries.csv` with columns `date`, `avg_final_score`, `run_count`, `run_timestamp`
- **run_timestamp**: An ISO-8601 datetime string recorded at the moment an analytics run writes its output files
- **CSV_Parser**: The component that reads CSV files and converts rows to structured objects
- **CSV_Serializer**: The component that converts structured objects back to valid CSV text

---

## Requirements

### Requirement 1: Timeseries Generation in the Analytics Engine

**User Story:** As an operations manager, I want to see mapping quality scores over time, so that I can track whether tutor-to-student matching is improving or degrading across sessions.

#### Acceptance Criteria

1. WHEN an analytics run completes, THE Timeseries_Generator SHALL read `session_date` values from `pairings_raw.csv` and `final_score` values from `analytics_scenario_rankings.csv`
2. WHEN computing the timeseries, THE Timeseries_Generator SHALL group rows by `session_date` and compute the mean `final_score` for each date, storing the result as `avg_final_score`
3. WHEN computing the timeseries, THE Timeseries_Generator SHALL count the number of pairing rows per `session_date` and store the result as `run_count`
4. WHEN an analytics run completes, THE Timeseries_Generator SHALL record the current UTC datetime in ISO-8601 format as `run_timestamp` and attach it to every row in the output
5. WHEN an analytics run completes, THE Timeseries_Generator SHALL write the timeseries to `analytics-engine/data/pre-processed/analytics_mapping_quality_timeseries.csv` with columns `date`, `avg_final_score`, `run_count`, `run_timestamp`
6. WHEN `pairings_raw.csv` contains no rows with a valid `session_date`, THE Timeseries_Generator SHALL write an empty timeseries file with only the header row and SHALL NOT raise an unhandled exception
7. THE Timeseries_Generator SHALL sort output rows by `date` in ascending chronological order

---

### Requirement 2: API Endpoints for Analytics Output Data

**User Story:** As a frontend developer, I want REST endpoints that return analytics output file content as JSON, so that dashboard pages can fetch real data without parsing CSV files in the browser.

#### Acceptance Criteria

1. THE Analytics_Data_Router SHALL expose a `GET /analytics/mapping-quality-timeseries` endpoint that returns the rows of `analytics_mapping_quality_timeseries.csv` as a JSON array
2. THE Analytics_Data_Router SHALL expose a `GET /analytics/scenario-rankings` endpoint that returns the rows of `analytics_scenario_rankings.csv` as a JSON array
3. THE Analytics_Data_Router SHALL expose a `GET /analytics/model-metrics` endpoint that returns the rows of `analytics_model_metrics.csv` as a JSON array
4. WHEN a requested analytics output file does not exist, THE Analytics_Data_Router SHALL return HTTP 404 with a descriptive error message
5. WHEN a requested analytics output file exists but contains only a header row, THE Analytics_Data_Router SHALL return an empty JSON array with HTTP 200
6. THE Analytics_Data_Router SHALL require API key authentication consistent with the existing `verify_api_key` dependency used by other routers
7. THE Analytics_Data_Router SHALL be registered in `api/main.py` under the `/analytics` prefix

---

### Requirement 3: CSV Parser and Serializer for Analytics Outputs

**User Story:** As a developer, I want a reliable CSV parsing layer for analytics output files, so that data integrity is maintained when converting between CSV and JSON representations.

#### Acceptance Criteria

1. WHEN a valid CSV file is provided, THE CSV_Parser SHALL parse it into a list of dictionaries where each dictionary key corresponds to a column header
2. WHEN an invalid or malformed CSV file is provided, THE CSV_Parser SHALL return a descriptive error rather than silently producing incorrect data
3. THE CSV_Serializer SHALL format a list of dictionaries back into valid CSV text with a header row
4. FOR ALL valid CSV data objects, parsing then serializing then parsing SHALL produce an equivalent list of dictionaries (round-trip property)
5. THE CSV_Parser SHALL handle CSV files that contain quoted fields and fields with embedded commas without data corruption

---

### Requirement 4: Wire the Mapping Quality Chart with Real Data

**User Story:** As an operations manager, I want the "Tutor-to-student mapping quality" chart to display real session data over time, so that I can make staffing decisions based on actual matching performance rather than placeholder values.

#### Acceptance Criteria

1. WHEN the Manpower Management page loads, THE Mapping_Quality_Chart SHALL fetch data from `GET /analytics/mapping-quality-timeseries` instead of using hardcoded labels and values
2. WHEN the timeseries endpoint returns data, THE Mapping_Quality_Chart SHALL render `date` values as x-axis labels and `avg_final_score` values (scaled to a 0–100 percentage) as the "Mapping quality" dataset
3. WHEN the timeseries endpoint returns an empty array, THE Mapping_Quality_Chart SHALL display a "No data available" message in place of the chart canvas
4. WHEN the timeseries endpoint returns an error or is unreachable, THE Mapping_Quality_Chart SHALL display an error state message and SHALL NOT throw an unhandled JavaScript exception
5. WHEN the timeseries data contains more than 7 data points, THE Mapping_Quality_Chart SHALL display the most recent 7 data points by date
6. THE Mapping_Quality_Chart SHALL continue to render the static 90% target reference line regardless of whether live data is available

---

### Requirement 5: Replace Dashboard KPI Mock Data with Real Analytics Data

**User Story:** As an operations manager, I want the main dashboard KPI cards to reflect real analytics outputs, so that the summary metrics I see are accurate rather than illustrative.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Dashboard SHALL fetch model metrics from `GET /analytics/model-metrics` and display the `accuracy` value (formatted as a percentage) in the "Match score" KPI card
2. WHEN the Dashboard page loads, THE Dashboard SHALL fetch scenario rankings from `GET /analytics/scenario-rankings` and compute the count of distinct `student_id` values to display in a student coverage indicator
3. WHEN the model metrics endpoint returns an empty array or an error, THE Dashboard SHALL display the last known value if available in `localStorage`, or a "—" placeholder if no prior value exists
4. WHEN fresh analytics data is fetched successfully, THE Dashboard SHALL persist the fetched values to `localStorage` under a namespaced key so that subsequent page loads can show the last known value while a new fetch is in progress

---

### Requirement 6: Replace Records Page Mock Data with Real CSV Data

**User Story:** As an administrator, I want the Student and Tutor profile directories to be pre-populated from the uploaded CSV files, so that I do not have to manually re-enter data that already exists in the system.

#### Acceptance Criteria

1. THE Analytics_Data_Router SHALL expose a `GET /data/students` endpoint that returns the rows of `analytics-engine/data/raw/students.csv` as a JSON array
2. THE Analytics_Data_Router SHALL expose a `GET /data/tutors` endpoint that returns the rows of `analytics-engine/data/raw/tutors.csv` as a JSON array
3. WHEN the Records page loads and `localStorage` contains no student records, THE Dashboard SHALL fetch from `GET /data/students` and seed the student directory with the returned rows
4. WHEN the Records page loads and `localStorage` contains no tutor records, THE Dashboard SHALL fetch from `GET /data/tutors` and seed the tutor directory with the returned rows
5. WHEN the raw data endpoints return an error or an empty array, THE Records page SHALL display an empty directory with the existing "No records yet" empty state and SHALL NOT throw an unhandled JavaScript exception
6. WHEN `localStorage` already contains student or tutor records, THE Records page SHALL use the locally stored records and SHALL NOT overwrite them with data from the API

---

### Requirement 7: Replace Capacity Utilization Mock Data with Real Tutor Data

**User Story:** As an operations manager, I want the Capacity Utilization page to reflect real tutor hours derived from `pairings_raw.csv`, so that reassignment recommendations are based on actual session data.

#### Acceptance Criteria

1. THE Analytics_Data_Router SHALL expose a `GET /data/pairings` endpoint that returns the rows of `analytics-engine/data/raw/pairings_raw.csv` as a JSON array
2. WHEN the Capacity Utilization page loads, THE Dashboard SHALL fetch from `GET /data/pairings` and aggregate total `duration_hours` per `tutor_name` to compute each tutor's hours for the current period
3. WHEN the pairings endpoint returns data, THE Dashboard SHALL replace the hardcoded tutor hours array in `capacity-utilization-page.js` with the computed values
4. WHEN the pairings endpoint returns an empty array or an error, THE Dashboard SHALL fall back to the existing hardcoded tutor data and SHALL display a "Using sample data" indicator
5. WHEN computing tutor hours from pairings data, THE Dashboard SHALL include only rows where `session_date` falls within the most recent 30-day window relative to the latest `session_date` present in the dataset

---

### Requirement 8: Analytics Run Timestamp Visibility

**User Story:** As an operations manager, I want to see when the analytics data was last computed, so that I know whether the dashboard metrics are current or stale.

#### Acceptance Criteria

1. WHEN any analytics data endpoint returns data that includes a `run_timestamp` field, THE Dashboard SHALL display the most recent `run_timestamp` value as a human-readable "Last updated" label on the relevant page section
2. WHEN the `run_timestamp` is more than 24 hours before the current browser time, THE Dashboard SHALL display the "Last updated" label with an amber visual indicator to signal potentially stale data
3. WHEN no `run_timestamp` is available, THE Dashboard SHALL display "Data freshness unknown" in place of the "Last updated" label
