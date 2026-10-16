# FlyAsh Intel — Backend Application Foundation & Persistence (Phase 2)

This directory contains the Python + FastAPI backend and persistence layer for **FlyAsh Intel** (*XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing*).

---

## 1. Prerequisites

- **Python Runtime:** Python 3.12 (verified: 3.12.10)
- **Virtual Environment:** Recommended at `backend/.venv` (ignored by `.gitignore`)

---

## 2. Local Environment Setup

From the repository root (`d:\Projects\FlyAsh`), run in PowerShell:

```powershell
# 1. Create Python virtual environment
python -m venv backend\.venv

# 2. Activate the virtual environment
.\backend\.venv\Scripts\Activate.ps1

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install backend dependencies (including SQLAlchemy 2.1)
pip install -r backend\requirements.txt

# Or for exact-pinned reproducible dependencies:
# pip install -r backend\requirements-lock.txt
```

---

## 3. Configuration & Database Setup

Copy the example environment configuration template:

```powershell
cp backend\.env.example backend\.env
```

Key configuration parameters (`backend/app/core/config.py`):
- `APP_NAME`: Name of the service (default: `"FlyAsh Intel API"`)
- `APP_ENV`: `"development"`, `"test"`, or `"production"`
- `API_V1_STR`: API route prefix (default: `"/api"`)
- `HOST`: Development bind address (default: `"127.0.0.1"`)
- `PORT`: Development HTTP port (default: `8000`)
- `CORS_ORIGINS`: Comma-separated list of approved frontend origins (default: `"http://localhost:5173,http://127.0.0.1:5173"`)
- `DATABASE_URL`: SQLAlchemy connection URI (default: `"sqlite:///./backend/data/flyash.db"`)
- `CANONICAL_SCHEMA_VERSION`: Canonical data schema version (default: `"v1.0.0-canonical"`)

### Database Initialization & SQLite Pragma
Database tables are initialized non-destructively on application startup (via the FastAPI lifespan handler calling `init_db()`). Existing records are never dropped or erased during routine startups.
SQLite foreign key enforcement is explicitly activated on every connection via the SQLAlchemy listener:
```python
PRAGMA foreign_keys=ON;
```

---

## 4. Canonical Research Data Schema & Integrity

### Record Grain
One record in `records` represents **one distinct experimental formulation and its resulting performance** under defined raw materials, manufacturing conditions, curing regimen, and mechanical test standard. Specimen replicates within the same batch test are aggregated as reported in the source literature rather than artificially split.

### Field Dictionary & Nullable Semantics
- **Identity & Provenance:** `record_id`, `paper_id` (FK to `papers`), `experiment_group_id`, `source_title`, `source_authors`, `publication_year`, `doi_or_url`, `source_page`, `source_table_or_figure`, `extraction_method`, `value_origin` (`literature_extracted` | `manual_entry` | `derived` | `synthetic`), `schema_version`.
- **Material Composition:** `material_system` (must remain distinct; e.g. `fly_ash_lime_gypsum_brick`), `brick_state`, `fly_ash_fraction`, `cement_fraction`, `lime_fraction`, `gypsum_fraction`, `sand_fraction`, `stone_dust_fraction`, `quarry_dust_fraction`, `other_materials`, `mix_basis`.
  - *No Zero-Fabrication:* Unknown or unmeasured constituents remain strictly `null` (None). They are never fabricated as `0.0`.
  - *Material Separation:* Stone dust and quarry dust are maintained as distinct fields to respect original source terminology. Geopolymer or soil-stabilized formulations are segregated by `material_system`.
- **Process Parameters:** `water_content_or_ratio`, `water_basis`, `curing_method`, `curing_duration_days`, `curing_temperature_c`, `compaction_pressure_mpa`, `density_kg_m3`, `specimen_dimensions`, `test_standard`.
- **Performance Targets:** `compressive_strength_mpa` (MPa), `water_absorption_pct` (%), `reported_value_type` (`mean` | `individual` | `median`), `specimen_count_n`, `compressive_strength_sd_mpa`, `water_absorption_sd_pct`.

---

