import pytest
import numpy as np
from httpx import AsyncClient
from sqlalchemy.orm import Session

from backend.app.persistence.models import ExperimentalRecord, OptimizationRun, Paper
from backend.app.persistence.repositories import (
    ModelMetadataRepository,
    OptimizationRepository,
    PaperRepository,
    RecordRepository,
)
from backend.app.schemas.optimization import (
    FormulationConstraints,
    OptimizationRequest,
    TargetPerformanceRequirements,
)
from backend.app.services.optimization_service import (
    ConstrainedMixOptimizer,
    OptimizationReadinessError,
    UnsupportedMaterialSystemError,
    calculate_objective_score,
    check_optimization_readiness,
    compute_pareto_optimality,
    evaluate_domain_support,
)


def mock_strength_model(x: dict) -> float:
    """Deterministic surrogate proxy for testing optimization mechanics."""
    fa = x.get("fly_ash_fraction", 0.50)
    lime = x.get("lime_fraction", 0.15)
    cement = x.get("cement_fraction", 0.0)
    w = x.get("water_content_or_ratio", 0.20)
    # Higher binder -> higher strength; excess water -> lower strength
    return float(round(10.0 + (lime * 40.0) + (cement * 60.0) - (w * 15.0) + (fa * 5.0), 2))


def mock_absorption_model(x: dict) -> float:
    """Deterministic surrogate proxy for testing optimization mechanics."""
    fa = x.get("fly_ash_fraction", 0.50)
    lime = x.get("lime_fraction", 0.15)
    w = x.get("water_content_or_ratio", 0.20)
    # Higher fly ash / water -> higher absorption; higher lime -> lower absorption
    return float(round(8.0 + (fa * 8.0) + (w * 12.0) - (lime * 10.0), 2))


# -----------------------------------------------------------------------------
# 1. Readiness Gate & Prerequisite Enforcement Tests
# -----------------------------------------------------------------------------
def test_readiness_gate_rejects_empty_database(db_session: Session):
    """Verifies that optimization is blocked when the database has 0 accepted empirical records."""
    with pytest.raises(OptimizationReadinessError) as exc_info:
        check_optimization_readiness(
            db=db_session,
            material_system="fly_ash_lime_gypsum_brick",
            allow_test_models=False,
        )
    err_msg = str(exc_info.value)
    assert "OPTIMIZATION_UNAVAILABLE" in err_msg
    assert "Compressive strength dataset unready" in err_msg
    assert "Water absorption dataset unready" in err_msg


def test_readiness_gate_rejects_synthetic_records(db_session: Session):
    """Verifies that synthetic fixture records are barred from counting toward empirical optimization readiness."""
    paper = Paper(
        paper_id="PAPER_TEST_SYN",
        title="Synthetic Test Paper",
        authors="Test Authors",
        material_system="fly_ash_lime_gypsum_brick",
    )
    db_session.add(paper)
    db_session.commit()

    for i in range(25):
        rec = ExperimentalRecord(
            record_id=f"REC_SYN_{i:03d}",
            paper_id=paper.paper_id,
            review_status="accepted",
            value_origin="synthetic",  # Must be ignored by empirical readiness
            material_system="fly_ash_lime_gypsum_brick",
            fly_ash_fraction=0.60,
            lime_fraction=0.15,
            gypsum_fraction=0.05,
            sand_fraction=0.20,
            compressive_strength_mpa=15.0,
            water_absorption_pct=11.0,
        )
        db_session.add(rec)
    db_session.commit()

    with pytest.raises(OptimizationReadinessError) as exc_info:
        check_optimization_readiness(
            db=db_session,
            material_system="fly_ash_lime_gypsum_brick",
            allow_test_models=False,
        )
    assert "0/15 accepted records" in str(exc_info.value)


def test_readiness_gate_rejects_unsupported_material_system(db_session: Session):
    """Verifies that unapproved or hybrid material systems are rejected with an explicit error."""
    with pytest.raises(UnsupportedMaterialSystemError) as exc_info:
        check_optimization_readiness(
            db=db_session,
            material_system="geopolymer_red_mud_aggregate",
            allow_test_models=False,
        )
    assert "Unsupported material system" in str(exc_info.value)


