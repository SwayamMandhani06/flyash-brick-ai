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

---

## 7. Literature PDF Ingestion & Extraction Engine (Phase 3 Scope)

Phase 3 introduces a secure, provenance-preserving pipeline for literature PDF ingestion, text/table parsing, and candidate experimental record generation.

### Architecture & Grounding Principles
- **Separation of Evidence and Decision:** PDF extraction produces *candidate* records (`review_status == "candidate"`). A parser output is never automatically promoted to `accepted` or `model_ready`.
- **Traceable Provenance:** Every candidate record links to `document_id`, `paper_id`, `source_page` (1-indexed), and explicit table/text snippet references.
- **No Value Fabrication:** Missing parameters or unmeasured constituents remain `null`. The system never fills unknown fractions with `0.0`. Ambiguous columns or unmapped materials are flagged for human review.

### Document Upload & Validation
- **Endpoint:** `POST /api/documents/upload` (multipart/form-data)
- **File Validation:**
  - Enforces `MAX_UPLOAD_SIZE_BYTES` (default: 15 MB / 15,728,640 bytes). Oversized files return `413 Payload Too Large`.
  - Validates `%PDF-` binary magic header. Empty or invalid files return `422 Unprocessable Entity`.
  - Sanitizes filenames against path traversal attacks. Files are stored using unique UUID identifiers in `DOCUMENTS_STORAGE_DIR`.
  - Deduplication: Computes cryptographic `SHA-256` hash. Duplicate uploads safely return the existing document metadata (`200 OK`) without re-writing files or creating duplicate database entities.

### Extraction Pipeline (`pdfplumber`)
- **Endpoint:** `POST /api/documents/{id}/extract`
- **Capabilities:**
  - Page-by-page text extraction preserving page numbering.
  - Table parsing with positional column alignment to accurately capture tabular mix proportions (`fly_ash_fraction`, `cement_fraction`, `lime_fraction`, `sand_fraction`, `gypsum_fraction`, `compressive_strength_mpa`, `water_absorption_pct`, etc.).
  - Preserves source terminology and units.
- **Honest Limitations & Scanned PDF Handling:**
  - Scanned/image-only PDFs (pages with 0 extracted characters) are detected and flagged with warning code `SCANNED_PDF_DETECTED`.
  - Heavyweight OCR (e.g. Tesseract) is deliberately omitted in this phase to maintain a lightweight, deterministic runtime. Scanned documents are surfaced for manual entry.
  - Encrypted, corrupted, or password-protected PDFs fail gracefully with structured error messages (`EXTRACTION_FAILED`).
- **Idempotent Retry Behavior:**
  - Retrying extraction on an already extracted document replaces only unreviewed `candidate` records.
  - Records already reviewed, `accepted`, or `rejected` by human curators are strictly preserved.

### Human Review Integration
Candidate records extracted from documents are accessible via `GET /api/documents/{id}/candidates` and integrated directly into the Phase 2 review workflow (`PATCH /api/records/{id}/review`). Curators can accept, reject, or adjust values with full audit logging in `review_history`.

---

---

## 8. Scientific Data Validation & Normalization Engine (Phase 4 Scope)

Phase 4 introduces a deterministic, provenance-preserving validation and normalization service for reviewed fly ash brick data.

### Validation Architecture & Principles
- **Layered Traceability:** Raw evidence, candidate extractions, reviewed canonical records, validation findings, and derived normalized values are strictly separated.
- **No In-Place Overwrite:** The canonical experimental record is never mutated in-place by validation or normalization. Original units, reported basis, and null values are preserved.
- **Evidence-Based Rules:** Rules are grounded in civil engineering standards (IS 12894:2002 for fly ash lime bricks, IS 3812 Part 1 for pozzolana) and materials science principles.

### Validation Categories
1. **Structural & Provenance (`STRUCT_*`):**
   - Foreign key verification against paper registry.
   - Specific source location verification (page, table/figure, or excerpt).
   - Non-negativity constraints on physical parameters.
   - Potential duplicate detection within the same publication (without silent deletion).
2. **Unit Validation & Conversion Registry (`UNIT_*`):**
   - Controlled unit conversions for compressive strength (e.g. `psi`, `kgf/cm²`, `N/mm²`, `bar` $\rightarrow$ `MPa`).
   - Density conversions (`g/cm³` $\rightarrow$ `kg/m³`).
   - Rejects or flags ambiguous/unsupported unit strings without guessing.
3. **Composition & Mass Balance (`COMP_*`):**
   - Normalizes percentages to decimal fractions (0.0 - 1.0) for derived calculations.
   - Detects incomplete formulations (marked `dry_mass_balance_status: "indeterminate"`).
   - Validates dry mass totals against nominal $\pm 5\%$ tolerance ($0.95 \le \sum \le 1.05$). Under-sum and over-sum flagged explicitly.
   - Never automatically rescales reported proportions to 100%.
