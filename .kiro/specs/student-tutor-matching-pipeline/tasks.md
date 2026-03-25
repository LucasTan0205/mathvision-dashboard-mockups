# Implementation Plan: Student-Tutor Matching Pipeline

## Overview

Implement the end-to-end matching pipeline by building the backend services and SQLite store first, then the FastAPI router, then the two standalone portals, and finally augmenting the Ops (Manpower Management) page. Each phase wires into the previous one so there is no orphaned code.

## Tasks

- [x] 1. Add Pydantic models for the matching pipeline
  - Add `StudentProfile`, `TutorProfile`, `PairingRecord`, `MatchingRunRequest`, `MatchingRunResponse`, `DailyStats`, and `TutorUtilisation` to `api/models.py`
  - Enforce all field constraints (Literal types, int/float ranges) using Pydantic validators
  - _Requirements: 1.1, 2.1, 4.6, 5.4, 12.1_

- [x] 2. Implement the Pairing Store (`api/services/pairing_store.py`)
  - [x] 2.1 Create `pairing_store.py` with SQLite schema initialisation
    - Create `pairings` and `matching_jobs` tables with indexes on `student_id`, `tutor_id`, and `matched_at`
    - Expose `init_db()` called at app startup
    - _Requirements: 6.1_

  - [x] 2.2 Implement `write_pairing`, `get_pairings_for_student`, `get_pairings_for_tutor`
    - Use a SQLite transaction for `write_pairing` so partial writes are rolled back on error
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 2.3 Implement `get_daily_stats` and `get_tutor_utilisation`
    - `get_daily_stats` groups by calendar day and returns `avg_satisfaction_score` and `pairing_count`; omit days with zero pairings
    - `get_tutor_utilisation` counts confirmed pairings per tutor (each slot = 0.5 h) and divides by max available hours
    - _Requirements: 6.4, 5.1, 9.3, 9.5_

  - [ ]* 2.4 Write property test for pairing store round-trip (P13)
    - **Property 13: Pairing store round-trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 2.5 Write property test for date-range filter correctness (P14)
    - **Property 14: Date-range filter correctness**
    - **Validates: Requirements 6.4**

  - [ ]* 2.6 Write property test for daily stats aggregation formula (P18)
    - **Property 18: Daily stats aggregation formula**
    - **Validates: Requirements 9.3, 12.5**

  - [ ]* 2.7 Write property test for empty-day omission (P19)
    - **Property 19: Empty-day omission**
    - **Validates: Requirements 9.5**

- [x] 3. Implement the Hybrid Scorer (`api/services/hybrid_scorer.py`)
  - [x] 3.1 Implement `rule_score`, `predicted_success_probability`, and `final_score`
    - `final_score = 0.6 × rule_score + 0.4 × predicted_success_probability`
    - `rule_score` encodes curriculum match, grade overlap, topic match, branch match, and rating
    - `predicted_success_probability` uses `past_success_rate` and experience as a proxy
    - _Requirements: 4.4_

  - [ ]* 3.2 Write property test for hybrid score formula invariant (P8)
    - **Property 8: Hybrid score formula invariant**
    - **Validates: Requirements 4.4**

