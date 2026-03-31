# Requirements Document

## Introduction

The Student-Tutor Matching Pipeline is a new end-to-end feature for the MathVision tutoring platform. It ingests student and tutor profiles (including availability), groups them by overlapping time slots, runs the existing hybrid analytics engine on each availability group to produce optimal whole-class pairings, and persists the results for retrieval by students, tutors, and Ops staff.

Alongside the matching pipeline, the feature introduces three standalone web interfaces — a Student Portal, a Tutor Portal, and an Ops (Manpower Management) view — each designed as a self-contained screen with no shared navigation chrome. The Ops view gains a real-time "Tutor Student Pairing" satisfaction graph and tutor utilisation indicators. The analytics engine is augmented to use tutor utilisation as a tie-breaker when match quality is equal.

---

## Glossary

- **Matching_Pipeline**: The server-side orchestration layer that receives profiles, groups by availability, invokes the Analytics_Engine, and writes results to the Pairing_Store.
- **Analytics_Engine**: The existing hybrid rule + ML matchmaking engine (defined in `analytics-engine/spec/mathvision_analytics_spec.md`) that scores and ranks student–tutor pairs.
- **Availability_Group**: A set of students and tutors who share at least one common time slot (e.g. `Mon_19`).
- **Pairing_Store**: The persistent data store (database or structured file) that holds confirmed match results, satisfaction scores, and utilisation data.
- **Student_Portal**: The standalone web interface through which a student submits their profile and availability and views their assigned tutors and schedule.
- **Tutor_Portal**: The standalone web interface through which a tutor submits their profile and availability and views the student profiles assigned to them for the week.
- **Ops_Interface**: The standalone web interface used by operations staff to monitor matching satisfaction, tutor utilisation, and manpower health.
- **Utilisation**: A tutor's ratio of hours worked to their contracted or maximum available hours within a given period, expressed as a percentage.
- **Satisfaction_Score**: The final hybrid match score (0–100) produced by the Analytics_Engine for a confirmed student–tutor pairing.
- **Pairing_Graph**: The "Tutor Student Pairing" chart in the Ops_Interface that displays average daily matching satisfaction over time.
- **Utilisation_Status**: A categorical label — Under-utilised, Appropriately-utilised, or Over-utilised — derived from a tutor's Utilisation value.

---

## Requirements

### Requirement 1: Student Profile and Availability Submission

**User Story:** As a student, I want to submit my profile details and weekly availability, so that the system can find me a suitable tutor for the times I am free.

#### Acceptance Criteria

1. THE Student_Portal SHALL provide a form that accepts the following student fields: name, curriculum (Local / IGCSE / IB), grade level (integer 5–12), weak topic (Fractions / Algebra / Geometry / Calculus / Statistics), and branch (Central / East / West).
2. THE Student_Portal SHALL provide a weekly timetable grid where the student can select one or more 30-minute availability slots.
3. WHEN a student submits the profile form with all required fields populated, THE Student_Portal SHALL send the profile and selected availability slots to the Matching_Pipeline via the backend API.
4. IF a student submits the profile form with one or more required fields missing, THEN THE Student_Portal SHALL display an inline validation error identifying each missing field and SHALL NOT submit the form.
5. WHEN the backend API confirms receipt of a student submission, THE Student_Portal SHALL display a confirmation message to the student.

---

### Requirement 2: Tutor Profile and Availability Submission

**User Story:** As a tutor, I want to submit my profile details and weekly availability, so that the system can assign me to students who need my expertise at times I am free.

#### Acceptance Criteria

1. THE Tutor_Portal SHALL provide a form that accepts the following tutor fields: name, tutor type (part-time / full-time / instructor), primary curriculum, specialty topic, years of experience (integer ≥ 0), rating (decimal 1.0–5.0), preferred minimum grade level, preferred maximum grade level, past success rate (decimal 0.0–1.0), and branch.
2. THE Tutor_Portal SHALL provide a weekly timetable grid where the tutor can select one or more available time slots.
3. WHEN a tutor submits the profile form with all required fields populated, THE Tutor_Portal SHALL send the profile and selected availability slots to the Matching_Pipeline via the backend API.
4. IF a tutor submits the profile form with one or more required fields missing or out of range, THEN THE Tutor_Portal SHALL display an inline validation error identifying each invalid field and SHALL NOT submit the form.
5. WHEN the backend API confirms receipt of a tutor submission, THE Tutor_Portal SHALL display a confirmation message to the tutor.

---

### Requirement 3: Availability Grouping

**User Story:** As the system, I want to group students and tutors by shared availability slots, so that the analytics engine only evaluates pairs who can actually meet.

#### Acceptance Criteria

