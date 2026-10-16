import math
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

try:
    import xgboost as xgb
    import shap
    from sklearn.model_selection import GroupKFold
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


class DataReadinessGateError(Exception):
    """Raised when model training is attempted on an unready empirical corpus."""
    pass


# Canonical ordered candidate predictors for fly ash brick modeling
APPROVED_PREDICTOR_MANIFEST = [
    "fly_ash_fraction",
    "cement_fraction",
    "lime_fraction",
    "gypsum_fraction",
    "sand_fraction",
    "stone_dust_fraction",
    "quarry_dust_fraction",
    "water_content_or_ratio",
    "curing_duration_days",
    "curing_temperature_c",
    "test_age_days",
    "compaction_pressure_mpa",
    "density_kg_m3",
]

# Explicitly documented exclusion manifest and scientific rationale
EXCLUSION_MANIFEST = {
    # Provenance and Identifiers (Leakage risk: memorizing citation rather than mix physics)
    "record_id": "Primary key identifier; causes direct overfitting/memorization",
    "paper_id": "Literature source identifier; causes laboratory source memorization",
    "document_id": "Document storage foreign key; administrative metadata",
    "doi_or_url": "Citation link; source identifier",
    "experiment_group_id": "Physical batch clustering identifier",
    "duplicate_group_id": "Deduplication cluster tag",
    "source_title": "Paper title text; non-physical metadata",
    "source_authors": "Author list text; non-physical metadata",
    "publication_year": "Publication date; non-physical covariate",
    "source_page": "Page citation location",
    "source_table_or_figure": "Table/Figure identifier",
    "source_excerpt_or_cell_reference": "Cell reference note",
    "raw_reported_values": "Raw text dictionary from PDF parser",
    # Administrative & Review History
    "review_status": "Human curation lifecycle state; downstream administrative outcome",
    "reviewed_by": "Curator username",
    "reviewed_at": "Curator review timestamp",
    "created_at": "Database creation timestamp",
    "updated_at": "Database update timestamp",
    "value_origin": "Origin tag (literature_extracted | manual_entry | synthetic)",
    "schema_version": "Schema version string",
    "extraction_method": "Parser algorithm tag",
    "normalization_notes": "Curator narrative notes",
    # Post-Test Destructive Outcomes (Unavailable at mix design time)
    "failure_mode": "Post-destructive compression failure pattern (shear vs split)",
    "is12894_class_nominal": "Post-test nominal classification outcome",
    "is12894_water_absorption_compliant": "Post-test regulatory compliance flag",
    "specimen_count_n": "Test batch sample size",
    "compressive_strength_sd_mpa": "Test batch standard deviation",
    "water_absorption_sd_pct": "Test batch standard deviation",
    "target_test_method_notes": "Test apparatus notes",
}


class MeanBaselineRegressor:
    """Simple baseline predicting the mean of training fold targets.

    Used as an honest reference floor to evaluate whether XGBoost learns meaningful patterns.
    """

    def __init__(self):
        self.mean_value: float = 0.0

    def fit(self, y: np.ndarray) -> "MeanBaselineRegressor":
        clean_y = [v for v in y if v is not None and not np.isnan(v)]
        if not clean_y:
            self.mean_value = 0.0
        else:
            self.mean_value = float(np.mean(clean_y))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        n_samples = len(X)
        return np.full(shape=(n_samples,), fill_value=self.mean_value, dtype=float)


