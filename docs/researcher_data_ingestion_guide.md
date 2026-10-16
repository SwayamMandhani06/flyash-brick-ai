# Researcher Data Ingestion & Curation Protocol

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing  
**Authoritative Specification:** Repository-root `PLAN.md` (Sections 5, 6, 11, and 12)  
**Applicability:** Ingestion, provenance tracking, human review, scientific validation, snapshot freezing, and readiness gating for empirical literature data.

---

## 1. Core Principles of Research Data Integrity

1. **Authentic Evidence Only:** The predictive and optimization models must be trained exclusively on verified, peer-reviewed empirical literature. Artificial or synthetic mix recipes must never be introduced into empirical datasets or presented as scientific evidence.
2. **Traceable Provenance:** Every experimental record must link to an authenticated academic publication (`paper_id`), an ingested document (`document_id`), and an exact location reference (page number, table number, or excerpt).
3. **No Silent Rescaling or Zero-Fabrication:** Missing constituents, unreported water contents, or unmeasured test ages must remain `null`. Never impute `0.0` or silently rescale mix proportions to 100%.
4. **Extraction Candidates Are Unverified Drafts:** Machine-extracted candidate records (`review_status == "candidate"`) are raw parser drafts. They are **never** treated as accepted empirical evidence until a human curator independently verifies every value against the source publication.
5. **Decoupled Target Eligibility:** Eligibility to train a compressive strength model does not imply eligibility to train a water absorption model. Targets are validated and gated independently.
6. **Paper-Grouped Cross-Validation:** Train and test splits must be partitioned by independent literature publications (`paper_id`) to prevent intra-paper laboratory leakage and overoptimistic performance estimates.
7. **Nominal Consistency Only:** The dry mass balance check ($0.95 \le \sum \le 1.05$) is a nominal mathematical consistency check on reported batched proportions. It does **not** constitute proof of complete chemical hydration, pozzolanic reaction, or formal regulatory compliance.
8. **Authentication Context:** In the current workstation development environment (`APP_ENV=development`), API endpoints do not require HTTP Bearer authentication or API keys. All curation requests are submitted directly over local HTTP (`http://127.0.0.1:8000`).

---

## 2. Target-Specific Data Requirements

### Target 1: Compressive Strength (`compressive_strength_mpa`)
To qualify an experimental record for compressive strength modeling (`is_eligible_for_compressive_strength == True`), the following fields must be documented:

| Field Name | Type | Canonical Unit / Basis | Requirement Level | Description / Validation Criteria |
|---|---|---|---|---|
| `paper_id` | String | Foreign Key | **Mandatory** | Links to verified publication in paper registry |
| `experiment_group_id` | String | Identifier | **Recommended** | Groups shared physical batches / mix series within the same paper |
| `source_page` / `source_table_or_figure` | String | Text | **Mandatory** | Exact page or table citation within the publication |
| `material_system` | String | Enumerated | **Mandatory** | e.g. `fly_ash_lime_gypsum_brick`, `fly_ash_cement_brick` |
| `mix_basis` | String | Enumerated | **Mandatory** | Explicit basis: `dry_mass_fraction`, `percentage`, or `mass_ratio` |
| `fly_ash_fraction` | Float | Decimal ($0.0 - 1.0$) | **Mandatory** | Must be $> 0.0$ |
| `lime_fraction` / `cement_fraction` | Float | Decimal ($0.0 - 1.0$) | **Mandatory** | At least one binder activator required |
| `sand_fraction` / `quarry_dust_fraction` | Float | Decimal ($0.0 - 1.0$) | **Mandatory** | Aggregate/filler fraction |
| `water_content_or_ratio` | Float | Ratio or % | **Recommended** | Required for $w/b$ derivation (preserves `null` if omitted) |
| `water_basis` | String | Enumerated | **Recommended** | `water_binder_ratio` or `percentage_of_dry_mix` |
| `curing_duration_days` | Integer | Days | **Mandatory** | Duration of moist/water/ambient curing (e.g. 7, 14, 28) |
| `test_age_days` | Integer | Days | **Recommended** | Age at physical compression test |
| `compressive_strength_mpa` | Float | MPa | **Mandatory** | Destructive compressive test result (must be $> 0.0$) |
| `reported_value_type` | String | Enumerated | **Mandatory** | `mean`, `individual`, `median`, or `range` |
| `value_origin` | String | Enumerated | **Mandatory** | Must be `literature_extracted` or `manual_entry` (NOT `synthetic`) |
| `review_status` | String | Enumerated | **Mandatory** | Must be `accepted` by human curator |

### Target 2: Water Absorption (`water_absorption_pct`)
To qualify an experimental record for water absorption modeling (`is_eligible_for_water_absorption == True`), the following fields must be documented:

| Field Name | Type | Canonical Unit / Basis | Requirement Level | Description / Validation Criteria |
|---|---|---|---|---|
| Formulation Constituents | Float | Decimals ($0.0 - 1.0$) | **Mandatory** | Proportions of fly ash, binder, and aggregates |
| `water_absorption_pct` | Float | % by dry mass | **Mandatory** | 24-hour cold or boiling immersion absorption |
| `curing_duration_days` | Integer | Days | **Mandatory** | Curing period before immersion |
| `review_status` | String | Enumerated | **Mandatory** | Must be `accepted` by human curator |
| `value_origin` | String | Enumerated | **Mandatory** | Must be `literature_extracted` or `manual_entry` |

---

## 3. Step-by-Step Data Ingestion Workflow

```text
[1. Register Paper] ──> [2. Upload PDF] ──> [3. Extract Tables]
                                                   │
[6. Freeze Snapshot] <── [5. Scientific Val] <── [4. Review & Correct]
        │
        ▼
[7. Run EDA & Check Gate] ──> [Phase 6 XGBoost Modeling (when gate opens)]
```

