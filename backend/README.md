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

## 9. Exploratory Data Analysis, Feature Assessment & Dataset Readiness (Phase 5 Scope)

Phase 5 establishes a transparent, reproducible analysis pipeline for reviewed research data, preparing an evidence-based audit of dataset quality and the suitability of individual features and targets before model training.

### Key Architectural Boundaries
- **No Premature ML Model Training:** No XGBoost models are trained in Phase 5. Training, tuning, and grouped evaluation belong strictly to Phase 6.
- **Empirical Literature vs. Synthetic Isolation:** All descriptive statistics and corpus summaries evaluate reviewed empirical data only (`value_origin != "synthetic"`). Synthetic records are isolated strictly for software testing.
- **Honest Absence of Results:** When the actual research corpus contains insufficient reviewed literature records (e.g. during initial setup), the pipeline explicitly reports `total_records: 0`, assigns `readiness_status: "unsupported_insufficient_data"`, and records transparent limitations without fabricating metrics or sample sizes.
- **Read-Only Non-Destructive Profiling:** Canonical records and frozen dataset snapshots are never mutated during analysis runs.

### Feature Assessment & Leakage Prevention Pipeline
Every schema attribute is evaluated for suitability and leakage risk:
1. **Target Variables:** `compressive_strength_mpa` (Target 1) and `water_absorption_pct` (Target 2) are identified as targets and strictly prohibited as input features for their respective models.
2. **Excluded Leakage & Metadata Fields:**
   - *Identifiers:* `record_id`, `paper_id`, `document_id`, `doi_or_url`, `experiment_group_id`, `duplicate_group_id`.
   - *Provenance & Citations:* `source_title`, `source_authors`, `source_page`, `source_table_or_figure`, `source_excerpt_or_cell_reference`, `raw_reported_values`.
   - *Pipeline & Review State:* `review_status`, `reviewed_by`, `reviewed_at`, `review_notes`, `created_at`, `value_origin`.
   - *Post-Test Destructive Outcomes:* `failure_mode`, `is12894_class_nominal`, `is12894_water_absorption_compliant`, `reported_value_type`, `specimen_count_n`, `compressive_strength_sd_mpa`.
3. **Constancy & Collinearity Checks:**
   - Features with zero variance are flagged `is_constant: True` and excluded (`excluded_low_variance`).
   - Near-constant features (>95% identical observations) are flagged for sample bias.
   - Bivariate Pearson correlation matrix detects extreme collinearity ($|r| \ge 0.95$). Strongly correlated features are documented for Phase 6 review rather than silently dropped.

### Target-Specific Dataset Readiness Gates
Per `PLAN.md` Section 12, readiness is evaluated independently for each target:
- **Compressive Strength (MPa)**
- **Water Absorption (%)**

Readiness status is classified as:
- `unsupported_insufficient_data`: Fewer than 15 accepted samples, fewer than 3 independent papers, or zero valid measurements. Grouped cross-validation is blocked.
- `preliminary_limited_evidence`: 15–29 samples across $\ge 3$ papers. Grouped evaluation is structurally feasible, but high variance requires tagging models as preliminary research prototypes.
- `ready_for_evaluation`: $\ge 30$ accepted samples across $\ge 5$ independent papers with low feature missingness and full grouped evaluation feasibility.

---

