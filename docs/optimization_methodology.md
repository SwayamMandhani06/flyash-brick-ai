# Constrained Formulation Optimization Methodology

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 15 — Phase 8: Constrained Optimization and Recommendations)
**Applicability:** Mix formulation optimization, feasibility bounding, Pareto trade-off analysis, and recommendation generation.

---

## 1. Problem Formulation & Objective

Sustainable fly ash brick manufacturing requires balancing competing technical, economic, and environmental objectives:
1. **Mechanical Quality:** Maximize 28-day axial compressive strength ($\ge 3.5\text{ MPa}$ for IS 12894 Class 3.5 structural masonry; $\ge 7.5 - 10.0\text{ MPa}$ for heavy load-bearing).
2. **Durability:** Minimize 24-hour water absorption ($\le 20.0\%$ per IS 12894).
3. **Sustainability & Cost:** Maximize pulverized fuel ash utilization ($\ge 50 - 60\%$) while minimizing expensive activators (cement or chemical-grade lime).

The optimizer explores the bounded multi-dimensional formulation space to prescribe non-dominated candidate formulations that satisfy all chemical, manufacturing, and user performance constraints.

---

## 2. Material System Constraints & Feasibility Boundaries

To prevent physically nonsensical formulations (e.g. attempting to mix cement, lime, and gypsum simultaneously in arbitrary proportions), the optimization engine enforces strict material system segregation:

### 2.1 FaL-G System (`fly_ash_lime_gypsum_brick`)
Enforces the pozzolanic calcium-silicate-hydrate and ettringite activation chemistry:
- **Fly Ash Fraction ($f_{\text{FA}}$):** $0.40 \le f_{\text{FA}} \le 0.80$ (Minimum 40% ash).
- **Lime Fraction ($f_{\text{lime}}$):** $0.08 \le f_{\text{lime}} \le 0.25$ (Hydrated calcium hydroxide activator).
- **Gypsum Fraction ($f_{\text{gyp}}$):** $0.02 \le f_{\text{gyp}} \le 0.08$ (Calcium sulfate dihydrate setting agent / ettringite promoter).
- **Active Binder Sum:** $f_{\text{lime}} + f_{\text{gyp}} \ge 0.10$.
- **Cement Prohibited:** $f_{\text{cement}} = 0.0$ (Maintains classical lime-gypsum activation chemistry).

### 2.2 Cement–Fly Ash System (`cement_fly_ash_brick`)
Enforces hydraulic cement hydration chemistry:
- **Fly Ash Fraction ($f_{\text{FA}}$):** $0.40 \le f_{\text{FA}} \le 0.85$.
- **Cement Fraction ($f_{\text{cement}}$):** $0.08 \le f_{\text{cement}} \le 0.25$ (OPC binder).
- **Lime & Gypsum Prohibited:** $f_{\text{lime}} = 0.0$, $f_{\text{gyp}} = 0.0$.

### 2.3 Physical Mass Balance & Water Limits
- **Dry Mass Conservation:** Dry constituents must sum to unity within nominal $\pm 0.5\%$ tolerance:
  $$f_{\text{FA}} + f_{\text{binders}} + f_{\text{aggregate}} = 1.0 \pm 0.005$$
  The aggregate fraction (sand or stone dust) serves as the slack variable filling the remaining proportion.
- **Water Dosage Viability:** Water-to-dry-mix ratio or $w/b$ must fall within practical brick press compactability bounds:
  $$0.10 \le w \le 0.45$$

---

## 3. Search Algorithm & Multi-Objective Pareto Ranking

### 3.1 Bounded Candidate Search Framework
The optimization service (`backend/app/services/optimization_service.py`) executes a reproducible bounded search over the feasible hyper-rectangle:
1. **Sampling:** Generates candidate mix vectors over valid constituent grids and uniform distributions bounded by material system limits.
2. **Hard Constraint Filtering:** Rejects candidates violating mass conservation, binder minimums, or aggregate non-negativity.
3. **Surrogate Model Evaluation:** Evaluates remaining candidates using the trained XGBoost compressive strength and water absorption surrogate models.
4. **User Target Filtering:** Filters out candidates failing user requirements (e.g. $f_{\text{ck}} < \text{target\_strength}$ or $\text{absorption} > \text{target\_max}$).
5. **Pareto Dominance Assessment:** Identifies non-dominated solutions across:
   - Objective 1: Maximize Compressive Strength ($\text{MPa}$).
   - Objective 2: Minimize Water Absorption ($\%$).
   - Objective 3: Maximize Fly Ash Utilization ($f_{\text{FA}}$).

### 3.2 Candidate Ranking Strategies
Candidates are ranked according to the requested scalarization strategy:
- `balanced_pareto`: Normalizes all three objectives to $[0, 1]$ and weights them equally.
- `maximize_fly_ash`: Prioritizes maximum ash replacement for highest environmental byproduct valorization.
- `maximize_strength`: Prioritizes structural load-bearing performance.
- `minimize_water_absorption`: Prioritizes maximum weathering resistance and durability.

---

## 4. Extrapolation & Domain Support Warnings

Machine learning surrogate models cannot reliably extrapolate far beyond their training distribution. The optimizer classifies candidate domain support:
- `supported`: All constituent fractions lie strictly within the empirical bounding box of the training corpus.
- `extrapolated`: One or more constituents lie outside observed empirical bounds; flagged with an explicit warning.
- `unverified_no_empirical_baseline`: Assigned when no empirical baseline dataset is available to define domain bounds.

---

## 5. Physical Validation & Governance Disclaimers

> [!WARNING]
> **Mandatory Laboratory Validation Requirement:**
> Recommended formulations are mathematically optimized surrogate estimates. In accordance with civil engineering research ethics, recommended formulations must undergo physical batching, mixing, hydraulic press compaction, water curing, and standardized compressive/absorption testing under **IS 3495 (Parts 1 to 4):2019** before industrial plant adoption.
