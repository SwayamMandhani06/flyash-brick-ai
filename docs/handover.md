# Project Handover, Verification & Research Activation Runbook

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 19.5 — Handover; Section 22 — Definition of Done)
**Applicability:** Engineering team handover, civil engineering research workflow, and operational reproducibility.

---

## 1. Project Overview & Approved Objectives

**FlyAsh Intel** is an end-to-end scientific platform engineered to standardize experimental literature, predict mechanical and durability properties using XGBoost, and prescribe Pareto-optimal mix formulations under explicit civil engineering constraints.

### The Three Approved Baseline Objectives
1. **Literature Extraction & Standardization:** Extract and standardize experimental fly ash brick formulation, manufacturing, and performance data from selected research publications while preserving source provenance.
2. **XGBoost-Based Quality Prediction:** Develop and evaluate XGBoost-based predictive models for compressive strength and water absorption using reviewed, comparable data and paper-grouped evaluation.
3. **Feasible Process Optimization:** Optimize and recommend candidate manufacturing formulations using XGBoost predictions, explicit feasibility constraints, uncertainty/extrapolation checks, and explainable results.

---

## 2. Environment Setup & Dependency Verification

### Prerequisites
- **Python:** 3.12 (verified: 3.12.10)
- **Node.js:** version 18.0 or higher (Node 20 recommended)
- **Git:** Git 2.40+

### Clean Clone Quickstart
```powershell
# 1. Clone repository
git clone https://github.com/SwayamMandhani06/flyash-brick-ai.git
cd flyash-brick-ai

# 2. Python Virtual Environment & Pinned Dependencies
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements-lock.txt

# 3. Frontend Packages & Verification
npm ci
npm run lint
npm run build

# 4. Database Initialization
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python.exe -c "from backend.app.persistence.database import init_db; init_db()"
```

---

## 3. Routine Verification Commands

Before deploying or committing changes, execute the four authoritative quality gates:

```powershell
# 1. Backend Automated Pytest Suite (137 tests passing)
.\backend\.venv\Scripts\pytest.exe backend\tests -v

# 2. Deployment & Subsystem Smoke Check CLI
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python.exe scripts\deployment_smoke_check.py --client

# 3. Frontend Code Quality & Lint
npm run lint

# 4. Frontend Production Bundle Build
npm run build
```

---

## 4. Activating Empirical Modeling (Step-by-Step)

The software foundation, database schema, paper-grouped XGBoost pipeline, and Pareto optimizer are completely implemented. However, the active empirical database currently contains **0 accepted research records**.

To activate empirical modeling without violating research integrity:

### Step 4.1: Register Literature Papers
Register genuine peer-reviewed publications containing empirical mix data (e.g., Kumar 2002, Turgut & Algin 2007) via `POST /api/papers`. Ensure bibliographic details, DOI, and author metadata are verified against publisher records or Scopus prior to registration.

### Step 4.2: Curate Literature Formulations
Use either curation pathway:
- **Batch CSV Import:** Download template (`GET /api/records/csv-template`), populate experimental mix rows from publication tables, and import via `POST /api/records/import-csv` with curator name and citation page.
- **PDF Upload & Table Extraction:** Upload authentic research PDF via `POST /api/documents/upload` and trigger positional extraction via `POST /api/documents/{id}/extract`.

### Step 4.3: Review, Correct & Accept Records
Review candidate rows in `DatasetPage` (`ResearcherCurationPanel`). Correct constituent percentages to decimal fractions ($0.0 - 1.0$) and transition `review_status` to `"accepted"` via `PATCH /api/records/{id}/review`. Ensure:
- $\ge 15$ accepted empirical samples for preliminary training ($\ge 30$ for full evaluation).
- Samples originate from $\ge 3$ distinct publications (`paper_id`) to enable paper-grouped cross-validation without laboratory leakage.

### Step 4.4: Freeze Dataset Snapshot & Check Readiness Gate
Freeze accepted records into an immutable snapshot via `POST /api/datasets/versions` (`lifecycle_state="model_ready"`). Execute exploratory profiling via `POST /api/datasets/eda` and confirm readiness status via `GET /api/datasets/readiness`.

### Step 4.5: Train XGBoost Models
Trigger paper-grouped training via:
```http
POST /api/models/train
Content-Type: application/json

{"target_property": "compressive_strength_mpa"}
```
Repeat for `"water_absorption_pct"`. Once models are registered, surrogate inference (`POST /api/models/predict`) and constrained optimization (`POST /api/optimization/run`) automatically unlock.

---

## 5. Summary of Architecture & Documentation Map

| Area | Primary Reference | Purpose |
|---|---|---|
| **System Architecture** | [docs/architecture.md](architecture.md) | Subsystems, topology, dataflow, and fail-closed gates |
| **Data Dictionary** | [docs/data_dictionary.md](data_dictionary.md) | Schema `v1.0.0-canonical`, fields, units, and review states |
| **API Contract** | [docs/api_contract.md](api_contract.md) | Complete REST route specifications, payloads, and status codes |
| **Model Card** | [docs/model_card.md](model_card.md) | XGBoost regressor specs, predictor manifest, and SHAP limits |
| **Optimization Guide** | [docs/optimization_methodology.md](optimization_methodology.md) | Bounded candidate search, constraints, and Pareto ranking |
| **Deployment Runbook** | [docs/deployment.md](deployment.md) | Deployment targets, secrets hardening, persistence, and backups |
| **Researcher Ingestion Guide** | [docs/researcher_data_ingestion_guide.md](researcher_data_ingestion_guide.md) | Curation protocols, units, and dry mass balance tolerance |
