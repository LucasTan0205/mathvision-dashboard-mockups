# MathVision Dashboard

Full-stack tutoring platform with automated student-tutor matching, standalone portals for students and tutors, and an Ops dashboard for manpower management.

## Stack

- Frontend: Vite + vanilla JS + Bootstrap CDN
- Backend: FastAPI + SQLite
- Matching engine: Integer Programming via `pulp` (CBC solver)
- Analytics: Jupyter notebooks (preprocessing + hybrid ML scoring)

## Project Structure

```
├── api/                        # FastAPI backend
│   ├── main.py                 # App entry point, lifespan DB init
│   ├── models.py               # Pydantic models
│   ├── routers/
│   │   ├── analytics.py        # Analytics CSV endpoints
│   │   ├── files.py            # CSV upload/management
│   │   ├── jobs.py             # Analytics job runner
│   │   └── matching.py         # Matching pipeline endpoints
│   └── services/
│       ├── hybrid_scorer.py    # Rule + ML hybrid scoring
│       ├── matching_service.py # Availability grouping + IP solver
│       ├── pairing_store.py    # SQLite persistence layer
│       └── job_runner.py       # Notebook execution
├── src/
│   ├── pages/                  # Page content modules
│   ├── entries/                # Vite entry points
│   └── lib/                    # Chart helpers
├── analytics-engine/           # Jupyter notebooks + data
├── student-portal.html         # Standalone student interface
├── tutor-portal.html           # Standalone tutor interface
└── manpower-management.html    # Ops interface
```

## Running Locally

Start the backend from the project root:

```bash
uvicorn api.main:app --reload
```

Start the frontend:

```bash
npm install
npm run dev
```

## Interfaces

| Interface | URL | Role |
|-----------|-----|------|
| Ops Dashboard | `/manpower-management.html` | Operations staff |
| Student Portal | `/student-portal.html` | Students |
| Tutor Portal | `/tutor-portal.html` | Tutors |

Each interface is fully standalone — no shared navigation between them.

## Demo Flow

Before the demo, seed the database with a pre-existing class:

```bash
python -m api.seed
```

This loads 8 students and 5 tutors into the DB. Sarah and Jebron Lames are intentionally excluded so they can be added live.

Pre-seeded students: Lucas Ong, Emma Lim, Aiden Tan, Priya Nair, Marcus Wong, Chloe Yeo, Ryan Koh, Sophia Lee

Pre-seeded tutors: Ms Hafizah Rahman, Mr Kevin Tan, Ms Priscilla Goh, Mr Darren Lim, Ms Aisha Binte Yusof

Then run the demo:

1. Sarah (student) goes to `/student-portal.html`, fills in her profile and selects her weekly availability, and submits
2. Jebron Lames (tutor) goes to `/tutor-portal.html`, fills in his profile and selects his availability, and submits
3. Trigger the matching pipeline via `POST /matching/run` — the IP solver groups all students and tutors by shared availability slots and finds the optimal whole-class assignment
4. Jebron sees his assigned students on the "My Sessions" tab of the tutor portal
5. Sarah sees her assigned tutor and schedule on the "My Schedule" tab of the student portal
6. Ops can monitor average matching satisfaction on the Tutor Student Pairing graph and tutor workload on the Utilisation panel in Manpower Management

## Matching Pipeline

`POST /matching/run` accepts a list of student and tutor profiles and:

1. Groups students and tutors by overlapping availability slots
2. For each group, runs an Integer Programming solver to maximise aggregate satisfaction scores across all students simultaneously
3. Uses utilisation as a tie-breaker — under-utilised tutors are preferred when scores are equal (encoded as a secondary term in the IP objective)
4. Persists results to SQLite for retrieval by students, tutors, and Ops

Key endpoints:

```
POST /matching/run                          # Run matching for a set of profiles
POST /matching/students                     # Submit a student profile
POST /matching/tutors                       # Submit a tutor profile
GET  /matching/students/{id}/pairings       # Get a student's confirmed sessions
GET  /matching/tutors/{id}/pairings         # Get a tutor's confirmed sessions
GET  /matching/stats/daily                  # Daily avg satisfaction (for Ops graph)
GET  /matching/tutors/utilisation           # Tutor utilisation summary
```

## Analytics Pipeline

The Ops dashboard includes a "Tutor-to-student mapping quality" graph fed by pre-processed CSV data. To regenerate it with new data:

1. Upload new student/tutor/pairing CSVs via the CSV Upload page
2. Click "Run Analytics" in the Ops dashboard — this executes the preprocessing and analytics Jupyter notebooks
3. The graph polls every 5 seconds and updates automatically

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

Production builds use `base: '/mathvision-dashboard-mockups/'` by default. Set `VITE_BASE_PATH` to override:

```bash
VITE_BASE_PATH='/your-repo-name/' npm run build
```

A GitHub Actions workflow at `.github/workflows/deploy-pages.yml` builds and deploys `dist/` on pushes to `main`. Set Pages source to `GitHub Actions` in repository settings.
