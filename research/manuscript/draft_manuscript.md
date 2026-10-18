# XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing

**Authors:** Swayam Mandhani, Project Research Team
**Affiliation:** Department of Civil Engineering & Computer Science, Engineering Institution
**Target Publication Venue:** *Construction and Building Materials* / *Journal of Building Engineering*
**Manuscript Status:** Formal Working Draft (Pre-Submission Review)
**Approved Baseline Reference:** Root `PLAN.md` (Sections 1.2, 2, 13, 14, 15, and 19.2)

---

## Abstract

Fly ash brick manufacturing provides an environmentally sustainable pathway to valorize vast quantities of coal-fired thermal power plant byproducts while replacing carbon-intensive Portland cement and fertile agricultural topsoil. However, broader industrial adoption is severely impeded by batch-to-batch raw-material variability, fragmented and inconsistent experimental reporting across published literature, and heavy reliance on heuristic trial-and-error mixing. In this investigation, we develop a software and machine learning framework designed to extract and standardize experimental fly ash brick data from published literature while preserving complete source provenance; train and evaluate dual-target XGBoost regression models for 28-day axial compressive strength and 24-hour water absorption using paper-grouped cross-validation; explain model sensitivities using TreeSHAP; and prescribe Pareto-optimal candidate formulations under explicit physical, chemical, and national standard (IS 12894:2002) constraints. To uphold scientific integrity, model training and surrogate optimization are strictly gated behind project-defined empirical readiness thresholds ($\ge 15$ accepted samples across $\ge 3$ independent literature sources). The current software foundation, data schema (`v1.0.0-canonical`), leakage-quarantined training pipeline, and bounded multi-objective optimizer are fully implemented and verified. In the current local deployment baseline, empirical model evaluation remains safely blocked pending literature ingestion, preventing fabricated findings or premature claims of generalization. This manuscript details the mathematical formulation, algorithmic architecture, and experimental validation protocol designed to guide laboratory testing toward compliant, low-carbon masonry units.

**Keywords:** Fly ash brick, XGBoost regression, Process optimization, Machine learning surrogate, Compressive strength, Water absorption, TreeSHAP, IS 12894.

---

## 1. Introduction

Global production of coal combustion byproducts exceeds one billion metric tons annually, presenting critical land utilization, particulate dispersion, and groundwater leaching challenges. In masonry construction, pulverized fuel ash offers an effective pozzolanic replacement for fired clay bricks and high-emission Portland cement. When activated with lime and gypsum (the FaL-G system) or blended with cement, fly ash undergoes slow pozzolanic reactions that synthesize calcium silicate hydrates (C-S-H) and ettringite ($3\text{CaO}\cdot\text{Al}_2\text{O}_3\cdot3\text{CaSO}_4\cdot32\text{H}_2\text{O}$), yielding masonry units capable of meeting structural requirements under standards such as IS 12894:2002 (Kumar, 2002). Furthermore, industrial mineral residues and mineral fillers such as limestone dust have been demonstrated to play critical roles in regulating compaction density, strength development, and water absorption in sustainable composite masonry units (Turgut & Algin, 2007).

Despite these established benefits, plant operators encounter substantial quality-control bottlenecks:
1. **Raw-Material Heterogeneity:** Chemical composition ($\text{SiO}_2$, $\text{Al}_2\text{O}_3$, $\text{CaO}$), loss on ignition (LOI), and particle fineness vary widely depending on combustion efficiency and coal source.
2. **Literature Fragmentation:** Decades of empirical laboratory studies report mix formulations under inconsistent notations, heterogeneous units, and missing binder/water bases.
3. **Trial-and-Error Formulation:** Manufacturing plants frequently adjust batching through heuristic experimentation, resulting in high variance in compressive strength and excessive water absorption.

To address these challenges, this study establishes an evidence-grounded machine learning and optimization framework fulfilling three approved objectives:
1. **Extract and standardize** experimental fly ash brick formulation, manufacturing, and performance data from selected research publications while preserving source provenance.
2. **Develop and evaluate** XGBoost-based predictive models for compressive strength and water absorption using reviewed, comparable data and paper-grouped evaluation.
3. **Optimize and recommend** candidate manufacturing formulations using XGBoost predictions, explicit feasibility constraints, extrapolation checks, and explainable results.

---

## 2. Materials & Methodology