## 10. Implemented Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Process liveness check |
| `GET` | `/api/ready` | Subsystem readiness (`database`, `extraction_engine`, `validation_service`) |
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
| `POST` | `/api/datasets/eda` | Execute reproducible EDA, feature suitability audit, and target readiness run |
| `GET` | `/api/datasets/eda/latest` | Retrieve latest EDA and readiness assessment run |
| `GET` | `/api/datasets/eda/runs` | List historical EDA runs with configuration and summary metadata |
| `GET` | `/api/datasets/eda/{id}` | Retrieve specific EDA run by analysis_id |
| `GET` | `/api/datasets/readiness` | Fast overview of target readiness for compressive strength and water absorption |
| `POST` | `/api/models` | Register model metadata |
| `GET` | `/api/models` | List model registry metadata |
| `GET` | `/api/models/{id}` | Get model metadata by ID |
| `POST` | `/api/models/train` | Execute paper-grouped XGBoost training with baseline comparison (readiness gate enforced) |
| `POST` | `/api/models/predict` | Generate surrogate prediction with input range validation (503 if untrained) |
| `POST` | `/api/models/explain` | Generate SHAP additive feature attributions (503 if untrained) |
| `POST` | `/api/optimization/run` | Execute constrained formulation optimization search (readiness gate enforced; 503 if unready) |
| `GET` | `/api/optimization/runs` | List historical formulation optimization runs |
| `GET` | `/api/optimization/runs/{id}` | Retrieve detailed optimization run results and recommendations |

---

## 11. XGBoost Modeling & Evaluation Pipeline (Phase 7 Scope)

Phase 7 establishes the predictive modeling engine with strict empirical-data readiness gating, paper-grouped cross-validation, baseline comparison, and leakage safeguards.

### Key Architectural Boundaries
- **Strict Empirical Readiness Gate:** Model training is blocked if the target dataset contains $< 15$ accepted empirical records or $< 3$ independent literature papers (`DataReadinessGateError`).
- **Paper-Grouped Cross-Validation:** Folds are partitioned by `paper_id` using `GroupKFold`. Held-out validation papers are strictly absent from the corresponding training fold to prevent intra-publication laboratory leakage.
- **Reference Mean Baseline:** Evaluates a `MeanBaselineRegressor` fit strictly on the training fold, computing MAE and RMSE on the held-out fold to establish an honest reference floor.
- **Training-Fold Preprocessing:** Imputation medians and scaling parameters are fit strictly inside training folds.
- **Predictor Leakage Exclusions:** Identifiers (`record_id`, `paper_id`, `doi_or_url`), citation text, review lifecycle states, and post-test destructive outcomes (`failure_mode`, `is12894_class_nominal`) are quarantined from feature manifests.
- **Honest Model Inference:** Requesting prediction or SHAP explanation for an untrained target returns a structured HTTP 503 (`MODEL_UNAVAILABLE`). The system never falls back to dummy, synthetic, or fabricated models.

---

## 12. Constrained Formulation Optimization (Phase 8 Scope)

Phase 8 implements a reproducible, bounded candidate-search framework that explores feasible manufacturing formulations under explicit material, chemical, and physical performance constraints.

### Core Optimization Architecture
- **Optimization Readiness Gate:** Search execution is strictly gated by `check_optimization_readiness`. Optimization is blocked (HTTP 503 `OPTIMIZATION_UNAVAILABLE`) unless:
  1. Empirical database has $\ge 15$ accepted records across $\ge 3$ independent literature papers for **both** compressive strength and water absorption.
  2. Verified, trained XGBoost models are registered and available for both targets.
- **Material-System Separation:** FaL-G (`fly_ash_lime_gypsum_brick`) and Cement–Fly Ash (`cement_fly_ash_brick`) are maintained as separate formulation domains with distinct binder and aggregate constraints:
  - *FaL-G System:* Enforces minimum fly ash ($f_{\text{FA}} \ge 0.40$), lime ($0.08 \le f_{\text{lime}} \le 0.25$), gypsum ($0.02 \le f_{\text{gyp}} \le 0.08$), and active binder sum ($\sum \ge 0.10$).
  - *Cement–Fly Ash System:* Enforces cement binder ($f_{\text{cement}} \ge 0.08$) and zero lime/gypsum ($0.0$).
