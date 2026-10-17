# Deployment, Reproducibility & Operational Runbook

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 18 — Phase 11: Deployment and Reproducibility)
**Applicability:** Workstation setup, server deployment, environment configuration, persistence guarantees, backup/restore procedures, automated smoke tests, and fail-closed empirical readiness gating.

---

## 1. Architectural Overview & Deployment Targets

The platform consists of a decoupled two-tier architecture:
1. **Frontend Workstation:** React 19 + TypeScript + Vite single-page application.
2. **Analytical Backend:** Python 3.12 + FastAPI + SQLAlchemy 2.x analytical engine with XGBoost and scikit-learn.
3. **Data & Artifact Persistence:**
   - Relational Database: SQLite 3 (`flyash.db`) with strict foreign key constraints (`PRAGMA foreign_keys=ON`).
   - Literature Document Storage: Local filesystem directory (`backend/data/documents/`) with SHA-256 cryptographic deduplication.
   - Model Registry Artifacts: Serialized joblib pipelines (`backend/data/models/`) containing fitted XGBoost regressors, training-fold preprocessors, and feature manifests.

### Recommended Deployment Environments

| Environment | Purpose | Frontend Target | Backend Target | Storage Mechanism |
|---|---|---|---|---|
| **Local Workstation** | Curation, research EDA, and interactive formulation | Vite dev server (`http://localhost:5173`) | Uvicorn (`http://127.0.0.1:8000`) | Local filesystem (`backend/data/`) |
| **Institutional Server / VM** | Shared laboratory deployment for research teams | Nginx serving static bundle (`dist/`) | Systemd + Uvicorn worker process | Persistent SSD volume / network mount |
| **Containerized (Docker)** | Reproducible multi-platform deployment | Nginx container (`alpine`) | Python 3.12-slim container | Docker named volume mounted to `/app/backend/data` |
| **Cloud Deployment** | Web access for civil engineering practitioners | Vercel / Netlify static hosting | Render / Fly.io persistent container | Attached persistent volume (e.g. Fly.io Volume) |

> [!CAUTION]
> **Ephemeral Storage Prohibition:**
> The backend database (`flyash.db`), literature documents, and model artifacts must never be hosted on ephemeral container layers (e.g., standard Heroku dynos or stateless AWS Lambda instances). Ephemeral restarts destroy curated research records and violate reproducibility requirements. A persistent volume mount is mandatory.

---

## 2. Environment Variables & Security Hardening

Configuration is managed via Pydantic Settings (`backend/app/core/config.py`).

### Environment Variables Matrix

| Variable Name | Default | Required in Production | Description |
|---|---|---|---|
| `APP_NAME` | `"FlyAsh Intel API"` | No | Public application name displayed in API responses |
| `APP_ENV` | `"development"` | **Yes (`production`)** | Environment identifier (`development`, `test`, `production`) |
| `API_V1_STR` | `"/api"` | No | Common route prefix for all API endpoints |
| `HOST` | `"127.0.0.1"` | No | HTTP bind host address (`0.0.0.0` in Docker/VM) |
| `PORT` | `8000` | No | HTTP listening port |
| `CORS_ORIGINS` | `"http://localhost:5173,http://127.0.0.1:5173"` | **Yes** | Comma-delimited list of approved frontend origins |
| `DATABASE_URL` | `"sqlite:///./backend/data/flyash.db"` | No | SQLAlchemy database URI |
| `DOCUMENTS_STORAGE_DIR` | `"backend/data/documents"` | No | Storage path for ingested literature PDFs |
| `MODELS_STORAGE_DIR` | `"backend/data/models"` | No | Storage path for trained XGBoost joblib artifacts |
| `MAX_UPLOAD_SIZE_BYTES` | `15728640` (15 MB) | No | Maximum permitted file upload size |
| `CANONICAL_SCHEMA_VERSION` | `"v1.0.0-canonical"` | No | Supported research schema specification version |

### Production Hardening Guidelines

1. **Set `APP_ENV=production`:** Disables development conveniences and ensures structured error handling without internal stack trace leakage.
2. **Restrict CORS Origins:** Never use wildcard `*` in production. Explicitly whitelist the domain name(s) hosting the frontend application.
3. **Enforce Upload Limits:** Retain `MAX_UPLOAD_SIZE_BYTES=15728640` to protect the server against denial-of-service memory exhaustion via oversized PDF or CSV uploads.
4. **Isolate Database Files:** Ensure directory permissions on `backend/data/` permit read/write access only to the executing backend user process (`chmod 700 backend/data`).
5. **No Secret Keys in Git:** Environment configuration files (`.env`) are excluded by `.gitignore`. Template examples are provided in `.env.example`.

---

## 3. Step-by-Step Reproducible Setup & Deployment

### Step 3.1: Clone and Environment Initialization

```powershell
# 1. Clone repository
git clone https://github.com/SwayamMandhani06/flyash-brick-ai.git
cd flyash-brick-ai

# 2. Set up Python virtual environment
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1

# 3. Install exact-pinned reproducible dependencies
pip install -r backend\requirements-lock.txt

# 4. Configure environment variables
cp backend\.env.example backend\.env
```

### Step 3.2: Database Initialization

Database initialization is completely non-destructive and idempotent:
```powershell
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python.exe -c "from backend.app.persistence.database import init_db; init_db()"
```
This initializes all 9 relational tables (`papers`, `documents`, `records`, `review_history`, `validation_runs`, `validation_findings`, `dataset_versions`, `model_metadata`, `optimization_runs`) and ensures foreign key enforcement is active without altering or dropping existing rows.

