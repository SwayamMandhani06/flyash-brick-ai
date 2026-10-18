# API Contract Specifications & Route Reference

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 7 — API Contract Conventions)
**Applicability:** Backend route implementations, client-service contracts, and integration testing.

---

## 1. General Conventions & Protocol Rules

1. **Route Prefix:** All application endpoints are namespaced under the `/api` prefix.
2. **Payload Serialization:** Request and response bodies are formatted as UTF-8 encoded JSON (`application/json`), except file upload endpoints which use `multipart/form-data`.
3. **Temporal Serialization:** All timestamps use ISO-8601 UTC format (e.g., `2026-10-17T09:00:00Z`).
4. **Standardized Error Envelope:** Errors consistently adhere to the following schema:
   ```json
   {
     "error": {
       "code": "STRING_ERROR_CODE",
       "message": "Human-readable explanation of error.",
       "details": null
     }
   }
   ```
5. **Fail-Closed Safety:** Subsystems requiring empirical data or trained models return explicit structured error codes (`422 DATA_READINESS_BLOCKED`, `503 MODEL_UNAVAILABLE`, `503 OPTIMIZATION_UNAVAILABLE`) rather than falling back to ungrounded defaults or simulated placeholders.

---

## 2. Complete Endpoint Inventory

### 2.1 Health & Process Readiness
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Process liveness heartbeat confirming HTTP server is responsive. | `200 OK` |
| `GET` | `/api/ready` | Platform subsystem readiness check (database, extraction engine, validation). | `200 OK` |

### 2.2 Schema & Data Dictionary
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `GET` | `/api/schema` | Canonical schema version (`v1.0.0-canonical`), supported units, and field rules. | `200 OK` |

### 2.3 Paper Registry
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/papers` | Register verified academic publication metadata. | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `GET` | `/api/papers` | List all registered literature publications. | `200 OK` |
| `GET` | `/api/papers/{paper_id}` | Retrieve specific publication metadata by paper ID. | `200 OK`, `404 Not Found` |

### 2.4 Document Ingestion & Extraction Engine
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/documents/upload` | Upload research PDF (`multipart/form-data`) with SHA-256 deduplication. | `201 Created`, `200 OK` (deduplicated), `413 Payload Too Large`, `422 Unprocessable` |
| `POST` | `/api/documents/{document_id}/extract` | Trigger `pdfplumber` text/table extraction to generate candidate records. | `200 OK`, `404 Not Found`, `422 Unprocessable` |
| `GET` | `/api/documents` | List ingested literature document artifacts. | `200 OK` |
| `GET` | `/api/documents/{document_id}` | Retrieve document metadata and extraction status. | `200 OK`, `404 Not Found` |
| `GET` | `/api/documents/{document_id}/candidates` | List candidate experimental records extracted from document. | `200 OK`, `404 Not Found` |

### 2.5 Experimental Records & Researcher Curation
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/records` | Create manual experimental formulation record. | `201 Created`, `400 Bad Request`, `422 Unprocessable` |
| `GET` | `/api/records` | Filter experimental records by system, origin, or review status. | `200 OK` |
| `GET` | `/api/records/{record_id}` | Retrieve detailed record by record ID. | `200 OK`, `404 Not Found` |
| `PATCH` | `/api/records/{record_id}/review` | Apply audited field corrections or transition review status. | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `GET` | `/api/records/{record_id}/history` | Retrieve immutable audit history log for a record. | `200 OK`, `404 Not Found` |
| `GET` | `/api/records/csv-template` | Download documented CSV curation template (`flyash_curation_template.csv`). | `200 OK` (`text/csv`) |
| `POST` | `/api/records/import-csv` | Batch import curated CSV rows with mandatory researcher attribution. | `200 OK`, `400 Bad Request`, `422 Unprocessable` |

### 2.6 Scientific Validation & Normalization
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/records/{record_id}/validate` | Run scientific validation rules and persist versioned validation run. | `200 OK`, `404 Not Found` |
| `GET` | `/api/records/{record_id}/validation` | Retrieve latest scientific validation run and findings for a record. | `200 OK`, `404 Not Found` |
| `GET` | `/api/validation/runs/{run_id}` | Retrieve specific validation run by run ID. | `200 OK`, `404 Not Found` |
| `GET` | `/api/records/{record_id}/validation/findings` | List all historical validation findings for a record. | `200 OK`, `404 Not Found` |
| `GET` | `/api/records/{record_id}/validation/runs` | List all historical validation runs for a record. | `200 OK`, `404 Not Found` |
| `POST` | `/api/records/{record_id}/normalize` | Execute canonical normalization and return paired original vs normalized view. | `200 OK`, `404 Not Found` |
| `GET` | `/api/records/{record_id}/normalized` | Retrieve paired original vs normalized comparison. | `200 OK`, `404 Not Found` |