- **Physics & Mass-Balance Constraints:** Dry constituent fractions must sum to $1.0 \pm 0.005$ with aggregate (sand/stone dust) acting as the slack balance. Water dosage must be physically viable ($0.10 \le w \le 0.45$).
- **Multi-Objective Pareto Ranking:** Feasible candidates are evaluated for non-dominated Pareto optimality across compressive strength (maximize), water absorption (minimize), and fly ash utilization (maximize). Candidates are ranked via deterministic scalarization (`maximize_fly_ash`, `maximize_strength`, `minimize_water_absorption`, or `balanced_pareto`).
- **No-Feasible-Solution Honesty:** If user performance constraints (e.g. impossible strength targets) cannot be satisfied, the optimizer returns `status="no_feasible_solution"` with an itemized `rejection_summary` without silently relaxing constraints.
- **Extrapolation Safeguards:** Candidates are checked against training-data hyper-rectangle bounds. Full multidimensional convex-hull enforcement is not implemented; domain support is labeled as `supported`, `extrapolated`, or `unverified_no_empirical_baseline`.
- **Reproducibility & Auditability:** Optimization runs are deterministic for a given `random_seed` and algorithm version (`v1.0.0-bounded-search`). Runs are persisted in the `optimization_runs` table with complete input configuration, model references, search budget, and results.

### Enabling Empirical Optimization
Once civil engineering researchers curate at least 15 accepted empirical records across 3 distinct papers and train XGBoost models via `POST /api/models/train`, the readiness gate automatically unlocks `POST /api/optimization/run`.

---

## 13. Running Automated Tests

Run the complete backend test suite:

```powershell
.\backend\.venv\Scripts\pytest.exe backend\tests -v
```

All **114 automated tests** execute deterministically using isolated temporary SQLite databases, synthetic in-memory PDFs, and mock fixtures. Tests cover configuration, CORS, errors, persistence, paper registry, review history, dataset snapshots, PDF extraction, scientific validation, EDA readiness gates, research workflows, XGBoost pipeline mechanics, and constrained formulation optimization. Real research data and external networks are never required or modified by test runs.

---

## 14. Researcher Data Ingestion Guide

For human curators and civil engineering researchers curating empirical data from published literature, see the step-by-step operational guide:
- **[Researcher Data Ingestion Guide](../docs/researcher_data_ingestion_guide.md)**: Full API procedures, required/optional fields for each prediction target, dry mass balance tolerances, curation checklist, and Phase 6 operational readiness criteria.

---

## 15. Phase Roadmap Alignment

- **Phase 1 (Completed):** FastAPI foundation, configuration, structured errors, liveness/readiness contracts.
- **Phase 2 (Completed):** Canonical schema `v1.0.0-canonical`, SQLite persistence, paper registry, review history, dataset snapshots, model registry metadata, synthetic data isolation.
- **Phase 3 (Completed):** Literature PDF ingestion, SHA-256 deduplication, `pdfplumber` text/table extraction, candidate record generation with provenance, idempotent retries, honest scanned PDF detection.
- **Phase 4 (Completed):** Scientific data validation, unit conversion registry, dry mass balance, water/binder verification, validation run persistence, target-specific model-readiness eligibility gate.
- **Phase 5 (Completed):** Exploratory data analysis, feature assessment, constancy/collinearity checks, leakage prevention, and target-specific dataset readiness gates.
- **Phase 6 (Completed):** Data readiness gate verification, end-to-end research ingestion workflow (Commit `07026ad`), and researcher ingestion guide.
- **Phase 7 (Completed):** XGBoost dual-target regression pipeline with paper-grouped split integrity, mean baseline comparator, leakage safeguards, SHAP explainability contracts, and inference validation (Commit `c1c9ae5`).
- **Phase 8 (Gate Enforced / Optimization Blocked):** Constrained formulation optimization, multi-objective Pareto ranking, dry mass balance enforcement, and recommendation contracts. Empirical optimization blocked on empty local database (`OPTIMIZATION_UNAVAILABLE`).
- **Phase 9 (Deferred):** Full frontend workstation integration with live analytical endpoints.