def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes MAE, RMSE, and R2 regression metrics."""
    diffs = y_true - y_pred
    mae = float(np.mean(np.abs(diffs)))
    rmse = float(np.sqrt(np.mean(diffs ** 2)))

    # Compute R2 score: 1 - SS_res / SS_tot
    mean_y = float(np.mean(y_true))
    ss_tot = float(np.sum((y_true - mean_y) ** 2))
    ss_res = float(np.sum(diffs ** 2))

    if ss_tot <= 1e-9:
        r2 = 0.0
    else:
        r2 = float(1.0 - (ss_res / ss_tot))

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
    }


class TrainingFoldPreprocessor:
    """Fits missing-value imputations strictly on the training fold to prevent leakage."""

    def __init__(self, feature_manifest: List[str]):
        self.feature_manifest = feature_manifest
        self.medians: Dict[str, float] = {}

    def fit(self, X_dict_list: List[Dict[str, Any]]) -> "TrainingFoldPreprocessor":
        for feat in self.feature_manifest:
            vals = [row.get(feat) for row in X_dict_list if row.get(feat) is not None and not (isinstance(row.get(feat), float) and np.isnan(row.get(feat)))]
            if vals:
                self.medians[feat] = float(np.median(vals))
            else:
                self.medians[feat] = 0.0
        return self

    def transform(self, X_dict_list: List[Dict[str, Any]]) -> np.ndarray:
        rows = []
        for row in X_dict_list:
            row_vals = []
            for feat in self.feature_manifest:
                v = row.get(feat)
                if v is None or (isinstance(v, float) and np.isnan(v)):
                    row_vals.append(self.medians.get(feat, 0.0))
                else:
                    row_vals.append(float(v))
            rows.append(row_vals)
        return np.array(rows, dtype=float)


def check_target_readiness_or_raise(
    target_property: str,
    evaluated_records: List[Any],
    allow_synthetic_test: bool = False,
) -> None:
    """Enforces the Phase 6/7 empirical data readiness gate.

    Raises DataReadinessGateError if empirical data is insufficient for grouped evaluation.
    """
    if target_property not in {"compressive_strength_mpa", "water_absorption_pct"}:
        raise ValueError(f"Unsupported prediction target: '{target_property}'")

    if not allow_synthetic_test:
        # Strictly reject synthetic records from entering empirical gate
        empirical_records = [r for r in evaluated_records if getattr(r, "value_origin", "") != "synthetic"]
    else:
        empirical_records = evaluated_records

    # Check accepted review status
    accepted_records = [r for r in empirical_records if getattr(r, "review_status", "") == "accepted"]

    # Filter records containing the actual target
    target_records = []
    for r in accepted_records:
        val = getattr(r, target_property, None)
        if val is not None and val > 0.0:
            target_records.append(r)

    distinct_papers = {getattr(r, "paper_id", "") for r in target_records if getattr(r, "paper_id", None)}

    # Phase 6 & PLAN.md Section 12 criteria:
    # Minimum 15 accepted records across at least 3 distinct papers
    if len(target_records) < 15 or len(distinct_papers) < 3:
        raise DataReadinessGateError(
            f"DATA_READINESS_BLOCKED: Cannot train XGBoost model for '{target_property}'. "
            f"Active dataset contains {len(target_records)} accepted records across {len(distinct_papers)} independent papers. "
            f"Operational readiness gate requires at least 15 accepted empirical samples across >= 3 independent papers "
            f"to perform paper-grouped cross-validation without literature leakage."
        )


def evaluate_paper_grouped_xgboost(
    records: List[Any],
    target_property: str,
    feature_manifest: Optional[List[str]] = None,
    n_splits: int = 5,
    random_seed: int = 42,
    hyperparameters: Optional[Dict[str, Any]] = None,
    allow_synthetic_test: bool = False,
) -> Dict[str, Any]:
    """Executes paper-grouped cross-validation and baseline comparison.

    All preprocessing is fit strictly inside training folds.
    """
    if not ML_AVAILABLE:
        raise RuntimeError("ML libraries (xgboost, scikit-learn) are not installed.")

    # 1. Enforce readiness gate
    check_target_readiness_or_raise(target_property, records, allow_synthetic_test=allow_synthetic_test)

    features = feature_manifest or APPROVED_PREDICTOR_MANIFEST

    # 2. Filter target records
    valid_records = []
    for r in records:
        if not allow_synthetic_test and getattr(r, "value_origin", "") == "synthetic":
            continue
        if getattr(r, "review_status", "") != "accepted":
            continue
        val = getattr(r, target_property, None)
        if val is not None and val > 0.0:
            valid_records.append(r)

    paper_ids = np.array([getattr(r, "paper_id", "unknown") for r in valid_records])
    unique_papers = np.unique(paper_ids)

    # Determine feasible fold count (bounded by unique papers)
    effective_splits = min(n_splits, len(unique_papers))
    if effective_splits < 2:
        raise DataReadinessGateError("Insufficient distinct papers to perform grouped cross-validation.")

    # Extract raw X dicts and y targets
    X_dicts = []
    y_vals = []
    for r in valid_records:
        d = {}
        for feat in features:
            d[feat] = getattr(r, feat, None)
        X_dicts.append(d)
        y_vals.append(float(getattr(r, target_property)))

    y_arr = np.array(y_vals, dtype=float)

    # 3. Paper-grouped K-Fold
    gkf = GroupKFold(n_splits=effective_splits)

    fold_results = []
    baseline_maes, baseline_rmses = [], []
    model_maes, model_rmses, model_r2s = [], [], []

    default_params = {
        "n_estimators": 50,
        "max_depth": 4,
        "learning_rate": 0.08,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": random_seed,
    }
    if hyperparameters:
        default_params.update(hyperparameters)

    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X_dicts, y_arr, groups=paper_ids)):
        # Verify strict zero paper leakage
        train_papers = set(paper_ids[train_idx])
        val_papers = set(paper_ids[val_idx])
        assert not train_papers.intersection(val_papers), "LEAKAGE_DETECTED: Overlapping papers found between train and val folds!"

        train_dicts = [X_dicts[i] for i in train_idx]
        val_dicts = [X_dicts[i] for i in val_idx]
        y_train = y_arr[train_idx]
        y_val = y_arr[val_idx]

        # In-fold preprocessor fitted strictly on training data
        preprocessor = TrainingFoldPreprocessor(features)
        preprocessor.fit(train_dicts)
        X_train_arr = preprocessor.transform(train_dicts)
        X_val_arr = preprocessor.transform(val_dicts)

        # Baseline: simple mean predictor
        baseline = MeanBaselineRegressor().fit(y_train)
        base_pred = baseline.predict(X_val_arr)
        base_metrics = compute_regression_metrics(y_val, base_pred)
        baseline_maes.append(base_metrics["mae"])
        baseline_rmses.append(base_metrics["rmse"])

        # XGBoost Regressor
        model = xgb.XGBRegressor(**default_params)
        model.fit(X_train_arr, y_train)
        model_pred = model.predict(X_val_arr)
        m_metrics = compute_regression_metrics(y_val, model_pred)
        model_maes.append(m_metrics["mae"])
        model_rmses.append(m_metrics["rmse"])
        model_r2s.append(m_metrics["r2"])

        fold_results.append({
            "fold": fold_idx + 1,
            "held_out_papers": list(val_papers),
            "train_samples": len(train_idx),
            "val_samples": len(val_idx),
            "baseline_metrics": base_metrics,
            "xgboost_metrics": m_metrics,
        })

    # Fit final model on all data
    final_preprocessor = TrainingFoldPreprocessor(features).fit(X_dicts)
    X_full = final_preprocessor.transform(X_dicts)
    final_model = xgb.XGBRegressor(**default_params).fit(X_full, y_arr)

    return {
        "target_property": target_property,
        "total_samples": len(valid_records),
        "distinct_papers_count": len(unique_papers),
        "feature_manifest": features,
        "n_splits_evaluated": effective_splits,
        "split_strategy": f"GroupKFold by paper_id ({effective_splits} folds)",
        "hyperparameters": default_params,
        "baseline_summary": {
            "mean_mae": round(float(np.mean(baseline_maes)), 4),
            "mean_rmse": round(float(np.mean(baseline_rmses)), 4),
        },
        "xgboost_summary": {
            "mean_mae": round(float(np.mean(model_maes)), 4),
            "mean_rmse": round(float(np.mean(model_rmses)), 4),
            "mean_r2": round(float(np.mean(model_r2s)), 4),
        },
        "per_fold_details": fold_results,
        "final_model": final_model,
        "final_preprocessor": final_preprocessor,
    }