1. WHEN the Matching_Pipeline receives a set of student profiles and a set of tutor profiles, THE Matching_Pipeline SHALL produce one Availability_Group per distinct time slot that contains at least one student and at least one tutor.
2. THE Matching_Pipeline SHALL assign each student to every Availability_Group that corresponds to one of the student's submitted availability slots.
3. THE Matching_Pipeline SHALL assign each tutor to every Availability_Group that corresponds to one of the tutor's submitted available slots.
4. IF a student has no availability slot that overlaps with any tutor's available slots, THEN THE Matching_Pipeline SHALL record that student as unmatched and SHALL NOT include that student in any Availability_Group passed to the Analytics_Engine.
5. THE Matching_Pipeline SHALL pass each Availability_Group independently to the Analytics_Engine for scoring.

---

### Requirement 4: Whole-Class Optimal Matching

**User Story:** As an ops manager, I want the analytics engine to find the best possible pairings for all students in a class at once, so that no student is left without a tutor and tutor capacity is used efficiently.

#### Acceptance Criteria

1. WHEN the Analytics_Engine receives an Availability_Group, THE Analytics_Engine SHALL produce a set of student–tutor pairings that maximises the aggregate Satisfaction_Score across all students in that group.
2. THE Analytics_Engine SHALL assign each student in an Availability_Group to at most one tutor per time slot.
3. THE Analytics_Engine SHALL not assign more students to a tutor in a single time slot than that tutor's per-slot student capacity allows.
4. THE Analytics_Engine SHALL compute the Satisfaction_Score for each candidate pairing using the existing hybrid formula: `final_score = 0.6 × rule_score + 0.4 × predicted_success_probability`.
5. WHEN two candidate pairings have equal Satisfaction_Scores (difference < 0.001), THE Analytics_Engine SHALL prefer the pairing that assigns the tutor with the lower current Utilisation value.
6. THE Analytics_Engine SHALL return the complete set of optimal pairings for the Availability_Group, including each pairing's Satisfaction_Score and the assigned tutor's Utilisation at the time of matching.

---

### Requirement 5: Utilisation Tie-Breaking

**User Story:** As an ops manager, I want under-utilised tutors to be preferred when match quality is equal, so that tutor workload is distributed fairly and over-utilisation is avoided.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL calculate each tutor's Utilisation as `(hours_worked_in_period / maximum_available_hours_in_period) × 100`, expressed as a percentage.
2. WHEN comparing two tutors with equal Satisfaction_Scores for the same student (difference < 0.001), THE Analytics_Engine SHALL select the tutor whose Utilisation is lower.
3. THE Analytics_Engine SHALL classify each tutor's Utilisation_Status as: Under-utilised when Utilisation < 70%, Appropriately-utilised when Utilisation is between 70% and 90% inclusive, and Over-utilised when Utilisation > 90%.
4. THE Analytics_Engine SHALL include each tutor's Utilisation and Utilisation_Status in the pairing output returned to the Matching_Pipeline.

---

### Requirement 6: Persisting Match Results

**User Story:** As a student or tutor, I want my match results to be saved, so that I can retrieve my assigned tutor or student list at any time.

#### Acceptance Criteria

1. WHEN the Analytics_Engine returns a set of pairings for an Availability_Group, THE Matching_Pipeline SHALL write each pairing to the Pairing_Store with the following fields: student_id, tutor_id, time_slot, satisfaction_score, tutor_utilisation, matched_at (ISO-8601 timestamp).
2. THE Pairing_Store SHALL support retrieval of all pairings for a given student_id.
3. THE Pairing_Store SHALL support retrieval of all pairings for a given tutor_id.
4. THE Pairing_Store SHALL support retrieval of all pairings created within a given date range, to support the Ops_Interface daily aggregation.
5. IF the Matching_Pipeline encounters a write error when saving to the Pairing_Store, THEN THE Matching_Pipeline SHALL log the error with the affected pairing details and SHALL return an error response to the caller.

---

### Requirement 7: Student Portal — Viewing Assigned Tutors

**User Story:** As a student, I want to see which tutors I have been assigned to and on which days, so that I know when and with whom my sessions are.

#### Acceptance Criteria

1. WHEN a student navigates to the Student_Portal timetable view, THE Student_Portal SHALL fetch and display all confirmed pairings for that student from the Pairing_Store.
2. THE Student_Portal SHALL display each confirmed pairing as a session block on the weekly timetable grid, showing the tutor's name and the time slot.
3. WHEN no confirmed pairings exist for the student, THE Student_Portal SHALL display an empty timetable with a message indicating that no sessions have been scheduled yet.
4. THE Student_Portal SHALL render as a standalone screen with no shared navigation elements from the Ops_Interface or Tutor_Portal.
5. THE Student_Portal SHALL use the visual design established in `additional/student_portal_v10-3.html` as the basis for its layout and styling.

---

### Requirement 8: Tutor Portal — Viewing Assigned Students

**User Story:** As a tutor, I want to see the profiles of each student I will be teaching that week, so that I can prepare appropriately for each session.

