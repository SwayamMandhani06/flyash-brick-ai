from datetime import datetime, timezone
import math
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
import numpy as np
from sqlalchemy.orm import Session

from backend.app.persistence.models import ExperimentalRecord, OptimizationRun
from backend.app.persistence.repositories import (
    DatasetVersionRepository,
    ModelMetadataRepository,
    OptimizationRepository,
    RecordRepository,
)
from backend.app.schemas.optimization import (
    CandidateFormulation,
    FormulationConstraints,
    OptimizationRequest,
    OptimizationResponse,
    TargetPerformanceRequirements,
)


class OptimizationReadinessError(Exception):
    """Raised when optimization is attempted but dataset or model prerequisites are unready."""
    pass


class UnsupportedMaterialSystemError(Exception):
    """Raised when an unsupported or mixed material system is requested."""
    pass


# Default constituent bounds by material system
SUPPORTED_MATERIAL_SYSTEMS = {
    "fly_ash_lime_gypsum_brick": {
        "fly_ash": (0.40, 0.75),
        "lime": (0.08, 0.25),
        "gypsum": (0.02, 0.08),
        "sand": (0.10, 0.35),
        "cement": (0.00, 0.05),
        "stone_dust": (0.00, 0.20),
        "quarry_dust": (0.00, 0.20),
        "water_ratio": (0.14, 0.30),
        "min_binder_sum": 0.10,  # lime + gypsum + cement
        "min_fly_ash": 0.40,
    },
    "cement_fly_ash_brick": {
        "fly_ash": (0.40, 0.70),
        "cement": (0.08, 0.20),
        "sand": (0.15, 0.45),
        "stone_dust": (0.00, 0.25),
        "quarry_dust": (0.00, 0.25),
        "lime": (0.00, 0.00),
        "gypsum": (0.00, 0.00),
        "water_ratio": (0.15, 0.35),
        "min_binder_sum": 0.08,  # cement
        "min_fly_ash": 0.40,
    },
}


def check_optimization_readiness(
    db: Session,
    material_system: str,
    dataset_version_id: Optional[str] = None,
    allow_test_models: bool = False,
) -> Tuple[Any, Any]:
    """Verifies that both compressive strength and water absorption models are available and trained.

    Enforces that empirical records meet project readiness threshold (>= 15 accepted records, >= 3 papers).
    Raises OptimizationReadinessError if prerequisites are missing.
    """
    if material_system not in SUPPORTED_MATERIAL_SYSTEMS:
        raise UnsupportedMaterialSystemError(
            f"Unsupported material system '{material_system}'. "
            f"Supported systems are: {list(SUPPORTED_MATERIAL_SYSTEMS.keys())}."
        )

    if allow_test_models:
        # Test fixture bypass for isolated algorithmic verification
        return (None, None)

    # 1. Check empirical dataset readiness
    if dataset_version_id:
        records = DatasetVersionRepository.get_version_records(db, dataset_version_id)
    else:
        records = RecordRepository.list_records(db, limit=10000)

    # Filter accepted empirical records
    empirical_records = [
        r for r in records
        if getattr(r, "value_origin", "") != "synthetic" and getattr(r, "review_status", "") == "accepted"
    ]

    # Target: compressive strength
    strength_records = [
        r for r in empirical_records
        if getattr(r, "compressive_strength_mpa", None) is not None and getattr(r, "compressive_strength_mpa") > 0.0
    ]
    strength_papers = {getattr(r, "paper_id", "") for r in strength_records if getattr(r, "paper_id", None)}

    # Target: water absorption
    absorption_records = [
        r for r in empirical_records
        if getattr(r, "water_absorption_pct", None) is not None and getattr(r, "water_absorption_pct") > 0.0
    ]
    absorption_papers = {getattr(r, "paper_id", "") for r in absorption_records if getattr(r, "paper_id", None)}

    missing_prereqs = []
    if len(strength_records) < 15 or len(strength_papers) < 3:
        missing_prereqs.append(
            f"Compressive strength dataset unready: {len(strength_records)}/15 accepted records across {len(strength_papers)}/3 papers."
        )
    if len(absorption_records) < 15 or len(absorption_papers) < 3:
        missing_prereqs.append(
            f"Water absorption dataset unready: {len(absorption_records)}/15 accepted records across {len(absorption_papers)}/3 papers."
        )

    # 2. Check trained model availability
    strength_model = ModelMetadataRepository.get_latest_trained_by_target(db, "compressive_strength_mpa")
    absorption_model = ModelMetadataRepository.get_latest_trained_by_target(db, "water_absorption_pct")

    if not strength_model or not strength_model.is_trained:
        missing_prereqs.append("No trained model artifact registered for compressive_strength_mpa.")
    if not absorption_model or not absorption_model.is_trained:
        missing_prereqs.append("No trained model artifact registered for water_absorption_pct.")

    if missing_prereqs:
        reasons_text = "; ".join(missing_prereqs)
        raise OptimizationReadinessError(
            f"OPTIMIZATION_UNAVAILABLE: Manufacturing formulation search is blocked. "
            f"Prerequisites not met: {reasons_text} "
            f"Under PLAN.md Section 12 & 15, empirical optimization cannot execute without verified empirical models."
        )

    return (strength_model, absorption_model)