### 2.1 Literature Extraction & Canonical Schema Standardization
The data curation pipeline ingests peer-reviewed literature through both cryptographic PDF document parsing (`pdfplumber`) and structured batch CSV matrix curation. Raw extractions enter the relational schema (`backend/data/flyash.db`) under specification `v1.0.0-canonical`.

Crucially, the curation protocol enforces:
- **No Zero-Fabrication:** Missing constituents or unreported water ratios remain strictly `null`. The system never imputes `0.0` or silently normalizes partial mixes to 100%.
- **Dry Mass Conservation Check:** Formulations are evaluated against nominal dry mass balance ($0.95 \le \sum f_i \le 1.05$) as a consistency check without altering original reported values.
- **Traceable Provenance:** Every record retains its source publication identifier (`paper_id`), author list, publication year, DOI, and page/table citation.

### 2.2 Target Properties & Civil Engineering Relevance
The modeling architecture isolates two primary destructive performance targets:
- **Compressive Strength ($f_{\text{ck}}$, MPa):** Minimum structural threshold of $3.5\text{ MPa}$ for Class 3.5 load-bearing bricks under IS 12894:2002; $7.5 - 10.0\text{ MPa}$ for heavy masonry.
- **Water Absorption ($w_{\text{abs}}$, %):** Upper durability threshold of $\le 20.0\%$ by dry mass under IS 12894:2002 to resist freeze-thaw and efflorescence deterioration.

### 2.3 XGBoost Predictive Modeling & Leakage Safeguards
Gradient Boosted Decision Trees via XGBoost (Chen & Guestrin, 2016) are selected for surrogate modeling due to their superior handling of non-linear interactions, tabular sparsity, and feature-level decision boundaries without requiring ungrounded normality assumptions.

Thirteen candidate predictors are approved for model training:
$$\mathbf{x} = [f_{\text{FA}}, f_{\text{cement}}, f_{\text{lime}}, f_{\text{gyp}}, f_{\text{sand}}, f_{\text{stone\_dust}}, f_{\text{quarry\_dust}}, w/b, t_{\text{cure}}, T_{\text{cure}}, t_{\text{test}}, P_{\text{compact}}, \rho_{\text{density}}]$$

**Leakage Quarantine Manifest:** All non-physical attributes (record identifiers, author names, paper titles, publication years, review lifecycle states, and post-destructive outcomes such as failure mode and nominal class) are quarantined from feature matrices to eliminate laboratory memorization.

### 2.4 Paper-Grouped Evaluation Protocol & Reference Baseline
To avoid overoptimistic performance estimates caused by intra-laboratory correlation, cross-validation is partitioned strictly by publication (`GroupKFold` grouped by `paper_id`). All records originating from a single research study are confined to either the training fold or the held-out validation fold.

Furthermore, preprocessing (median imputation of missing features) is fitted strictly inside each training fold via `TrainingFoldPreprocessor`. A `MeanBaselineRegressor` predicting the training fold mean is evaluated on the exact same folds to establish an honest reference floor for MAE, RMSE, and $R^2$.

### 2.5 Explainability via TreeSHAP
To interpret surrogate decision boundaries, the framework incorporates TreeSHAP (Tree-based Shapley Additive exPlanations; Lundberg & Lee, 2017):
$$f(\mathbf{x}) = \phi_0 + \sum_{i=1}^{M} \phi_i(\mathbf{x})$$
where $\phi_i(\mathbf{x})$ represents the additive contribution of feature $i$ to the predicted property relative to the expected model base value $\phi_0$.

> **Epistemological Boundary:** SHAP values describe the sensitivity and feature attribution of the mathematical trees. They do not constitute proof of chemical reaction kinetics, calcium silicate hydrate dissolution rates, or pozzolanic causality.

### 2.6 Constrained Multi-Objective Optimization
The optimization engine searches for non-dominated Pareto formulations that satisfy:
1. **Material System Separation:** Distinct boundaries for FaL-G ($f_{\text{FA}} \ge 0.40, f_{\text{lime}} \ge 0.08, f_{\text{gyp}} \ge 0.02, f_{\text{cement}} = 0$) and Cement–Fly Ash ($f_{\text{FA}} \ge 0.40, f_{\text{cement}} \ge 0.08, f_{\text{lime}}=0, f_{\text{gyp}}=0$).
2. **Mass Balance:** Dry fractions sum to $1.0 \pm 0.005$ with aggregate serving as the slack variable.
3. **Pareto Dominance:** Candidates are evaluated across three simultaneous objectives: $\max f_{\text{ck}}$, $\min w_{\text{abs}}$, and $\max f_{\text{FA}}$.