#### Acceptance Criteria

1. WHEN a tutor navigates to the Tutor_Portal timetable view, THE Tutor_Portal SHALL fetch and display all confirmed pairings for that tutor from the Pairing_Store for the current week.
2. THE Tutor_Portal SHALL display each confirmed session block on the weekly timetable grid, showing the student's name and time slot.
3. WHEN a tutor selects a confirmed session block, THE Tutor_Portal SHALL display a student profile card showing: student name, curriculum, grade level, weak topic, and branch.
4. WHEN no confirmed pairings exist for the tutor in the current week, THE Tutor_Portal SHALL display an empty timetable with a message indicating no sessions are scheduled.
5. THE Tutor_Portal SHALL render as a standalone screen with no shared navigation elements from the Ops_Interface or Student_Portal.
6. THE Tutor_Portal SHALL use the visual design established in `additional/tutor_portal_v3-3.html` as the basis for its layout and styling.

---

### Requirement 9: Ops Interface — Tutor Student Pairing Graph

**User Story:** As an ops manager, I want to view the average matching satisfaction for the day on the Tutor Student Pairing graph in Manpower Management, so that I can monitor the quality of automated pairings at a glance.

#### Acceptance Criteria

1. THE Ops_Interface SHALL display a "Tutor Student Pairing" graph in the Manpower Management section showing average Satisfaction_Score over time.
2. WHEN new pairings are written to the Pairing_Store, THE Ops_Interface SHALL update the Pairing_Graph within 5 seconds without requiring a full page reload.
3. THE Ops_Interface SHALL aggregate Satisfaction_Scores by day and display the daily average as a data point on the Pairing_Graph.
4. THE Pairing_Graph SHALL display at minimum the most recent 7 days of daily average Satisfaction_Scores.
5. WHEN no pairing data exists for a given day, THE Ops_Interface SHALL omit that day from the Pairing_Graph rather than plotting a zero value.

---

### Requirement 10: Ops Interface — Tutor Utilisation Indicators

**User Story:** As an ops manager, I want to see each tutor's utilisation status in the Manpower Management view, so that I can make informed decisions about staffing and workload distribution.

#### Acceptance Criteria

1. THE Ops_Interface SHALL display a utilisation summary panel listing each tutor with their current Utilisation percentage and Utilisation_Status label.
2. THE Ops_Interface SHALL visually distinguish the three Utilisation_Status categories using distinct colour coding: a green indicator for Appropriately-utilised, an amber indicator for Under-utilised, and a red indicator for Over-utilised.
3. WHEN a tutor's Utilisation changes (due to new pairings being saved), THE Ops_Interface SHALL reflect the updated Utilisation within 5 seconds without requiring a full page reload.
4. THE Ops_Interface SHALL render as a standalone screen with no shared navigation elements from the Student_Portal or Tutor_Portal.

---

### Requirement 11: Interface Isolation

**User Story:** As a user of any interface, I want each portal to feel like its own standalone application, so that I am not confused by navigation or UI elements intended for a different role.

#### Acceptance Criteria

1. THE Student_Portal, THE Tutor_Portal, and THE Ops_Interface SHALL each be served at a distinct URL path within the same web application.
2. THE Student_Portal SHALL NOT render any navigation bar, sidebar, or header element that belongs to the Tutor_Portal or Ops_Interface.
3. THE Tutor_Portal SHALL NOT render any navigation bar, sidebar, or header element that belongs to the Student_Portal or Ops_Interface.
4. THE Ops_Interface SHALL NOT render any navigation bar, sidebar, or header element that belongs to the Student_Portal or Tutor_Portal.

---

### Requirement 12: Matching Pipeline API

**User Story:** As a developer, I want a well-defined API for triggering and querying the matching pipeline, so that the frontend interfaces can reliably initiate matching runs and retrieve results.

#### Acceptance Criteria

1. THE Matching_Pipeline SHALL expose a POST endpoint that accepts a JSON body containing an array of student profiles and an array of tutor profiles, and returns a job identifier.
2. THE Matching_Pipeline SHALL expose a GET endpoint that accepts a job identifier and returns the current status of the matching run (queued / running / complete / failed) and, when complete, the list of pairings produced.
3. THE Matching_Pipeline SHALL expose a GET endpoint that accepts a student_id and returns all pairings for that student from the Pairing_Store.
4. THE Matching_Pipeline SHALL expose a GET endpoint that accepts a tutor_id and returns all pairings for that tutor from the Pairing_Store.
5. THE Matching_Pipeline SHALL expose a GET endpoint that returns aggregated daily average Satisfaction_Scores for use by the Pairing_Graph, accepting optional start_date and end_date query parameters.
6. IF a request to any Matching_Pipeline endpoint contains malformed JSON or missing required fields, THEN THE Matching_Pipeline SHALL return an HTTP 422 response with a descriptive error message.