### 2.7 Dataset Snapshots & Versions
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/datasets/versions` | Freeze immutable dataset snapshot (enforces synthetic isolation gate). | `201 Created`, `400 Bad Request`, `409 Conflict`, `422 Leak Prevented` |
| `GET` | `/api/datasets/versions` | List dataset version snapshots. | `200 OK` |
| `GET` | `/api/datasets/versions/{version_id}` | Retrieve specific dataset snapshot metadata and member record IDs. | `200 OK`, `404 Not Found` |

### 2.8 Exploratory Data Analysis & Target Readiness Diagnostics
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/datasets/eda` | Execute reproducible EDA, feature suitability audit, and target readiness run. | `200 OK`, `404 Not Found` |
| `GET` | `/api/datasets/eda/latest` | Retrieve latest EDA and readiness assessment run. | `200 OK`, `404 Not Found` |
| `GET` | `/api/datasets/eda/runs` | List historical EDA runs with configuration and summary metadata. | `200 OK` |
| `GET` | `/api/datasets/eda/{analysis_id}` | Retrieve specific EDA run by analysis ID. | `200 OK`, `404 Not Found` |
| `GET` | `/api/datasets/readiness` | Fast actionable diagnostic overview of target readiness and unmet criteria. | `200 OK` |

### 2.9 Model Registry & XGBoost Inference
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/models` | Register model metadata. | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `GET` | `/api/models` | List registered model metadata entries. | `200 OK` |
| `GET` | `/api/models/{model_id}` | Retrieve model metadata and evaluation summary by model ID. | `200 OK`, `404 Not Found` |
| `POST` | `/api/models/train` | Execute paper-grouped XGBoost training with baseline comparison (readiness gate enforced). | `200 OK`, `404 Not Found`, `422 DATA_READINESS_BLOCKED` |
| `POST` | `/api/models/predict` | Generate surrogate prediction with input range validation (fails closed if untrained). | `200 OK`, `422 Invalid Input`, `503 MODEL_UNAVAILABLE` |
| `POST` | `/api/models/explain` | Generate TreeSHAP additive feature attributions (fails closed if untrained). | `200 OK`, `422 Invalid Input`, `503 MODEL_UNAVAILABLE` |

### 2.10 Constrained Formulation Optimization
| Method | Route | Description | Expected Status Codes |
|---|---|---|---|
| `POST` | `/api/optimization/run` | Execute constrained formulation optimization search (readiness gate enforced). | `200 OK`, `422 Unsupported System`, `503 OPTIMIZATION_UNAVAILABLE` |
| `POST` | `/api/optimize` | Alias route for formulation optimization execution. | `200 OK`, `422 Unsupported System`, `503 OPTIMIZATION_UNAVAILABLE` |
| `GET` | `/api/optimization/runs` | List historical formulation optimization runs. | `200 OK` |
| `GET` | `/api/optimization/runs/{run_id}` | Retrieve detailed optimization run results and recommendations. | `200 OK`, `404 Not Found` |
