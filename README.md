# Skill Intelligence System

A full-stack application for AI-powered resume analysis and candidate-job matching.
Upload resumes, let an LLM extract structured skill profiles, then rank every
candidate against a role — defined manually or parsed from a pasted job description.

## Features

- **Resume upload & parsing** — single or bulk upload of PDF/DOCX/TXT resumes with drag & drop
- **AI skill extraction** — technical skills, soft skills, proficiency, experience, domains, and contact info
- **Smart matching** — rank candidates against a role with exact canonical skill matching (a "Java" requirement never matches "JavaScript")
- **Job-description mode** — paste a full JD and the AI extracts the requirements automatically
- **Candidate pipeline** — statuses (new → contacted → interviewed → hired/rejected), favorites, notes, salary expectations
- **Search & filters** — by name, skill, proficiency, domain, experience, status, favorites
- **Comparison** — side-by-side comparison of selected candidates
- **Analytics** — top skills, experience distribution, and pipeline breakdown
- **Export** — download the candidate database as JSON

## Architecture

| Layer | Stack |
|---|---|
| Backend | FastAPI, Pydantic, single JSON candidate store with atomic writes |
| LLM | Groq / Azure OpenAI / OpenAI — auto-detected from `.env` |
| Frontend | React 19 (`.jsx`) on Vite, Recharts, Axios |

```
skill-intelligence-system/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── config.py             # Env config + paths (anchored, CWD-independent)
│   ├── schemas.py            # Pydantic request models
│   ├── routers/
│   │   ├── candidates.py     # CRUD, search, upload, export, bulk delete
│   │   └── recommend.py      # Candidate ranking
│   └── services/
│       ├── store.py          # CandidateStore — single source of truth (JSON, atomic writes)
│       ├── llm.py            # Provider-agnostic LLM client (Groq/Azure/OpenAI)
│       ├── extractor.py      # Resume & job-description extraction prompts
│       ├── recommender.py    # Scoring engine (60% required / 10% preferred / 30% experience)
│       ├── skills.py         # Canonical skill names + alias table
│       └── pdf_processor.py  # PDF/DOCX/TXT text extraction
├── frontend/client/          # Vite + React app
│   └── src/
│       ├── App.jsx
│       ├── api/client.js     # API layer (base URL via VITE_API_URL)
│       ├── pages/            # Upload, Candidates, Match, Results, Analytics
│       ├── components/       # Cards, modals, filter bar, icons, badges
│       └── context/          # Toast notifications
└── data/
    ├── candidates.json       # Candidate database (created at first run)
    └── resumes/              # Uploaded resume files
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- An LLM API key: [Groq](https://console.groq.com) (free tier available), Azure OpenAI, or OpenAI

Each half of the stack declares its dependencies in its ecosystem's standard
manifest — there is no single shared file, and none is needed:

| Layer | Manifest | Installed with |
|---|---|---|
| Backend (Python) | `backend/requirements.txt` | `pip install -r requirements.txt` |
| Frontend (npm) | `frontend/client/package.json` | `npm install` |

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

copy .env.example .env          # then put your API key in .env
python main.py                  # → http://localhost:8001 (docs at /docs)
```

`.env` — set exactly one provider; the backend picks it up automatically:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### 2. Frontend

```bash
cd frontend/client
npm install
npm run dev                     # → http://localhost:3000
```

The frontend targets `http://localhost:8001` by default; override with a
`VITE_API_URL` env variable if the backend runs elsewhere.

## API overview

Interactive docs at `http://localhost:8001/docs`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/candidates` | List candidates (optional filters: `q`, `skill`, `status`, `is_favorite`, `min_experience`, `max_experience`, `location`) |
| `POST` | `/api/candidates/upload` | Upload a resume (PDF/DOCX/TXT); re-uploading a known candidate (matched by email, falling back to name) updates their profile |
| `GET` | `/api/candidates/{id}/resume` | View/download the candidate's original resume file |
| `PUT` | `/api/candidates/{id}` | Update candidate fields (status, notes, favorite, …) |
| `DELETE` | `/api/candidates/{id}` | Delete a candidate |
| `POST` | `/api/candidates/bulk-delete` | Delete multiple candidates by id |
| `GET` | `/api/candidates/export` | Export the full database as JSON |
| `POST` | `/api/recommend` | Rank candidates — `mode: "manual"` with skills, or `mode: "description"` with a raw JD |

## Matching engine

Each candidate gets a weighted score against the role:

- **60%** — share of required skills matched (exact canonical match via alias table: `nodejs` ≡ `Node.js`, `k8s` ≡ `Kubernetes`, …)
- **10%** — share of preferred skills matched
- **30%** — experience (full credit if the minimum is met, half otherwise)

The "Why this ranking?" view in the UI breaks the score down per component with
the matched, missing, and bonus skills as evidence.