# -----------------------------------------------------------------------------
# 2. Formulation and Search Mechanics Tests
# -----------------------------------------------------------------------------
def test_candidate_generation_within_bounds():
    """Verifies that candidate generation respects constituent bounds and sums to 1.0."""
    req = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        max_candidates=50,
        random_seed=42,
    )
    optimizer = ConstrainedMixOptimizer(
        request=req,
        strength_predictor=mock_strength_model,
        absorption_predictor=mock_absorption_model,
    )
    res = optimizer.run_optimization()
    assert res["status"] == "completed"
    assert len(res["recommended_candidates"]) > 0

    for cand in res["recommended_candidates"]:
        mix = cand["mix_proportions"]
        assert 0.40 <= mix["fly_ash_fraction"] <= 0.75
        assert 0.08 <= mix["lime_fraction"] <= 0.25
        assert 0.02 <= mix["gypsum_fraction"] <= 0.08
        # Mass balance sum check
        assert abs(cand["dry_mass_sum"] - 1.0) <= 0.005


def test_material_system_separation_cement_fly_ash():
    """Verifies that Cement-Fly Ash system strictly enforces cement binder and 0 lime/gypsum."""
    req = OptimizationRequest(
        material_system="cement_fly_ash_brick",
        max_candidates=50,
        random_seed=123,
    )
    optimizer = ConstrainedMixOptimizer(
        request=req,
        strength_predictor=mock_strength_model,
        absorption_predictor=mock_absorption_model,
    )
    res = optimizer.run_optimization()
    assert res["status"] == "completed"

    for cand in res["recommended_candidates"]:
        mix = cand["mix_proportions"]
        assert mix["lime_fraction"] == 0.0
        assert mix["gypsum_fraction"] == 0.0
        assert mix["cement_fraction"] >= 0.08


def test_target_performance_filtering():
    """Verifies that candidates below min compressive strength or above max absorption are rejected."""
    # Impose a strict strength requirement: >= 20.0 MPa
    req = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        performance_requirements=TargetPerformanceRequirements(
            min_compressive_strength_mpa=20.0,
            max_water_absorption_pct=10.0,
        ),
        max_candidates=100,
        random_seed=42,
    )
    optimizer = ConstrainedMixOptimizer(
        request=req,
        strength_predictor=mock_strength_model,
        absorption_predictor=mock_absorption_model,
    )
    res = optimizer.run_optimization()

    for cand in res["recommended_candidates"]:
        assert cand["predicted_compressive_strength_mpa"] >= 20.0
        assert cand["predicted_water_absorption_pct"] <= 10.0


def test_no_feasible_solution_handling():
    """Verifies that mutually impossible constraints return no-feasible-solution without relaxing constraints."""
    # Impossible threshold: compressive strength >= 100 MPa (impossible for fly ash bricks)
    req = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        performance_requirements=TargetPerformanceRequirements(
            min_compressive_strength_mpa=100.0,
        ),
        max_candidates=50,
        random_seed=42,
    )
    optimizer = ConstrainedMixOptimizer(
        request=req,
        strength_predictor=mock_strength_model,
        absorption_predictor=mock_absorption_model,
    )
    res = optimizer.run_optimization()

    assert res["status"] == "no_feasible_solution"
    assert len(res["recommended_candidates"]) == 0
    assert res["feasible_candidates_count"] == 0
    assert "STRENGTH_BELOW_MINIMUM" in res["rejection_summary"]
    assert any("No candidate formulation satisfied" in w for w in res["warnings"])


def test_deterministic_reproducibility():
    """Verifies that identical random seeds generate identical candidate formulations and scores."""
    req1 = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        max_candidates=30,
        random_seed=999,
    )
    req2 = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        max_candidates=30,
        random_seed=999,
    )
    opt1 = ConstrainedMixOptimizer(req1, mock_strength_model, mock_absorption_model)
    opt2 = ConstrainedMixOptimizer(req2, mock_strength_model, mock_absorption_model)

    res1 = opt1.run_optimization()
    res2 = opt2.run_optimization()

    assert len(res1["recommended_candidates"]) == len(res2["recommended_candidates"])
    for c1, c2 in zip(res1["recommended_candidates"], res2["recommended_candidates"]):
        assert c1["candidate_id"] == c2["candidate_id"]
        assert c1["objective_score"] == c2["objective_score"]
        assert c1["mix_proportions"] == c2["mix_proportions"]