4. **Water & Binder Information (`WATER_*`):**
   - Derives $w/b$ only when water amount, basis, and binder constituents are documented.
   - Preserves `null` when water content is unreported (no zero-fabrication).
5. **Performance Standards Alignment (`PERF_*`):**
   - Compressive strength evaluated against IS 12894:2002 Class 3.5 structural minimum threshold (3.5 MPa).
   - Water absorption evaluated against IS 12894:2002 20.0% maximum threshold.
6. **Model-Readiness Gate:**
   - A record is marked `is_eligible_for_model_ready = True` if and only if it is human-curator `accepted`, has `value_origin != "synthetic"`, contains zero error-level findings, and has verified primary performance targets and fly ash content.

---

## 9. Implemented Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Process liveness check |
| `GET` | `/api/ready` | Subsystem readiness (`database: operational`, `extraction_engine: operational`, `validation_service: operational`) |
| `GET` | `/api/schema` | Canonical schema version and full data dictionary |
| `POST` | `/api/documents/upload` | Upload and register a research PDF with cryptographic SHA-256 hash |
| `POST` | `/api/documents/{id}/extract` | Parse text and tables, and extract candidate experimental formulation records |
| `GET` | `/api/documents` | List ingested literature documents |
| `GET` | `/api/documents/{id}` | Get document ingestion metadata and extraction status |
| `GET` | `/api/documents/{id}/candidates` | List candidate experimental records extracted from document |
| `POST` | `/api/papers` | Register literature paper metadata |
| `GET` | `/api/papers` | List registered papers |
| `GET` | `/api/papers/{id}` | Get paper by identifier |
| `POST` | `/api/records` | Create experimental formulation record |
| `GET` | `/api/records` | Filter experimental records by system, origin, or review status |
| `GET` | `/api/records/{id}` | Get experimental record |
| `PATCH` | `/api/records/{id}/review` | Apply review action or audited field correction |
| `GET` | `/api/records/{id}/history`| Retrieve audit history log for a record |
| `POST` | `/api/records/{id}/validate` | Execute scientific validation and persist versioned run with findings |
| `GET` | `/api/records/{id}/validation` | Retrieve latest scientific validation run and findings for a record |
| `GET` | `/api/validation/runs/{run_id}` | Retrieve specific validation run by run_id |
| `GET` | `/api/records/{id}/validation/findings` | List all historical validation findings for a record |
| `GET` | `/api/records/{id}/validation/runs` | List all historical validation runs for a record |
| `POST` | `/api/records/{id}/normalize` | Execute normalization and return paired original vs normalized view |
| `GET` | `/api/records/{id}/normalized` | Retrieve paired original vs normalized values comparison |
| `POST` | `/api/datasets/versions` | Create immutable dataset snapshot |
| `GET` | `/api/datasets/versions` | List dataset version snapshots |
| `GET` | `/api/datasets/versions/{id}` | Get dataset version snapshot and included record IDs |
| `POST` | `/api/models` | Register model metadata |
| `GET` | `/api/models` | List model registry metadata |
| `GET` | `/api/models/{id}` | Get model metadata by ID |

---

## 10. Running Automated Tests

Run the complete backend test suite:

```powershell
.\backend\.venv\Scripts\pytest.exe backend\tests -v
```

All 64 unit, integration, persistence, schema, extraction, and validation tests run deterministically using isolated temporary SQLite databases and synthetic in-memory PDFs. Real research data and external networks are never required or modified by test runs.

---

## 11. Phase Roadmap Alignment

- **Phase 1 (Completed):** FastAPI foundation, configuration, structured errors, liveness/readiness contracts.
- **Phase 2 (Completed):** Canonical schema `v1.0.0-canonical`, SQLite persistence, paper registry, review history, dataset snapshots, model registry metadata, synthetic data isolation.
- **Phase 3 (Completed):** Literature PDF ingestion, SHA-256 deduplication, `pdfplumber` text/table extraction, candidate record generation with provenance, idempotent retries, honest scanned PDF detection.
- **Phase 4 (Completed):** Scientific data validation, unit conversion registry, dry mass balance, water/binder verification, validation run persistence, model-readiness eligibility gate.
- **Phase 5 (Deferred):** Dataset readiness profiling snapshot & EDA.
- **Phase 6 (Deferred):** XGBoost dual-target training & evaluation.
- **Phase 7 (Deferred):** TreeSHAP explainability engine.
- **Phase 8 (Deferred):** Feasible mix design optimizer.
- **Phase 9 (Deferred):** Full frontend workstation integration.