- [x] 4. Implement the Matching Service (`api/services/matching_service.py`)
  - [x] 4.1 Implement `group_by_availability`
    - Produce one `AvailabilityGroup` per distinct time slot present in at least one student AND one tutor
    - Students/tutors with no overlapping slots go into `unmatched_student_ids`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property test for availability grouping correctness (P3)
    - **Property 3: Availability grouping correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 4.3 Write property test for unmatched students exclusion (P4)
    - **Property 4: Unmatched students are excluded from all groups**
    - **Validates: Requirements 3.4**

  - [x] 4.4 Implement `score_group` using Integer Programming (`pulp` + CBC solver)
    - For each availability group, compute `hybrid_scorer.final_score` for all student–tutor candidate pairs to build a score matrix
    - Fetch current utilisation for each tutor from the Pairing Store
    - Formulate IP: binary variables `x[i][j]` for each student–tutor pair; objective `maximise Σ(score[i][j] × x[i][j]) + 0.0001 × Σ((1 − utilisation[j]) × x[i][j])`; constraints: `Σ_j x[i][j] <= 1` per student, `Σ_i x[i][j] <= capacity[j]` per tutor
    - Solve with `pulp.PULP_CBC_CMD(msg=0)`; extract assigned pairs from solution
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.2_

  - [ ]* 4.5 Write property test for one-student-per-slot invariant (P6)
    - **Property 6: One-student-per-slot invariant**
    - **Validates: Requirements 4.2**

  - [ ]* 4.6 Write property test for tutor capacity invariant (P7)
    - **Property 7: Tutor capacity invariant**
    - **Validates: Requirements 4.3**

  - [ ]* 4.7 Write property test for utilisation tie-breaking (P9)
    - **Property 9: Utilisation tie-breaking**
    - **Validates: Requirements 4.5, 5.2**

  - [ ]* 4.8 Write property test for matching optimality (P5)
    - **Property 5: Matching optimality — aggregate satisfaction is maximal**
    - Use small groups (≤ 4 students, ≤ 4 tutors) for exhaustive comparison
    - **Validates: Requirements 4.1**

  - [x] 4.9 Implement `run_matching` — orchestrate grouping, scoring, and persistence
    - Write each pairing to the Pairing Store inside a transaction; log and raise HTTP 500 on write error
    - Return `MatchingRunResponse` with `job_id`, `status`, `pairings`, and `unmatched_student_ids`
    - _Requirements: 3.5, 6.1, 6.5, 12.1, 12.2_

  - [ ]* 4.10 Write property test for pairing output structural completeness (P10)
    - **Property 10: Pairing output structural completeness**
    - **Validates: Requirements 4.6, 5.4**

- [x] 5. Implement utilisation helpers in `api/services/matching_service.py`
  - [x] 5.1 Implement utilisation calculation and status classification
    - `utilisation = (hours_worked / max_available_hours) × 100`
    - Status: < 70 → Under-utilised, 70–90 → Appropriately-utilised, > 90 → Over-utilised
    - _Requirements: 5.1, 5.3_

  - [ ]* 5.2 Write property test for utilisation formula invariant (P11)
    - **Property 11: Utilisation formula invariant**
    - **Validates: Requirements 5.1**

  - [ ]* 5.3 Write property test for utilisation status classification (P12)
    - **Property 12: Utilisation status classification**
    - **Validates: Requirements 5.3**

- [x] 6. Checkpoint — Ensure all backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement the Matching Router (`api/routers/matching.py`) and wire into `api/main.py`
  - [x] 7.1 Create `api/routers/matching.py` with all eight endpoints
    - `POST /matching/run`, `GET /matching/jobs/{job_id}`, `POST /matching/students`, `POST /matching/tutors`, `GET /matching/students/{student_id}/pairings`, `GET /matching/tutors/{tutor_id}/pairings`, `GET /matching/stats/daily`, `GET /matching/tutors/utilisation`
    - All endpoints use the existing `verify_api_key` dependency
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 7.2 Register the matching router in `api/main.py` and call `pairing_store.init_db()` on startup
    - _Requirements: 12.1_

  - [ ]* 7.3 Write property test for HTTP 422 on malformed requests (P20)
    - **Property 20: HTTP 422 on malformed or incomplete requests**
    - **Validates: Requirements 12.6**