def test_primary_objective_differentiation():
    """Verifies that different objectives result in different candidate rankings."""
    req_fa = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        primary_objective="maximize_fly_ash",
        max_candidates=100,
        top_k=1,
        random_seed=42,
    )
    req_str = OptimizationRequest(
        material_system="fly_ash_lime_gypsum_brick",
        primary_objective="maximize_strength",
        max_candidates=100,
        top_k=1,
        random_seed=42,
    )
    opt_fa = ConstrainedMixOptimizer(req_fa, mock_strength_model, mock_absorption_model)
    opt_str = ConstrainedMixOptimizer(req_str, mock_strength_model, mock_absorption_model)

    res_fa = opt_fa.run_optimization()
    res_str = opt_str.run_optimization()

    top_fa = res_fa["recommended_candidates"][0]
    top_str = res_str["recommended_candidates"][0]

    # The max fly ash winner should have high fly ash fraction
    assert top_fa["mix_proportions"]["fly_ash_fraction"] >= 0.70
    # The max strength winner should have higher strength
    assert top_str["predicted_compressive_strength_mpa"] >= top_fa["predicted_compressive_strength_mpa"]


def test_pareto_optimality_computation():
    """Verifies non-dominated Pareto sorting identifies non-dominated candidates."""
    candidates = [
        {
            "is_feasible": True,
            "predicted_compressive_strength_mpa": 18.0,
            "predicted_water_absorption_pct": 10.0,
            "mix_proportions": {"fly_ash_fraction": 0.60},
        },
        {
            "is_feasible": True,
            "predicted_compressive_strength_mpa": 15.0,  # Dominated by candidate 1
            "predicted_water_absorption_pct": 12.0,
            "mix_proportions": {"fly_ash_fraction": 0.55},
        },
        {
            "is_feasible": True,
            "predicted_compressive_strength_mpa": 22.0,  # Non-dominated (higher strength)
            "predicted_water_absorption_pct": 11.5,
            "mix_proportions": {"fly_ash_fraction": 0.50},
        },
    ]
    flags = compute_pareto_optimality(candidates)
    assert flags[0] is True   # Candidate 1 is Pareto optimal
    assert flags[1] is False  # Candidate 2 is dominated by Candidate 1
    assert flags[2] is True   # Candidate 3 is Pareto optimal


def test_domain_support_evaluation():
    """Verifies that domain evaluation correctly flags extrapolation beyond empirical bounds."""
    training_bounds = {
        "fly_ash_fraction": (0.40, 0.70),
        "lime_fraction": (0.10, 0.20),
    }

    # Within bounds
    status_supported = evaluate_domain_support(
        {"fly_ash_fraction": 0.55, "lime_fraction": 0.15},
        training_bounds=training_bounds,
    )
    assert status_supported == "supported"

    # Beyond bounds
    status_extrapolated = evaluate_domain_support(
        {"fly_ash_fraction": 0.85, "lime_fraction": 0.15},
        training_bounds=training_bounds,
    )
    assert status_extrapolated == "extrapolated"

    # No empirical training data
    status_unverified = evaluate_domain_support(
        {"fly_ash_fraction": 0.55, "lime_fraction": 0.15},
        training_bounds=None,
    )
    assert status_unverified == "unverified_no_empirical_baseline"


# -----------------------------------------------------------------------------
# 3. Persistence and Repository Tests
# -----------------------------------------------------------------------------
def test_optimization_run_persistence(db_session: Session):
    """Verifies that OptimizationRun objects can be persisted and retrieved via OptimizationRepository."""
    run = OptimizationRun(
        material_system="fly_ash_lime_gypsum_brick",
        status="completed",
        primary_objective="balanced_pareto",
        algorithm_version="v1.0.0-bounded-search",
        random_seed=42,
        performance_requirements={"min_compressive_strength_mpa": 12.0},
        formulation_constraints={"min_fly_ash_fraction": 0.40},
        models_used={"compressive_strength_mpa": "mod_test_123"},
        search_space_generated=100,
        feasible_candidates_count=25,
        recommended_candidates=[
            {
                "candidate_id": "CAND_0001",
                "rank": 1,
                "material_system": "fly_ash_lime_gypsum_brick",
                "mix_proportions": {"fly_ash_fraction": 0.65},
                "dry_mass_sum": 1.0,
                "water_parameter": {"water_content_or_ratio": 0.22, "water_basis": "water_binder_ratio"},
                "curing_parameters": {"curing_duration_days": 28, "curing_temperature_c": 27.0},
                "predicted_compressive_strength_mpa": 16.5,
                "predicted_water_absorption_pct": 11.2,
                "is_feasible": True,
                "constraint_violations": [],
                "supported_domain_status": "supported",
                "objective_score": 85.5,
                "is_pareto_optimal": True,
            }
        ],
        rejection_summary={"MASS_BALANCE_VIOLATION": 5},
        warnings=[],
        disclaimer="Test disclaimer",
    )
    persisted = OptimizationRepository.create(db_session, run)
    assert persisted.run_id.startswith("opt_")

    fetched = OptimizationRepository.get_by_id(db_session, persisted.run_id)
    assert fetched is not None
    assert fetched.material_system == "fly_ash_lime_gypsum_brick"
    assert fetched.feasible_candidates_count == 25
    assert len(fetched.recommended_candidates) == 1

    runs = OptimizationRepository.list_runs(db_session, material_system="fly_ash_lime_gypsum_brick")
    assert len(runs) >= 1