### Step 1: Register Literature Paper Metadata
Register the bibliographic details in the paper registry:
```http
POST /api/papers
Content-Type: application/json

{
  "title": "Properties of Fly Ash-Lime-Gypsum Bricks with Quarry Dust",
  "authors": "Turgut, P., and Algin, H. M.",
  "journal": "Construction and Building Materials",
  "publication_year": 2021,
  "doi_or_url": "10.1016/j.conbuildmat.2021.123456",
  "material_system": "fly_ash_lime_gypsum_brick",
  "notes": "Specimens tested after 28 days ambient curing under IS 3495"
}
```
*Response returns generated `paper_id` (e.g. `paper_a1b2c3d4e5f6`).*

### Step 2: Upload Literature PDF Artifact
Upload the authentic PDF for cryptographic registration and text extraction:
```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <turgut2021.pdf>
paper_id: paper_a1b2c3d4e5f6
```
Or via cURL from the terminal:
```bash
curl -X POST http://127.0.0.1:8000/api/documents/upload \
  -F "file=@turgut2021.pdf" \
  -F "paper_id=paper_a1b2c3d4e5f6"
```
*System validates the `%PDF-` header signature, computes cryptographic SHA-256 hash, stores the file safely, and returns `document_id`.*

### Step 3: Trigger Extraction & Generate Candidate Records
Trigger `pdfplumber` parsing across the document:
```http
POST /api/documents/{document_id}/extract
```
Retrieve extracted candidate formulations:
```http
GET /api/documents/{document_id}/candidates
```
*Note: Candidates are unverified parser outputs (`review_status == "candidate"`). They are never automatically promoted to accepted data.*

### Step 4: Human Review & Audited Correction
Review each candidate record against the source publication. If proportions were reported in percentage or batch weights, apply audited corrections:
```http
PATCH /api/records/{record_id}/review
Content-Type: application/json

{
  "reviewer": "dr_researcher",
  "reason": "Standardized mix proportions from Table 2 to decimal fractions",
  "field_corrections": {
    "experiment_group_id": "series_a",
    "fly_ash_fraction": 0.55,
    "lime_fraction": 0.15,
    "gypsum_fraction": 0.05,
    "sand_fraction": 0.25,
    "mix_basis": "dry_mass_fraction",
    "water_content_or_ratio": 0.24,
    "water_basis": "water_binder_ratio",
    "compressive_strength_mpa": 12.4,
    "water_absorption_pct": 13.8,
    "curing_duration_days": 28
  }
}
```
*Every change is permanently logged in `review_history` with reviewer identity, previous value, new value, and timestamp.*

### Step 5: Execute Scientific Validation & Normalization
Verify mass balance, physical non-negativity, and standards alignment:
```http
POST /api/records/{record_id}/validate
```
Inspect findings and normalized view:
```http
GET /api/records/{record_id}/normalized
```
Confirm:
- `dry_mass_balance_status`: `"nominal"` (dry constituents sum within $0.95 - 1.05$ as a formulation consistency check).
- Zero `severity: "error"` findings.

### Step 6: Accept Verified Record
Once verified against the source paper, transition review status to `accepted`:
```http
PATCH /api/records/{record_id}/review
Content-Type: application/json

{
  "reviewer": "dr_researcher",
  "reason": "Verified against Table 2 and Clause 4 of IS 12894",
  "new_status": "accepted"
}
```

### Step 7: Freeze Immutable Dataset Snapshot
Freeze accepted records into a versioned dataset snapshot:
```http
POST /api/datasets/versions
Content-Type: application/json

{
  "version_id": "v1.0.0-fal-g-cohort",
  "schema_version": "v1.0.0-canonical",
  "lifecycle_state": "model_ready",
  "description": "Initial verified FaL-G multi-study research cohort",
  "record_ids": ["rec_1", "rec_2", "rec_3", "..."]
}
```
*Safety Guard: Any synthetic record or unaccepted record in a `model_ready` request triggers an immediate rejection.*

### Step 8: Run Exploratory Data Analysis & Verify Readiness Gate
Execute the Phase 5 analysis pipeline over the frozen snapshot:
```http
POST /api/datasets/eda
Content-Type: application/json

{
  "dataset_version_id": "v1.0.0-fal-g-cohort",
  "exclude_synthetic": true,
  "require_accepted_review": true
}
```
Check readiness overview:
```http
GET /api/datasets/readiness?dataset_version_id=v1.0.0-fal-g-cohort
```

---

## 4. Phase 6 Readiness Gate Criteria

Before XGBoost modeling is permitted for any target, the frozen snapshot must satisfy the project-defined operational gates (`PLAN.md` Section 12):

| Criterion | Provisional Evaluation Gate | Full Readiness Gate | Rationale |
|---|---|---|---|
| **Independent Papers** | $\ge 3$ distinct publications | $\ge 5$ distinct publications | Enables `GroupKFold` cross-validation by `paper_id` without intra-paper leakage |
| **Accepted Records** | $\ge 15$ records | $\ge 30$ records | Protects gradient boosted decision trees from extreme variance & small-sample memorization |
| **Feature Missingness** | $< 60\%$ on core binders | $< 20\%$ on core binders | Prevents models from depending heavily on arbitrary imputation |
| **Readiness Status** | `preliminary_limited_evidence` | `ready_for_evaluation` | Explicit status required before Phase 6 script execution |

> [!CAUTION]
> **Current Status Notice:**  
> When the active research database contains 0 accepted literature papers, target readiness status is reported as `unsupported_insufficient_data`. Model training in Phase 6 is blocked until peer-reviewed papers are ingested and accepted following this protocol.