- [x] 8. Build the Student Portal
  - [x] 8.1 Create `student-portal.html` as a standalone Vite entry point (no shared nav chrome)
    - Mirror the cream/green palette, Playfair Display + DM Sans typography from `additional/student_portal_v10-3.html`
    - _Requirements: 7.4, 7.5, 11.1, 11.2_

  - [x] 8.2 Create `src/entries/student-portal-entry.js` and `src/pages/student-portal-page.js`
    - Profile submission form with inline validation for all required fields (name, curriculum, grade, weak topic, branch)
    - Weekly timetable grid with 30-min slots Mon–Sun for availability selection
    - On valid submit: POST to `/matching/students`, display confirmation message on success
    - On invalid submit: display inline error per missing/invalid field, do not call API
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.3 Implement confirmed pairings view in the student portal
    - Fetch pairings from `GET /matching/students/{student_id}/pairings` and render session blocks on the timetable
    - Each block shows tutor name and time slot
    - Display empty-state message when no pairings exist
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.4 Register `student-portal.html` as a Vite entry in `vite.config.js`
    - _Requirements: 11.1_

  - [ ]* 8.5 Write property test for valid form submission API payload shape (P2)
    - **Property 2: Valid form submission sends a correctly shaped API payload**
    - **Validates: Requirements 1.3, 2.3**

  - [ ]* 8.6 Write property test for portal pairing display completeness (P15)
    - **Property 15: Portal pairing display completeness**
    - **Validates: Requirements 7.1, 8.1**

  - [ ]* 8.7 Write property test for session block rendering completeness (P16)
    - **Property 16: Session block rendering completeness**
    - **Validates: Requirements 7.2, 8.2**

- [x] 9. Build the Tutor Portal
  - [x] 9.1 Create `tutor-portal.html` as a standalone Vite entry point (no shared nav chrome)
    - Mirror the purple/green palette from `additional/tutor_portal_v3-3.html`
    - _Requirements: 8.5, 8.6, 11.1, 11.3_

  - [x] 9.2 Create `src/entries/tutor-portal-entry.js` and `src/pages/tutor-portal-page.js`
    - Profile submission form with inline validation for all required tutor fields
    - Weekly timetable grid for availability selection
    - On valid submit: POST to `/matching/tutors`, display confirmation on success
    - On invalid submit: display inline error per invalid field, do not call API
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 9.3 Implement confirmed sessions view in the tutor portal
    - Fetch pairings from `GET /matching/tutors/{tutor_id}/pairings` and render session blocks on the timetable
    - Each block shows student name and time slot
    - Clicking a block renders a student profile card with: name, curriculum, grade level, weak topic, branch
    - Display empty-state message when no pairings exist for the current week
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.4 Register `tutor-portal.html` as a Vite entry in `vite.config.js`
    - _Requirements: 11.1_

  - [ ]* 9.5 Write property test for student profile card completeness (P17)
    - **Property 17: Student profile card completeness**
    - **Validates: Requirements 8.3**

- [x] 10. Augment the Ops Interface (`src/pages/manpower-management-page.js`)
  - [x] 10.1 Add the Tutor Student Pairing graph section
    - Add a new `shell-card` section with a Chart.js line chart rendering daily average satisfaction scores
    - Fetch from `GET /matching/stats/daily` on mount; poll every 5 s using `setInterval`
    - Use exponential back-off (max 30 s) on fetch failure
    - Omit days with no data (do not plot zero values)
    - Display at minimum the most recent 7 days
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.2 Add the Tutor Utilisation panel section
    - Add a new section listing each tutor with utilisation % and a colour-coded status badge
    - Green for Appropriately-utilised, amber for Under-utilised, red for Over-utilised
    - Fetch from `GET /matching/tutors/utilisation` on mount; poll every 5 s
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Python property tests go in `api/tests/test_matching_properties.py` using `hypothesis` (`@settings(max_examples=100)`)
- JavaScript property tests go in `src/tests/matching.properties.test.js` using `fast-check` (`fc.assert(..., { numRuns: 100 })`)
- Each property test must include a tag comment: `# Feature: student-tutor-matching-pipeline, Property N: <property_text>`
- The SQLite database file (`pairing_store.db`) lives alongside the existing `.job_state.json` in `analytics-engine/data/`
- Add `pulp` to `api/requirements.txt` — the CBC solver ships bundled with `pulp`, no separate install needed