### Step 3.3: Frontend Production Build

```powershell
# 1. Install frontend packages
npm ci

# 2. Verify code quality and lint rules
npm run lint

# 3. Build optimized static distribution
npm run build
```
Build outputs are generated in `dist/` ready for static serving via Nginx, Vercel, or any static HTTP web server.

### Step 3.4: Launch Production Backend

```powershell
# Run Uvicorn in production mode (without --reload)
.\backend\.venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --workers 2
```

---

## 4. Persistence, Backup, and Disaster Recovery

### Database Persistence Guarantee
- SQLite database writes use ACID transactions via SQLAlchemy sessions.
- Foreign key cascading and constraints prevent orphan child records in `review_history` and `validation_findings`.
- Application restarts and redeployments preserve all tables, papers, records, and history.

### Live Backup Procedure
To create an atomic, non-blocking backup of the SQLite database while the application is online:
```powershell
# In PowerShell / Command Prompt:
sqlite3 backend\data\flyash.db ".backup 'backend/data/flyash_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db'"
```
Or via Python:
```python
import sqlite3
import shutil
from datetime import datetime, timezone

timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
src = sqlite3.connect("backend/data/flyash.db")
dst = sqlite3.connect(f"backend/data/flyash_backup_{timestamp}.db")
with dst:
    src.backup(dst)
dst.close()
src.close()
```

### Complete Disaster Recovery Snapshot
To backup the full application state (database, uploaded PDFs, and trained models):
```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Compress-Archive -Path "backend\data\flyash.db", "backend\data\documents", "backend\data\models" -DestinationPath "flyash_state_backup_$timestamp.zip"
```

### Rollback Procedure
1. Stop the backend process: `Stop-Process -Name uvicorn`
2. Restore database from backup: `Copy-Item backend\data\flyash_backup_<timestamp>.db -Destination backend\data\flyash.db -Force`
3. Restart backend service.

---

## 5. Health, Readiness, and Deployment Smoke Checks

### Liveness and Readiness Endpoints

| Endpoint | Method | Success Code | Purpose |
|---|---|---|---|
| `/api/health` | `GET` | `200 OK` | Process liveness check confirming the HTTP worker is active |
| `/api/ready` | `GET` | `200 OK` | Subsystem connectivity check (database operational, extraction active) |
| `/api/datasets/readiness` | `GET` | `200 OK` | Empirical research data readiness diagnostics and gate assessment |

### Automated Smoke Check Execution

Execute the automated deployment smoke check script to verify server health, database connectivity, endpoint contracts, and fail-closed security gates:

```powershell
# Option A: Run automated smoke test suite via pytest
.\backend\.venv\Scripts\pytest.exe backend\tests\test_deployment_and_smoke.py -v

# Option B: Run standalone CLI smoke script against live running backend (http://127.0.0.1:8000)
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python.exe scripts\deployment_smoke_check.py --url http://127.0.0.1:8000
```

---

## 6. Empirical Data Readiness & Fail-Closed Scientific Gates

### The Golden Rule of Research Integrity
The deployment does **not** manufacture synthetic or placeholder models to make screens look complete.

### Live Status Assessment
When deployed with a fresh database or prior to literature ingestion:
- **Registered Academic Papers:** `0`
- **Uploaded Documents:** `0`
- **Extracted Formulation Records:** `0`
- **Accepted Empirical Records:** `0`
- **Dataset Snapshots:** `0`
- **Trained Model Artifacts:** `0`

### Operational Gate Thresholds (`PLAN.md` Section 12)
Model training (`POST /api/models/train`) is blocked unless the dataset satisfies:
- **Preliminary Gate:** $\ge 15$ accepted empirical samples from $\ge 3$ independent publications (`paper_id`).
- **Full Gate:** $\ge 30$ accepted empirical samples from $\ge 5$ independent publications with $< 20\%$ missingness.

### Fail-Closed Endpoint Behaviors

| Action | Endpoint | Current Behavior | Unlocking Condition |
|---|---|---|---|
| **Model Training** | `POST /api/models/train` | `HTTP 422 Unprocessable Content`<br/>(`DATA_READINESS_BLOCKED`) | Curate $\ge 15$ accepted records across $\ge 3$ independent papers |
| **Model Prediction** | `POST /api/models/predict` | `HTTP 503 Service Unavailable`<br/>(`MODEL_UNAVAILABLE`) | Train and register model for requested target |
| **SHAP Explanation** | `POST /api/models/explain` | `HTTP 503 Service Unavailable`<br/>(`MODEL_UNAVAILABLE`) | Train and register model for requested target |
| **Constrained Optimization** | `POST /api/optimization/run` | `HTTP 503 Service Unavailable`<br/>(`OPTIMIZATION_UNAVAILABLE`) | Both models trained and $\ge 15$ empirical records available |

---

## 7. Operational Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| Backend fails on startup with `OperationalError: unable to open database file` | `backend/data` directory missing or lacks write permissions | Create directory `mkdir -p backend/data` and verify file permissions |
| Upload fails with `413 Payload Too Large` | PDF or CSV exceeds 15 MB limit | Split large appendices or optimize PDF compression |
| Training returns `422 DATA_READINESS_BLOCKED` | Accepted empirical samples $< 15$ or distinct papers $< 3$ | Curate literature papers via CSV import or PDF extraction guide |
| Prediction returns `503 MODEL_UNAVAILABLE` | No trained model registered in database | Empirical data required before model training can be activated |
| Frontend fails to connect to backend | CORS origin mismatch or backend not running on port 8000 | Verify backend is running; check `CORS_ORIGINS` in `backend/.env` |