---

## 3. Current Empirical Status & Research Integrity

In accordance with Section 2 of `PLAN.md`, this study maintains strict scientific honesty regarding the current state of empirical evidence:

| Subsystem / Metric | Implemented Status | Current Empirical Observation |
|---|---|---|
| **Software Architecture** | Fully Implemented & Tested | 137 automated tests passing |
| **Relational Database** | Active (`flyash.db`) | 0 registered papers, 0 accepted records |
| **Model Readiness Gate** | Strictly Enforced | Both targets: `unsupported_insufficient_data` |
| **XGBoost Training Endpoint** | Implemented & Gated | Fails closed: `HTTP 422 DATA_READINESS_BLOCKED` |
| **Surrogate Inference Endpoint** | Implemented & Gated | Fails closed: `HTTP 503 MODEL_UNAVAILABLE` |
| **Process Optimizer** | Implemented & Gated | Fails closed: `HTTP 503 OPTIMIZATION_UNAVAILABLE` |

### Unlocking Thresholds
Under the project-defined operational protocol:
- **Preliminary Model Evaluation Gate:** $\ge 15$ accepted empirical samples across $\ge 3$ distinct publications.
- **Full Production Model Gate:** $\ge 30$ accepted empirical samples across $\ge 5$ distinct publications with core binder feature missingness $< 20\%$.

Because the active local deployment currently contains zero accepted research records, no empirical metrics ($R^2$, MAE, RMSE) or training curves are reported in this draft. Reporting fabricated metrics or synthetic test fixtures as real scientific findings is strictly prohibited.

---

## 4. Engineering Limitations & Physical Validation Requirements

1. **Surrogate Nature of Predictions:** Machine learning predictions are statistical interpolations within the bounding box of published literature. They cannot account for unmodeled physical variables such as water impurity, lime carbonation during storage, or curing humidity fluctuations.
2. **Mandatory Laboratory Validation:** All candidate formulations generated by the constrained optimizer are recommendations for laboratory batching. They must undergo physical trial mixing, compaction, and standard destructive compression and 24-hour immersion testing in accordance with **IS 3495 (Parts 1 to 4):2019** before industrial deployment.

---

## 5. Conclusions & Next Steps

This work delivers a robust, reproducible, and provenance-preserving engineering framework for fly ash brick materials informatics. By coupling structured literature curation, leakage-quarantined paper-grouped XGBoost modeling, TreeSHAP model attribution, and constrained multi-objective optimization, the platform provides a rigorous foundation for sustainable masonry design. The immediate next phase requires civil engineering researchers to curate and verify at least 15 empirical formulations across published literature studies to activate empirical model evaluation.

---

## References

1. Bureau of Indian Standards. (2002). *IS 12894:2002 — Pulverized Fuel Ash-Lime Bricks — Specification*. New Delhi, India.
2. Bureau of Indian Standards. (2013). *IS 3812 (Part 1):2013 — Pulverized Fuel Ash — Specification for Use as Pozzolana in Cement, Cement Mortar and Concrete*. New Delhi, India.
3. Bureau of Indian Standards. (2019). *IS 3495 (Parts 1 to 4):2019 — Methods of Tests of Burnt Clay Building Bricks*. New Delhi, India.
4. ASTM International. (2019). *ASTM C618-19 — Standard Specification for Coal Fly Ash and Raw or Calcined Natural Pozzolan for Use in Concrete*. West Conshohocken, PA.
5. Kumar, S. (2002). *A perspective study on fly ash–lime–gypsum bricks and hollow blocks for low cost housing development*. Construction and Building Materials, 16(8), 519–525. DOI: 10.1016/S0950-0618(02)00034-X.
6. Turgut, P., & Algin, H. M. (2007). *Limestone dust and wood sawdust as brick material*. Building and Environment, 42(9), 3399–3403. DOI: 10.1016/j.buildenv.2006.08.012.
7. Chen, T., & Guestrin, C. (2016). *XGBoost: A Scalable Tree Boosting System*. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785–794. DOI: 10.1145/2939672.2939785.
8. Lundberg, S. M., & Lee, S. I. (2017). *A Unified Approach to Interpreting Model Predictions*. Advances in Neural Information Processing Systems (NeurIPS 30), 4765–4774.
