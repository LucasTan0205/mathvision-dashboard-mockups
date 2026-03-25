# Requirements Document

## Introduction

The CSV Analytics Integration feature enables users to upload CSV data files through the MathVision web dashboard and trigger analytics processing in the Python analytics engine. This creates a bridge between the web interface and the existing analytics system, allowing for dynamic data updates and on-demand analytics execution.

## Glossary

- **Web_Dashboard**: The MathVision multi-page analytics dashboard built with Vite and JavaScript
- **Analytics_Engine**: The Python-based analytics system with Jupyter notebooks for processing student/tutor data
- **CSV_Uploader**: The web component that handles file upload functionality
- **File_Validator**: The component that validates uploaded CSV files for format and content
- **Analytics_Processor**: The backend service that executes analytics processing on uploaded data
- **Processing_Monitor**: The component that tracks and displays analytics job status
- **Data_Manager**: The component that manages CSV file storage and organization

## Requirements

### Requirement 1: CSV File Upload Interface

**User Story:** As an analytics user, I want to upload CSV files through the web dashboard, so that I can provide new data for analytics processing.

#### Acceptance Criteria

1. THE Web_Dashboard SHALL provide a dedicated CSV upload page accessible from the main navigation
2. WHEN a user selects a CSV file, THE CSV_Uploader SHALL display file name, size, and preview of first 5 rows
3. THE CSV_Uploader SHALL support uploading multiple CSV files simultaneously
4. WHEN a file exceeds 50MB, THE CSV_Uploader SHALL reject the upload and display an error message
5. THE CSV_Uploader SHALL accept only files with .csv extension

### Requirement 2: CSV File Validation

**User Story:** As an analytics user, I want uploaded CSV files to be validated, so that I can ensure data quality before processing.

#### Acceptance Criteria

1. WHEN a CSV file is uploaded, THE File_Validator SHALL verify the file format is valid CSV
2. THE File_Validator SHALL check for required columns based on file type (students, tutors, or pairings)
3. IF a required column is missing, THEN THE File_Validator SHALL return a descriptive error message
4. THE File_Validator SHALL validate data types for key columns (IDs as integers, dates as valid formats)
5. WHEN validation passes, THE File_Validator SHALL display a success confirmation

### Requirement 3: Data File Management

**User Story:** As an analytics user, I want to manage uploaded CSV files, so that I can organize and track my data inputs.

#### Acceptance Criteria

1. THE Data_Manager SHALL store uploaded CSV files in the analytics-engine/data/raw/ directory
2. WHEN a file with the same name exists, THE Data_Manager SHALL create a timestamped backup of the existing file
3. THE Web_Dashboard SHALL display a list of all uploaded CSV files with upload timestamps
4. THE Data_Manager SHALL allow users to delete previously uploaded files
5. THE Data_Manager SHALL maintain a log of all file operations (upload, delete, backup)

### Requirement 4: Analytics Processing Trigger

**User Story:** As an analytics user, I want to trigger analytics processing after uploading data, so that I can generate updated insights.

#### Acceptance Criteria

1. WHEN CSV files are successfully uploaded, THE Web_Dashboard SHALL display a "Run Analytics" button
2. WHEN the "Run Analytics" button is clicked, THE Analytics_Processor SHALL execute the preprocessing notebook
3. AFTER preprocessing completes successfully, THE Analytics_Processor SHALL automatically execute the analytics notebook
4. THE Analytics_Processor SHALL use the uploaded CSV files as input data for processing
5. IF any processing step fails, THEN THE Analytics_Processor SHALL log the error and notify the user

### Requirement 5: Processing Status Monitoring

**User Story:** As an analytics user, I want to monitor analytics processing status, so that I can track job progress and identify issues.

#### Acceptance Criteria

1. WHEN analytics processing starts, THE Processing_Monitor SHALL display a progress indicator
2. THE Processing_Monitor SHALL show current processing step (preprocessing, analytics, or complete)
3. WHILE processing is running, THE Processing_Monitor SHALL update status every 5 seconds
4. WHEN processing completes successfully, THE Processing_Monitor SHALL display completion time and output file locations
5. IF processing fails, THEN THE Processing_Monitor SHALL display error details and suggested next steps

### Requirement 6: Results Integration

**User Story:** As an analytics user, I want to view processing results in the dashboard, so that I can analyze the generated insights.

#### Acceptance Criteria

1. WHEN analytics processing completes, THE Web_Dashboard SHALL automatically refresh relevant analytics pages
2. THE Web_Dashboard SHALL display links to generated output files (analytics_model_metrics.csv, analytics_scenario_rankings.csv)
3. THE Web_Dashboard SHALL show processing completion timestamp on analytics pages
4. THE Web_Dashboard SHALL provide download links for all generated analytics outputs
5. WHEN new results are available, THE Web_Dashboard SHALL display a notification banner

### Requirement 7: CSV Parser and Serializer

**User Story:** As a developer, I want to parse and serialize CSV files reliably, so that data integrity is maintained throughout the system.

#### Acceptance Criteria

1. WHEN a valid CSV file is provided, THE CSV_Parser SHALL parse it into structured data objects
2. WHEN an invalid CSV file is provided, THE CSV_Parser SHALL return a descriptive error message
3. THE CSV_Serializer SHALL format structured data objects back into valid CSV files
4. FOR ALL valid CSV data objects, parsing then serializing then parsing SHALL produce equivalent data (round-trip property)
5. THE CSV_Parser SHALL handle common CSV variations (different delimiters, quoted fields, escaped characters)

### Requirement 8: Backend API Integration

**User Story:** As a system integrator, I want a REST API for file operations, so that the web frontend can communicate with the analytics backend.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoints for file upload, validation, and processing triggers
2. WHEN an API request is received, THE Backend_API SHALL authenticate the request
3. THE Backend_API SHALL return structured JSON responses for all operations
4. WHEN processing is requested, THE Backend_API SHALL queue the job and return a job identifier
5. THE Backend_API SHALL provide status endpoints for monitoring job progress