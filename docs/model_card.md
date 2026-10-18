# Model Card — Dual-Target XGBoost Quality Regressors

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 13 — Phase 6: XGBoost Training, Tuning, and Evaluation; Section 14 — Phase 7: Prediction API and SHAP Explanations)
**Model Family:** Gradient Boosted Decision Trees (XGBoost Regressor)
**Target Properties:** Compressive Strength (MPa) and Water Absorption (%)

---

## 1. Model Details & Intended Use

### Model Architecture
The platform utilizes two decoupled XGBoost regression surrogate models:
1. **Compressive Strength Regressor (`compressive_strength_mpa`):** Estimates 28-day axial crushing strength in megapascals (MPa).
2. **Water Absorption Regressor (`water_absorption_pct`):** Estimates 24-hour cold immersion water absorption as a percentage of dry masonry mass.

Models are trained independently to reflect different chemical mechanisms: compressive strength is driven primarily by tobermorite/C-S-H and ettringite matrix formation, whereas water absorption is governed by accessible capillary pore volume and compaction density.

### Primary Intended Use
- **Surrogate Quality Screening:** Provide civil engineering researchers and brick manufacturers with rapid estimation of compressive strength and water absorption for proposed mix formulations.
- **Formulation Search Guidance:** Serve as evaluation surrogate engines within the constrained formulation optimizer to identify non-dominated Pareto candidate mixes before physical trial batches.

### Prohibited & Out-of-Scope Uses
- **Direct Regulatory Certification:** Model predictions are statistical estimates. They must **never** be cited as legal proof of compliance with building codes (e.g. IS 12894:2002) without physical testing conducted under IS 3495.
- **Cross-Material Extrapolation:** Models calibrated for fly ash bricks must not be applied to structural reinforced concrete, alkali-activated geopolymer concrete, or road sub-base soil stabilization.
- **Zero-Verification Factory Production:** Model recommendations are candidate formulations for laboratory verification, not turnkey automated manufacturing recipes.

---

## 2. Feature Manifest & Leakage Prevention

### Approved Predictor Manifest
Formulation parameters available prior to destructive testing:
```python
APPROVED_PREDICTOR_MANIFEST = [
    "fly_ash_fraction",           # Dry mass fraction (0.0 - 1.0)
    "cement_fraction",            # Dry mass fraction (0.0 - 1.0)
    "lime_fraction",              # Dry mass fraction (0.0 - 1.0)
    "gypsum_fraction",            # Dry mass fraction (0.0 - 1.0)
    "sand_fraction",              # Dry mass fraction (0.0 - 1.0)
    "stone_dust_fraction",        # Dry mass fraction (0.0 - 1.0)
    "quarry_dust_fraction",       # Dry mass fraction (0.0 - 1.0)
    "water_content_or_ratio",     # Reported w/b ratio or moisture %
    "curing_duration_days",       # Duration of moist/ambient curing
    "curing_temperature_c",       # Curing chamber or ambient temperature
    "test_age_days",              # Age at mechanical test
    "compaction_pressure_mpa",    # Molding compaction press pressure
    "density_kg_m3",              # Bulk dry masonry unit density
]
```

### Documented Exclusion Manifest
The following attributes are strictly quarantined from model training to prevent target leakage and spurious citation memorization:
- **Relational Identifiers & Provenance:** `record_id`, `paper_id`, `document_id`, `doi_or_url`, `experiment_group_id`, `duplicate_group_id`, `source_title`, `source_authors`, `publication_year`, `source_page`. (Prevents memorizing laboratory bias rather than mix physics).
- **Administrative Lifecycle:** `review_status`, `reviewed_by`, `reviewed_at`, `value_origin`, `schema_version`, `extraction_method`.
- **Destructive Post-Test Outcomes:** `failure_mode`, `is12894_class_nominal`, `is12894_water_absorption_compliant`, `specimen_count_n`, `compressive_strength_sd_mpa`, `water_absorption_sd_pct`.

---

## 3. Training & Evaluation Protocol

### Paper-Grouped Cross-Validation (`GroupKFold`)
- Splitting: Observations are grouped strictly by literature publication identifier (`paper_id`).
- Leakage Prevention: All records originating from a given publication are confined to either the training fold or the validation fold. They are never split across folds.
- Preprocessing: `TrainingFoldPreprocessor` computes median imputations exclusively within training folds. Validation folds are transformed using frozen training medians.

### Reference Mean Baseline Comparison
For every evaluation fold, a `MeanBaselineRegressor` fits the training fold targets and predicts the training mean for held-out fold samples. XGBoost regression metrics (MAE, RMSE, $R^2$) are benchmarked directly against this honest reference floor to verify that tree boosting learns true generalizable material relationships.

---

## 4. TreeSHAP Attribution & Interpretation Boundaries

- **Methodology:** TreeSHAP (`shap.TreeExplainer`) computes local additive feature attributions satisfying the efficiency, symmetry, and additivity axioms:
  $$f(x) = \phi_0 + \sum_{i=1}^{M} \phi_i(x)$$
- **Scientific Limitation Notice:**
  SHAP values reflect the sensitivity and attribution of the fitted mathematical decision trees. They **do not** prove chemical reaction kinetics, calcium silicate hydrate crystal growth, or causal thermodynamic mechanisms. Attributions are reported strictly as model sensitivity insights.

---

## 5. Current Operational Status & Readiness Gating

- **Current Active State:** The active research database currently contains 0 accepted empirical literature records.
- **Fail-Closed Behavior:** In strict adherence to `PLAN.md` Section 12, model training is blocked (`HTTP 422 DATA_READINESS_BLOCKED`). Inference endpoints (`/api/models/predict`, `/api/models/explain`) return `HTTP 503 MODEL_UNAVAILABLE`.
- **Activation Requirement:** Researchers must curate $\ge 15$ accepted empirical records across $\ge 3$ distinct publications before model training can be activated.