## 5. Review Lifecycle & Auditing

### Record Review States
1. `candidate`: Initial ingested status.
2. `needs_review`: Flagged for human review or automatically returned to review after field corrections.
3. `accepted`: Verified by human curator against primary literature.
4. `rejected`: Rejected due to experimental defect, missing core parameters, or retraction.

### Auditable Corrections
Field updates on records are executed via `PATCH /api/records/{record_id}/review`. Silent overwrites are forbidden:
- Every field modification creates an immutable entry in `review_history` recording `field_name`, `previous_value`, `new_value`, `reviewer`, `reason`, and UTC `timestamp`.
- Correcting an `accepted` record automatically reverts its status to `needs_review` to prevent unreviewed changes from contaminating downstream models.

### Dataset Lifecycle & Synthetic Isolation
Dataset versions (`POST /api/datasets/versions`) freeze snapshots with explicit states:
`raw` | `candidate` | `reviewed` | `model_ready` | `synthetic_test_only`

**Critical Safety Gate:**
Synthetic records (`value_origin == "synthetic"`) are strictly forbidden from entering `model_ready` snapshots. Any attempt to create a `model_ready` dataset version containing synthetic records or unaccepted records immediately triggers a `SYNTHETIC_DATA_LEAK_PREVENTED` error.

---

## 6. Model Registry Metadata (Phase 2 Scope)

Phase 2 provides metadata persistence only (`POST /api/models`, `GET /api/models`).
- Supports storing algorithm (`XGBoost`), model version, feature manifest, target variable, and dataset version foreign keys.
- **Strict Untrained Policy:** No models are trained in Phase 2. Registering `is_trained=True` without a valid `artifact_path` is rejected. No metrics or model weights are fabricated.

---

## 7. Implemented Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Process liveness check |
| `GET` | `/api/ready` | Subsystem readiness (`database: operational`, future ML deferred) |
| `GET` | `/api/schema` | Canonical schema version and full data dictionary |
| `POST` | `/api/papers` | Register literature paper metadata |
| `GET` | `/api/papers` | List registered papers |
| `GET` | `/api/papers/{id}` | Get paper by identifier |
| `POST` | `/api/records` | Create experimental formulation record |
| `GET` | `/api/records` | Filter experimental records by system, origin, or review status |
| `GET` | `/api/records/{id}` | Get experimental record |
| `PATCH` | `/api/records/{id}/review` | Apply review action or audited field correction |
| `GET` | `/api/records/{id}/history`| Retrieve audit history log for a record |
| `POST` | `/api/datasets/versions` | Create immutable dataset snapshot |
| `GET` | `/api/datasets/versions` | List dataset version snapshots |
| `GET` | `/api/datasets/versions/{id}` | Get dataset version snapshot and included record IDs |
| `POST` | `/api/models` | Register model metadata |
| `GET` | `/api/models` | List model registry metadata |
| `GET` | `/api/models/{id}` | Get model metadata by ID |

---

## 8. Running Automated Tests

Run the complete backend test suite:

```powershell
.\backend\.venv\Scripts\pytest.exe backend\tests -v
```

All 32 unit, integration, persistence, and schema tests run using isolated temporary SQLite databases. Real research data is never modified by test runs.

---

## 9. Phase Roadmap Alignment

- **Phase 1 (Completed):** FastAPI foundation, configuration, structured errors, liveness/readiness contracts.
- **Phase 2 (Completed):** Canonical schema `v1.0.0-canonical`, SQLite persistence, paper registry, review history, dataset snapshots, model registry metadata, synthetic data isolation.
- **Phase 3 (Deferred):** Literature PDF extraction & table parsing.
- **Phase 4 (Deferred):** Scientific normalization & stoichiometric mass balance rules.
- **Phase 5 (Deferred):** Dataset readiness profiling snapshot & EDA.
- **Phase 6 (Deferred):** XGBoost dual-target training & evaluation.
- **Phase 7 (Deferred):** TreeSHAP explainability engine.
- **Phase 8 (Deferred):** Feasible mix design optimizer.
- **Phase 9 (Deferred):** Full frontend workstation integration.