def evaluate_domain_support(
    mix: Dict[str, float],
    training_bounds: Optional[Dict[str, Tuple[float, float]]] = None,
) -> str:
    """Checks whether candidate features lie within the calibrated training bounds.

    Returns 'supported', 'extrapolated', or 'unverified_no_empirical_baseline'.
    Note: Full multidimensional convex-hull enforcement is not implemented.
    This check uses conservative 1D feature-wise hyper-rectangle bounds.
    """
    if not training_bounds:
        return "unverified_no_empirical_baseline"

    for feat, val in mix.items():
        if feat in training_bounds:
            low, high = training_bounds[feat]
            if val < (low - 1e-4) or val > (high + 1e-4):
                return "extrapolated"
    return "supported"


def compute_pareto_optimality(candidates: List[Dict[str, Any]]) -> List[bool]:
    """Computes Pareto optimality (non-dominated sorting) across feasible candidates.

    Objectives to balance:
    - Maximize compressive strength (higher is better)
    - Minimize water absorption (lower is better)
    - Maximize fly ash fraction (higher is better)
    """
    n = len(candidates)
    if n == 0:
        return []
    if n == 1:
        return [True]

    is_pareto = [True] * n
    for i in range(n):
        if not candidates[i]["is_feasible"]:
            is_pareto[i] = False
            continue
        c1 = candidates[i]
        s1 = c1["predicted_compressive_strength_mpa"] or 0.0
        a1 = c1["predicted_water_absorption_pct"] or 999.0
        f1 = c1["mix_proportions"].get("fly_ash_fraction", 0.0)

        for j in range(n):
            if i == j or not candidates[j]["is_feasible"]:
                continue
            c2 = candidates[j]
            s2 = c2["predicted_compressive_strength_mpa"] or 0.0
            a2 = c2["predicted_water_absorption_pct"] or 999.0
            f2 = c2["mix_proportions"].get("fly_ash_fraction", 0.0)

            # c2 dominates c1 if c2 is at least as good in all objectives and strictly better in at least one
            if (s2 >= s1 and a2 <= a1 and f2 >= f1) and (s2 > s1 or a2 < a1 or f2 > f1):
                is_pareto[i] = False
                break

    return is_pareto


def calculate_objective_score(
    candidate: Dict[str, Any],
    primary_objective: str,
) -> float:
    """Computes a deterministic scalar objective score for candidate ranking."""
    str_val = candidate["predicted_compressive_strength_mpa"] or 0.0
    abs_val = candidate["predicted_water_absorption_pct"] or 50.0
    fa_val = candidate["mix_proportions"].get("fly_ash_fraction", 0.0)

    if primary_objective == "maximize_fly_ash":
        # Prioritize fly ash, break ties with compressive strength
        return round(float(fa_val * 100.0 + str_val * 0.1), 4)

    elif primary_objective == "maximize_strength":
        # Prioritize compressive strength
        return round(float(str_val * 10.0 + fa_val * 5.0), 4)

    elif primary_objective == "minimize_water_absorption":
        # Prioritize low water absorption
        return round(float((30.0 - abs_val) * 10.0 + str_val * 0.5), 4)

    else:  # balanced_pareto
        # Composite multi-objective trade-off
        # Normalized strength (e.g. 15 MPa is nominal), normalized absorption (12% is nominal), fly ash fraction
        str_norm = min(str_val / 20.0, 1.5)
        abs_norm = max(0.0, (25.0 - abs_val) / 25.0)
        score = 0.40 * str_norm + 0.35 * abs_norm + 0.25 * fa_val
        return round(float(score * 100.0), 4)