# -----------------------------------------------------------------------------
# 4. API Endpoint Integration Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_api_optimization_run_returns_503_when_models_unready(async_client: AsyncClient):
    """Verifies that calling POST /api/optimization/run returns HTTP 503 when models/empirical data are unready."""
    payload = {
        "material_system": "fly_ash_lime_gypsum_brick",
        "primary_objective": "balanced_pareto",
        "performance_requirements": {
            "min_compressive_strength_mpa": 12.0,
            "max_water_absorption_pct": 14.0,
        },
        "max_candidates": 50,
        "random_seed": 42,
    }
    response = await async_client.post("/api/optimization/run", json=payload)
    assert response.status_code == 503
    data = response.json()
    err_msg = data["error"]["message"]
    assert "OPTIMIZATION_UNAVAILABLE" in err_msg
    assert "empirical optimization cannot execute without verified empirical models" in err_msg


@pytest.mark.asyncio
async def test_api_optimize_alias_returns_503_when_models_unready(async_client: AsyncClient):
    """Verifies that the /api/optimize alias route also returns HTTP 503."""
    payload = {
        "material_system": "fly_ash_lime_gypsum_brick",
        "primary_objective": "maximize_fly_ash",
        "max_candidates": 50,
        "random_seed": 42,
    }
    response = await async_client.post("/api/optimize", json=payload)
    assert response.status_code == 503
    err_msg = response.json()["error"]["message"]
    assert "OPTIMIZATION_UNAVAILABLE" in err_msg


@pytest.mark.asyncio
async def test_api_optimization_run_rejects_unsupported_material_system(async_client: AsyncClient):
    """Verifies that POST /api/optimization/run rejects unsupported material systems with HTTP 422."""
    payload = {
        "material_system": "unsupported_hybrid_slag_concrete",
        "primary_objective": "balanced_pareto",
        "max_candidates": 50,
    }
    response = await async_client.post("/api/optimization/run", json=payload)
    assert response.status_code == 422
    err_msg = response.json()["error"]["message"]
    assert "Unsupported material system" in err_msg


@pytest.mark.asyncio
async def test_api_list_and_get_optimization_runs(async_client: AsyncClient, db_session: Session):
    """Verifies that /api/optimization/runs and /api/optimization/runs/{id} function correctly."""
    # Seed an isolated run into the test database
    run = OptimizationRun(
        material_system="fly_ash_lime_gypsum_brick",
        status="completed",
        primary_objective="balanced_pareto",
        algorithm_version="v1.0.0-bounded-search",
        random_seed=42,
        performance_requirements={},
        formulation_constraints={},
        models_used={},
        search_space_generated=100,
        feasible_candidates_count=10,
        recommended_candidates=[],
        rejection_summary={},
        warnings=[],
        disclaimer="Test disclaimer",
    )
    OptimizationRepository.create(db_session, run)

    # 1. List runs
    list_res = await async_client.get("/api/optimization/runs")
    assert list_res.status_code == 200
    runs = list_res.json()
    assert len(runs) >= 1
    assert any(r["run_id"] == run.run_id for r in runs)

    # 2. Get run by ID
    get_res = await async_client.get(f"/api/optimization/runs/{run.run_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["run_id"] == run.run_id
    assert detail["material_system"] == "fly_ash_lime_gypsum_brick"

    # 3. Get non-existent run ID returns 404
    missing_res = await async_client.get("/api/optimization/runs/opt_nonexistent_999")
    assert missing_res.status_code == 404