class ConstrainedMixOptimizer:
    """Bounded, reproducible formulation optimization engine for fly ash bricks."""

    def __init__(
        self,
        request: OptimizationRequest,
        strength_predictor: Optional[Callable[[Dict[str, Any]], float]] = None,
        absorption_predictor: Optional[Callable[[Dict[str, Any]], float]] = None,
        training_bounds: Optional[Dict[str, Tuple[float, float]]] = None,
    ):
        self.request = request
        self.material_system = request.material_system
        self.system_bounds = SUPPORTED_MATERIAL_SYSTEMS.get(
            self.material_system, SUPPORTED_MATERIAL_SYSTEMS["fly_ash_lime_gypsum_brick"]
        )
        self.strength_predictor = strength_predictor
        self.absorption_predictor = absorption_predictor
        self.training_bounds = training_bounds
        self.rng = np.random.default_rng(request.random_seed)

    def generate_candidate_vector(self, idx: int) -> Dict[str, Any]:
        """Generates a bounded candidate mix vector enforcing mass balance."""
        custom_c = self.request.formulation_constraints

        # Determine bounds
        fa_min = custom_c.min_fly_ash_fraction if custom_c else self.system_bounds["fly_ash"][0]
        fa_max = custom_c.max_fly_ash_fraction if custom_c else self.system_bounds["fly_ash"][1]

        # Draw fly ash fraction
        fa_frac = round(float(self.rng.uniform(fa_min, fa_max)), 4)

        if self.material_system == "fly_ash_lime_gypsum_brick":
            lime_min = custom_c.min_lime_fraction if (custom_c and custom_c.min_lime_fraction is not None) else self.system_bounds["lime"][0]
            lime_max = custom_c.max_lime_fraction if (custom_c and custom_c.max_lime_fraction is not None) else self.system_bounds["lime"][1]
            lime_frac = round(float(self.rng.uniform(lime_min, lime_max)), 4)

            gyp_min = custom_c.min_gypsum_fraction if (custom_c and custom_c.min_gypsum_fraction is not None) else self.system_bounds["gypsum"][0]
            gyp_max = custom_c.max_gypsum_fraction if (custom_c and custom_c.max_gypsum_fraction is not None) else self.system_bounds["gypsum"][1]
            gyp_frac = round(float(self.rng.uniform(gyp_min, gyp_max)), 4)

            cement_frac = 0.0
            if custom_c and custom_c.max_cement_fraction and custom_c.max_cement_fraction > 0:
                c_min = custom_c.min_cement_fraction or 0.0
                cement_frac = round(float(self.rng.uniform(c_min, custom_c.max_cement_fraction)), 4)

            # Aggregate as slack balance
            remaining = 1.0 - (fa_frac + lime_frac + gyp_frac + cement_frac)
            sand_frac = max(0.0, round(float(remaining), 4))
            stone_dust_frac = 0.0
            quarry_dust_frac = 0.0

        elif self.material_system == "cement_fly_ash_brick":
            c_min = custom_c.min_cement_fraction if (custom_c and custom_c.min_cement_fraction is not None) else self.system_bounds["cement"][0]
            c_max = custom_c.max_cement_fraction if (custom_c and custom_c.max_cement_fraction is not None) else self.system_bounds["cement"][1]
            cement_frac = round(float(self.rng.uniform(c_min, c_max)), 4)

            lime_frac = 0.0
            gyp_frac = 0.0

            remaining = 1.0 - (fa_frac + cement_frac)
            sand_frac = max(0.0, round(float(remaining), 4))
            stone_dust_frac = 0.0
            quarry_dust_frac = 0.0
        else:
            raise UnsupportedMaterialSystemError(f"Unsupported system {self.material_system}")

        # Water dosage
        w_min = custom_c.min_water_content_or_ratio if custom_c else self.system_bounds["water_ratio"][0]
        w_max = custom_c.max_water_content_or_ratio if custom_c else self.system_bounds["water_ratio"][1]
        water_val = round(float(self.rng.uniform(w_min, w_max)), 4)
        water_basis = custom_c.water_basis if custom_c else "water_binder_ratio"

        # Curing settings
        curing_days = custom_c.curing_duration_days if custom_c else 28
        curing_temp = custom_c.curing_temperature_c if custom_c else 27.0

        mix = {
            "fly_ash_fraction": fa_frac,
            "lime_fraction": lime_frac,
            "cement_fraction": cement_frac,
            "gypsum_fraction": gyp_frac,
            "sand_fraction": sand_frac,
            "stone_dust_fraction": stone_dust_frac,
            "quarry_dust_fraction": quarry_dust_frac,
        }

        dry_sum = round(sum(mix.values()), 4)

        return {
            "candidate_id": f"CAND_{idx+1:04d}",
            "mix_proportions": mix,
            "dry_mass_sum": dry_sum,
            "water_parameter": {
                "water_content_or_ratio": water_val,
                "water_basis": water_basis,
            },
            "curing_parameters": {
                "curing_duration_days": curing_days,
                "curing_temperature_c": curing_temp,
            },
        }

    def check_formulation_feasibility(self, candidate: Dict[str, Any]) -> List[str]:
        """Evaluates formulation and physics constraints before surrogate prediction."""
        violations = []
        mix = candidate["mix_proportions"]
        dry_sum = candidate["dry_mass_sum"]

        # 1. Mass balance check (nominal 1.0 +/- 0.005)
        if abs(dry_sum - 1.0) > 0.005:
            violations.append(f"MASS_BALANCE_VIOLATION: Dry fractions sum to {dry_sum}, deviating from 1.0")

        # 2. Minimum Fly Ash
        min_fa = self.system_bounds["min_fly_ash"]
        if mix["fly_ash_fraction"] < min_fa:
            violations.append(f"INSUFFICIENT_FLY_ASH: Fly ash fraction {mix['fly_ash_fraction']} < {min_fa}")

        # 3. Active Binder Requirement
        if self.material_system == "fly_ash_lime_gypsum_brick":
            binder_sum = mix["lime_fraction"] + mix["gypsum_fraction"] + mix["cement_fraction"]
            if binder_sum < self.system_bounds["min_binder_sum"]:
                violations.append(
                    f"INSUFFICIENT_BINDER: Combined lime+gypsum+cement ({round(binder_sum, 4)}) "
                    f"< {self.system_bounds['min_binder_sum']}"
                )
        elif self.material_system == "cement_fly_ash_brick":
            if mix["cement_fraction"] < self.system_bounds["min_binder_sum"]:
                violations.append(
                    f"INSUFFICIENT_CEMENT: Cement fraction ({mix['cement_fraction']}) "
                    f"< {self.system_bounds['min_binder_sum']}"
                )

        # 4. Minimum aggregate
        agg_sum = mix["sand_fraction"] + mix["stone_dust_fraction"] + mix["quarry_dust_fraction"]
        if agg_sum < 0.05:
            violations.append(f"INSUFFICIENT_AGGREGATE: Fine aggregate fraction {agg_sum} < 0.05")

        # 5. Water dosage bounds
        w_val = candidate["water_parameter"]["water_content_or_ratio"]
        if w_val < 0.10 or w_val > 0.45:
            violations.append(f"INVALID_WATER_DOSAGE: Water dosage {w_val} is physically non-viable")

        return violations

    def run_optimization(self) -> Dict[str, Any]:
        """Executes candidate search, constraint filtering, surrogate evaluation, and ranking."""
        n_candidates = self.request.max_candidates
        all_candidates = []
        rejection_summary: Dict[str, int] = {}

        # 1. Generate & Filter Candidates
        for i in range(n_candidates):
            cand = self.generate_candidate_vector(i)
            violations = self.check_formulation_feasibility(cand)

            cand["is_feasible"] = len(violations) == 0
            cand["constraint_violations"] = violations

            # Domain extrapolation check
            cand["supported_domain_status"] = evaluate_domain_support(
                cand["mix_proportions"], self.training_bounds
            )

            # Record rejection reasons
            for v in violations:
                code = v.split(":")[0]
                rejection_summary[code] = rejection_summary.get(code, 0) + 1

            all_candidates.append(cand)

        feasible_candidates = [c for c in all_candidates if c["is_feasible"]]

        # 2. Surrogate Model Evaluation for Feasible Candidates
        if self.strength_predictor and self.absorption_predictor:
            for cand in feasible_candidates:
                # Prepare flat predictor dictionary
                pred_input = {**cand["mix_proportions"]}
                pred_input["water_content_or_ratio"] = cand["water_parameter"]["water_content_or_ratio"]
                pred_input["curing_duration_days"] = cand["curing_parameters"]["curing_duration_days"]
                pred_input["curing_temperature_c"] = cand["curing_parameters"]["curing_temperature_c"]

                s_val = round(float(self.strength_predictor(pred_input)), 2)
                a_val = round(float(self.absorption_predictor(pred_input)), 2)

                cand["predicted_compressive_strength_mpa"] = s_val
                cand["predicted_water_absorption_pct"] = a_val

                # 3. Post-Prediction Performance Constraints
                reqs = self.request.performance_requirements
                if reqs.min_compressive_strength_mpa is not None:
                    if s_val < reqs.min_compressive_strength_mpa:
                        cand["is_feasible"] = False
                        code = "STRENGTH_BELOW_MINIMUM"
                        cand["constraint_violations"].append(
                            f"{code}: Predicted {s_val} MPa < {reqs.min_compressive_strength_mpa} MPa"
                        )
                        rejection_summary[code] = rejection_summary.get(code, 0) + 1

                if reqs.max_water_absorption_pct is not None:
                    if a_val > reqs.max_water_absorption_pct:
                        cand["is_feasible"] = False
                        code = "ABSORPTION_ABOVE_MAXIMUM"
                        cand["constraint_violations"].append(
                            f"{code}: Predicted {a_val}% > {reqs.max_water_absorption_pct}%"
                        )
                        rejection_summary[code] = rejection_summary.get(code, 0) + 1
        else:
            # Without predictors, candidates cannot be validated against target performance
            for cand in feasible_candidates:
                cand["predicted_compressive_strength_mpa"] = None
                cand["predicted_water_absorption_pct"] = None

        # Re-filter feasible candidates after performance check
        final_feasible = [c for c in all_candidates if c["is_feasible"]]

        # 4. Pareto Dominance Analysis
        pareto_flags = compute_pareto_optimality(final_feasible)
        for cand, p_flag in zip(final_feasible, pareto_flags):
            cand["is_pareto_optimal"] = p_flag

        # 5. Objective Scoring & Ranking
        for cand in final_feasible:
            cand["objective_score"] = calculate_objective_score(cand, self.request.primary_objective)

        # Sort descending by objective score, breaking ties by pareto optimality
        final_feasible.sort(key=lambda c: (c["objective_score"], c["is_pareto_optimal"]), reverse=True)

        for rank_idx, cand in enumerate(final_feasible):
            cand["rank"] = rank_idx + 1

        top_k = final_feasible[: self.request.top_k]

        status = "completed" if len(top_k) > 0 else "no_feasible_solution"

        warnings = []
        if len(final_feasible) == 0:
            warnings.append(
                "No candidate formulation satisfied all manufacturing and performance constraints. "
                "Consider broadening material bounds or adjusting target thresholds."
            )
        if self.training_bounds is None:
            warnings.append(
                "Empirical training data domain bounds unverified. "
                "Recommendations carry extrapolation uncertainty and require physical laboratory qualification."
            )

        return {
            "status": status,
            "material_system": self.material_system,
            "primary_objective": self.request.primary_objective,
            "algorithm_version": "v1.0.0-bounded-search",
            "random_seed": self.request.random_seed,
            "search_space_generated": n_candidates,
            "feasible_candidates_count": len(final_feasible),
            "recommended_candidates": top_k,
            "rejection_summary": rejection_summary,
            "warnings": warnings,
        }
