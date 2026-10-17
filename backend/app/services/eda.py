from collections import Counter
from datetime import datetime, timezone
import math
import statistics
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.persistence.models import (
    AnalysisRun,
    DatasetVersion,
    ExperimentalRecord,
    gen_analysis_id,
)
from backend.app.persistence.repositories import (
    AnalysisRepository,
    DatasetVersionRepository,
    RecordRepository,
)
from backend.app.schemas.eda import (
    AnalysisRunCreate,
    AnalysisRunResponse,
    CorrelationFinding,
    DescriptiveStatistic,
    FeatureAssessment,
    ReadinessOverviewResponse,
    TargetReadinessReport,
)


class EDAService:
    """Exploratory Data Analysis, feature assessment, and dataset readiness evaluation service."""

    # Schema field classifications
    NUMERIC_FORMULATION_FIELDS = [
        "fly_ash_fraction",
        "cement_fraction",
        "lime_fraction",
        "gypsum_fraction",
        "sand_fraction",
        "quarry_dust_fraction",
        "stone_dust_fraction",
        "water_content_or_ratio",
        "curing_duration_days",
        "curing_temperature_c",
        "test_age_days",
        "compaction_pressure_mpa",
        "density_kg_m3",
    ]

    TARGET_FIELDS = [
        "compressive_strength_mpa",
        "water_absorption_pct",
    ]

    CATEGORICAL_FIELDS = [
        "material_system",
        "brick_state",
        "fly_ash_source",
        "fly_ash_class_or_type",
        "mix_basis",
        "water_basis",
        "curing_method",
        "forming_method",
        "specimen_dimensions",
        "test_standard",
    ]

    OPTIONAL_CHEMISTRY_FIELDS = [
        "sio2_pct",
        "al2o3_pct",
        "fe2o3_pct",
        "cao_pct",
        "mgo_pct",
        "so3_pct",
        "loi_pct",
    ]

    # Fields that represent post-test outcomes, IDs, or pipeline metadata and MUST NEVER leak into features
    LEAKAGE_METADATA_FIELDS = {
        # Source Identifiers
        "record_id": ("source_identifier", "STRICTLY EXCLUDE: Unique record ID memorizes rows and causes memorization."),
        "paper_id": ("source_identifier", "STRICTLY EXCLUDE: Paper ID leaks authorship and destroys grouped cross-validation integrity."),
        "document_id": ("source_identifier", "STRICTLY EXCLUDE: Document reference leaks specific uploaded PDF artifacts."),
        "doi_or_url": ("source_identifier", "STRICTLY EXCLUDE: DOI/URL directly identifies publication source."),
        "experiment_group_id": ("source_identifier", "STRICTLY EXCLUDE: Experiment group ID is a grouping factor for split isolation, not a predictive feature."),
        "duplicate_group_id": ("source_identifier", "STRICTLY EXCLUDE: Duplicate group ID is a cluster identifier, not a predictive feature."),
        # Provenance Metadata
        "source_title": ("provenance_metadata", "STRICTLY EXCLUDE: Publication title text leaks literature identity."),
        "source_authors": ("provenance_metadata", "STRICTLY EXCLUDE: Author names leak paper provenance."),
        "publication_year": ("provenance_metadata", "STRICTLY EXCLUDE: Publication year is bibliographic metadata."),
        "source_page": ("provenance_metadata", "STRICTLY EXCLUDE: PDF page number is publication formatting metadata."),
        "source_table_or_figure": ("provenance_metadata", "STRICTLY EXCLUDE: Source location reference leaks publication layout."),
        "source_excerpt_or_cell_reference": ("provenance_metadata", "STRICTLY EXCLUDE: Cell references are extraction provenance notes."),
        "extraction_method": ("provenance_metadata", "STRICTLY EXCLUDE: Extraction pipeline mode is system metadata."),
        "raw_reported_values": ("provenance_metadata", "STRICTLY EXCLUDE: Unstructured extraction strings are provenance audit records."),
        "value_origin": ("provenance_metadata", "STRICTLY EXCLUDE: Synthetic vs empirical tag is pipeline isolation metadata."),
        "schema_version": ("provenance_metadata", "STRICTLY EXCLUDE: Schema version tag is architectural metadata."),
        "normalization_notes": ("provenance_metadata", "STRICTLY EXCLUDE: Normalization log is audit commentary."),
        # Review Lifecycle
        "review_status": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Review status is internal governance state."),
        "reviewed_by": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Reviewer username is internal audit metadata."),
        "reviewed_at": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Timestamp of human review is post-hoc administrative data."),
        "review_notes": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Human reviewer commentary is qualitative audit metadata."),
        "created_at": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Row creation timestamp is database metadata."),
        "updated_at": ("review_lifecycle_metadata", "STRICTLY EXCLUDE: Row modification timestamp is database metadata."),
        # Post-Test Outcomes & Derived Standard Classes
        "failure_mode": ("post_test_outcome", "STRICTLY EXCLUDE: Specimen fracture pattern is observable only after mechanical destructive testing."),
        "is12894_class_nominal": ("post_test_outcome", "STRICTLY EXCLUDE: Nominal IS 12894 strength class directly derives from measured compressive strength."),
        "is12894_water_absorption_compliant": ("post_test_outcome", "STRICTLY EXCLUDE: Binary compliance label directly derives from measured water absorption."),
        "reported_value_type": ("post_test_outcome", "STRICTLY EXCLUDE: Target statistic type (mean vs single specimen) is target metadata."),
        "specimen_count_n": ("post_test_outcome", "STRICTLY EXCLUDE: Batch test count is test procedure metadata."),
        "compressive_strength_sd_mpa": ("post_test_outcome", "STRICTLY EXCLUDE: Target variance statistic is target metadata."),
        "water_absorption_sd_pct": ("post_test_outcome", "STRICTLY EXCLUDE: Target variance statistic is target metadata."),
        "target_test_method_notes": ("post_test_outcome", "STRICTLY EXCLUDE: Post-test observation notes are target-dependent."),
    }

    @classmethod
    def execute_analysis(
        cls,
        db: Session,
        config: AnalysisRunCreate,
    ) -> AnalysisRunResponse:
        """Executes transparent, reproducible EDA and readiness evaluation over reviewed data."""
        # 1. Fetch records based on version or all reviewed
        if config.dataset_version_id:
            version = DatasetVersionRepository.get_by_id(db, config.dataset_version_id)
            if not version:
                raise ValueError(f"Dataset version '{config.dataset_version_id}' not found.")
            records = DatasetVersionRepository.get_version_records(db, config.dataset_version_id)
        else:
            records = RecordRepository.list_records(db, limit=10000)

        # 2. Filter records strictly according to reproducibility & safety policy
        total_raw_records = len(records)
        synthetic_records = [r for r in records if r.value_origin == "synthetic"]
        synthetic_excluded_count = len(synthetic_records) if config.exclude_synthetic else 0

        if config.exclude_synthetic:
            records = [r for r in records if r.value_origin != "synthetic"]

        if config.require_accepted_review:
            evaluated_records = [r for r in records if r.review_status == "accepted"]
        else:
            evaluated_records = records

        if config.material_system:
            evaluated_records = [r for r in evaluated_records if r.material_system == config.material_system]

        # 3. Compile sample summary
        status_counts = Counter(r.review_status for r in records)
        material_sys_counts = Counter(r.material_system for r in evaluated_records)
        distinct_papers = {r.paper_id for r in evaluated_records if r.paper_id}
        distinct_groups = {r.experiment_group_id for r in evaluated_records if r.experiment_group_id}

        sample_summary = {
            "total_raw_records": total_raw_records,
            "evaluated_records_count": len(evaluated_records),
            "synthetic_excluded_count": synthetic_excluded_count,
            "candidate_records_count": status_counts.get("candidate", 0),
            "needs_review_records_count": status_counts.get("needs_review", 0),
            "accepted_records_count": status_counts.get("accepted", 0),
            "rejected_records_count": status_counts.get("rejected", 0),
            "distinct_papers_count": len(distinct_papers),
            "distinct_experiment_groups_count": len(distinct_groups),
            "material_systems_distribution": dict(material_sys_counts),
            "review_status_distribution": dict(status_counts),
        }

        # 4. Compute descriptive statistics
        descriptive_stats = cls._compute_descriptive_stats(evaluated_records)

        # 5. Conduct feature assessments & leakage audit
        feature_assessments = cls._assess_features(evaluated_records, descriptive_stats)

        # 6. Collinearity & Pearson correlation checks
        correlation_findings = cls._compute_correlations(
            evaluated_records, threshold=config.correlation_threshold
        )

        # 7. Evaluate target-specific readiness
        target_readiness, readiness_limitations = cls._evaluate_target_readiness(
            evaluated_records,
            min_papers=config.min_papers_for_grouped_eval,
            min_samples=config.min_samples_for_evaluation,
        )

        # 8. Compile general limitations
        limitations = list(readiness_limitations)
        if len(evaluated_records) == 0:
            limitations.append(
                "No empirical research records available in the selected cohort. "
                "Corpus-level conclusions cannot be drawn until literature papers are ingested and accepted."
            )
        elif len(distinct_papers) < config.min_papers_for_grouped_eval:
            limitations.append(
                f"Cohort has data from only {len(distinct_papers)} independent paper(s). "
                f"At least {config.min_papers_for_grouped_eval} papers are required for grouped cross-validation."
            )

        # 9. Persist analysis run for auditability and reproducibility
        run_record = AnalysisRun(
            analysis_id=gen_analysis_id(),
            dataset_version_id=config.dataset_version_id,
            material_system=config.material_system,
            schema_version=settings.CANONICAL_SCHEMA_VERSION,
            analysis_config=config.model_dump(),
            sample_summary=sample_summary,
            descriptive_statistics={k: v.model_dump() for k, v in descriptive_stats.items()},
            feature_assessments={k: v.model_dump() for k, v in feature_assessments.items()},
            correlation_findings=[f.model_dump() for f in correlation_findings],
            target_readiness={k: v.model_dump() for k, v in target_readiness.items()},
            limitations=limitations,
            created_at=datetime.now(timezone.utc),
        )
        AnalysisRepository.create(db, run_record)

        return AnalysisRunResponse(
            analysis_id=run_record.analysis_id,
            dataset_version_id=run_record.dataset_version_id,
            material_system=run_record.material_system,
            schema_version=run_record.schema_version,
            analysis_config=run_record.analysis_config,
            sample_summary=run_record.sample_summary,
            descriptive_statistics=descriptive_stats,
            feature_assessments=feature_assessments,
            correlation_findings=correlation_findings,
            target_readiness=target_readiness,
            limitations=limitations,
            created_at=run_record.created_at,
        )

    @classmethod
    def get_readiness_overview(
        cls,
        db: Session,
        dataset_version_id: Optional[str] = None,
    ) -> ReadinessOverviewResponse:
        """Returns target-specific readiness status without requiring a manual re-run configuration."""
        latest_run = AnalysisRepository.get_latest(db, dataset_version_id=dataset_version_id)
        if latest_run:
            comp_dict = latest_run.target_readiness.get("compressive_strength_mpa")
            water_dict = latest_run.target_readiness.get("water_absorption_pct")
            return ReadinessOverviewResponse(
                analysis_id=latest_run.analysis_id,
                dataset_version_id=latest_run.dataset_version_id,
                compressive_strength=TargetReadinessReport(**comp_dict),
                water_absorption=TargetReadinessReport(**water_dict),
                general_limitations=latest_run.limitations,
                evaluated_at=latest_run.created_at,
            )

        # If no prior run exists, run a default assessment
        default_config = AnalysisRunCreate(
            dataset_version_id=dataset_version_id,
            exclude_synthetic=True,
            require_accepted_review=True,
        )
        res = cls.execute_analysis(db, default_config)
        return ReadinessOverviewResponse(
            analysis_id=res.analysis_id,
            dataset_version_id=res.dataset_version_id,
            compressive_strength=res.target_readiness["compressive_strength_mpa"],
            water_absorption=res.target_readiness["water_absorption_pct"],
            general_limitations=res.limitations,
            evaluated_at=res.created_at,
        )

    @classmethod
    def _compute_descriptive_stats(
        cls,
        records: List[ExperimentalRecord],
    ) -> Dict[str, DescriptiveStatistic]:
        """Calculates exact sample statistics without zero-imputation or silent row omission."""
        results: Dict[str, DescriptiveStatistic] = {}
        total_n = len(records)

        # 1. Numeric formulation variables + targets
        all_numeric_fields = cls.NUMERIC_FORMULATION_FIELDS + cls.TARGET_FIELDS
        for field in all_numeric_fields:
            raw_vals = [getattr(r, field, None) for r in records]
            valid_vals = [float(v) for v in raw_vals if v is not None and not math.isnan(float(v))]
            valid_n = len(valid_vals)
            missing_n = total_n - valid_n
            missing_pct = round((missing_n / total_n * 100.0), 2) if total_n > 0 else 0.0

            if valid_n == 0:
                results[field] = DescriptiveStatistic(
                    field_name=field,
                    field_type="numeric",
                    total_count=total_n,
                    valid_count=0,
                    missing_count=missing_n,
                    missing_pct=missing_pct,
                    unique_count=0,
                )
            elif valid_n == 1:
                v = valid_vals[0]
                results[field] = DescriptiveStatistic(
                    field_name=field,
                    field_type="numeric",
                    total_count=total_n,
                    valid_count=1,
                    missing_count=missing_n,
                    missing_pct=missing_pct,
                    mean=round(v, 4),
                    std=0.0,
                    min=round(v, 4),
                    q1=round(v, 4),
                    median=round(v, 4),
                    q3=round(v, 4),
                    max=round(v, 4),
                    unique_count=1,
                )
            else:
                mean_val = round(float(statistics.mean(valid_vals)), 4)
                std_val = round(float(statistics.stdev(valid_vals)), 4)
                min_val = round(float(min(valid_vals)), 4)
                max_val = round(float(max(valid_vals)), 4)
                median_val = round(float(statistics.median(valid_vals)), 4)

                if valid_n >= 4:
                    try:
                        quants = statistics.quantiles(valid_vals, n=4, method="inclusive")
                        q1_val = round(float(quants[0]), 4)
                        q3_val = round(float(quants[2]), 4)
                    except Exception:
                        q1_val, q3_val = min_val, max_val
                else:
                    q1_val, q3_val = min_val, max_val

                results[field] = DescriptiveStatistic(
                    field_name=field,
                    field_type="numeric",
                    total_count=total_n,
                    valid_count=valid_n,
                    missing_count=missing_n,
                    missing_pct=missing_pct,
                    mean=mean_val,
                    std=std_val,
                    min=min_val,
                    q1=q1_val,
                    median=median_val,
                    q3=q3_val,
                    max=max_val,
                    unique_count=len(set(valid_vals)),
                )

        # 2. Categorical variables
        for field in cls.CATEGORICAL_FIELDS:
            raw_vals = [getattr(r, field, None) for r in records]
            non_nulls = [str(v) for v in raw_vals if v is not None and str(v).strip()]
            valid_n = len(non_nulls)
            missing_n = total_n - valid_n
            missing_pct = round((missing_n / total_n * 100.0), 2) if total_n > 0 else 0.0
            counts = dict(Counter(non_nulls))

            results[field] = DescriptiveStatistic(
                field_name=field,
                field_type="categorical",
                total_count=total_n,
                valid_count=valid_n,
                missing_count=missing_n,
                missing_pct=missing_pct,
                unique_count=len(counts),
                value_counts=counts,
            )

        return results

    @classmethod
    def _assess_features(
        cls,
        records: List[ExperimentalRecord],
        stats: Dict[str, DescriptiveStatistic],
    ) -> Dict[str, FeatureAssessment]:
        """Evaluates constancy, missingness, and leakage risk for every candidate attribute."""
        assessments: Dict[str, FeatureAssessment] = {}

        # 1. Audit known leakage and metadata fields
        for field, (category, rec) in cls.LEAKAGE_METADATA_FIELDS.items():
            assessments[field] = FeatureAssessment(
                feature_name=field,
                field_type="metadata",
                is_leakage_risk=True,
                leakage_category=category,
                is_constant=False,
                is_near_constant=False,
                variance=None,
                unique_ratio=0.0,
                suitability="excluded_leakage" if "EXCLUDE" in rec else "metadata_only",
                recommendation=rec,
            )

        # 2. Audit Target Variables
        assessments["compressive_strength_mpa"] = FeatureAssessment(
            feature_name="compressive_strength_mpa",
            field_type="target",
            is_leakage_risk=False,
            leakage_category=None,
            is_constant=False,
            is_near_constant=False,
            variance=None,
            unique_ratio=0.0,
            suitability="target_variable",
            recommendation="TARGET PROPERTY 1: Primary regression target. Must never be used as an input feature for strength prediction.",
        )
        assessments["water_absorption_pct"] = FeatureAssessment(
            feature_name="water_absorption_pct",
            field_type="target",
            is_leakage_risk=False,
            leakage_category=None,
            is_constant=False,
            is_near_constant=False,
            variance=None,
            unique_ratio=0.0,
            suitability="target_variable",
            recommendation="TARGET PROPERTY 2: Secondary regression target. Must never be used as an input feature for absorption prediction.",
        )

        # 3. Audit Candidate Predictive Features (Formulation & Process)
        for field in cls.NUMERIC_FORMULATION_FIELDS:
            st = stats.get(field)
            if not st or st.valid_count == 0:
                assessments[field] = FeatureAssessment(
                    feature_name=field,
                    field_type="numeric",
                    is_leakage_risk=False,
                    is_constant=True,
                    is_near_constant=True,
                    variance=0.0,
                    unique_ratio=0.0,
                    suitability="high_missingness",
                    recommendation=f"UNAVAILABLE: Zero valid observations in the current cohort (100% missing).",
                )
                continue

            # Compute variance and unique counts
            raw_vals = [getattr(r, field, None) for r in records]
            valid_vals = [float(v) for v in raw_vals if v is not None and not math.isnan(float(v))]
            var_val = round(float(statistics.variance(valid_vals)), 6) if len(valid_vals) >= 2 else 0.0
            unique_n = len(set(valid_vals))
            unique_ratio = round(unique_n / len(valid_vals), 4)

            # Check constancy and near-constancy
            is_constant = (unique_n <= 1 or var_val == 0.0)
            most_common_count = Counter(valid_vals).most_common(1)[0][1] if valid_vals else 0
            is_near_constant = is_constant or (most_common_count / len(valid_vals) >= 0.95)

            if is_constant:
                suitability = "excluded_low_variance"
                rec = "EXCLUDE: Zero variance across all observed samples. Feature provides no predictive information."
            elif is_near_constant:
                suitability = "excluded_low_variance"
                rec = f"CAUTION: Near-constant feature (>95% values identical). High risk of tree split bias."
            elif st.missing_pct > 60.0:
                suitability = "high_missingness"
                rec = f"CAUTION: High missingness ({st.missing_pct}%). Requires documented imputation or optional branch in Phase 6."
            else:
                suitability = "eligible_feature"
                rec = f"ELIGIBLE: Candidate predictive feature meets variance and availability criteria for Phase 6 modeling."

            assessments[field] = FeatureAssessment(
                feature_name=field,
                field_type="numeric",
                is_leakage_risk=False,
                is_constant=is_constant,
                is_near_constant=is_near_constant,
                variance=var_val,
                unique_ratio=unique_ratio,
                suitability=suitability,
                recommendation=rec,
            )

        # 4. Audit Categorical Candidate Features
        for field in cls.CATEGORICAL_FIELDS:
            st = stats.get(field)
            if not st or st.valid_count == 0:
                assessments[field] = FeatureAssessment(
                    feature_name=field,
                    field_type="categorical",
                    is_leakage_risk=False,
                    is_constant=True,
                    is_near_constant=True,
                    variance=None,
                    unique_ratio=0.0,
                    suitability="high_missingness",
                    recommendation="UNAVAILABLE: Zero valid observations for categorical attribute.",
                )
                continue

            unique_n = st.unique_count or 0
            is_constant = (unique_n <= 1)
            is_near_constant = is_constant
            if st.value_counts:
                top_count = max(st.value_counts.values())
                is_near_constant = is_constant or (top_count / st.valid_count >= 0.95)

            suitability = "eligible_feature" if not is_constant else "excluded_low_variance"
            rec = "ELIGIBLE: Categorical processing factor." if not is_constant else "EXCLUDE: Only 1 category observed."

            assessments[field] = FeatureAssessment(
                feature_name=field,
                field_type="categorical",
                is_leakage_risk=False,
                is_constant=is_constant,
                is_near_constant=is_near_constant,
                variance=None,
                unique_ratio=round(unique_n / st.valid_count, 4) if st.valid_count > 0 else 0.0,
                suitability=suitability,
                recommendation=rec,
            )

        return assessments

    @classmethod
    def _compute_correlations(
        cls,
        records: List[ExperimentalRecord],
        threshold: float = 0.95,
    ) -> List[CorrelationFinding]:
        """Calculates Pearson bivariate correlation across numeric features to surface collinearity."""
        findings: List[CorrelationFinding] = []
        features_to_check = [
            f for f in cls.NUMERIC_FORMULATION_FIELDS
            if any(getattr(r, f, None) is not None for r in records)
        ]

        n_feats = len(features_to_check)
        for i in range(n_feats):
            for j in range(i + 1, n_feats):
                feat_a = features_to_check[i]
                feat_b = features_to_check[j]

                # Extract paired observations where both features are non-null
                pairs: List[Tuple[float, float]] = []
                for r in records:
                    va = getattr(r, feat_a, None)
                    vb = getattr(r, feat_b, None)
                    if va is not None and vb is not None:
                        try:
                            fa, fb = float(va), float(vb)
                            if not math.isnan(fa) and not math.isnan(fb):
                                pairs.append((fa, fb))
                        except (ValueError, TypeError):
                            continue

                if len(pairs) < 3:
                    continue

                xs = [p[0] for p in pairs]
                ys = [p[1] for p in pairs]

                # Check variance
                var_x = statistics.variance(xs) if len(xs) >= 2 else 0.0
                var_y = statistics.variance(ys) if len(ys) >= 2 else 0.0
                if var_x == 0.0 or var_y == 0.0:
                    continue

                # Compute Pearson r
                mean_x = statistics.mean(xs)
                mean_y = statistics.mean(ys)
                cov = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
                denom = math.sqrt(sum((x - mean_x) ** 2 for x in xs) * sum((y - mean_y) ** 2 for y in ys))
                if denom == 0.0:
                    continue

                r_val = round(cov / denom, 4)
                r_val = max(-1.0, min(1.0, r_val))

                if abs(r_val) >= threshold:
                    findings.append(
                        CorrelationFinding(
                            feature_a=feat_a,
                            feature_b=feat_b,
                            pearson_r=r_val,
                            sample_pairs_n=len(pairs),
                            interpretation=(
                                f"Extreme collinearity detected (|r| = {abs(r_val)} >= {threshold}). "
                                f"These variables carry nearly identical empirical information in this cohort."
                            ),
                            recommendation=(
                                "Review in Phase 6: Assess compositional closure effects. "
                                "Do not discard either variable automatically without material-system domain rationale, "
                                "but consider ratio transforms or regularization to avoid tree instability."
                            ),
                        )
                    )

        return findings

    @classmethod
    def _evaluate_target_readiness(
        cls,
        records: List[ExperimentalRecord],
        min_papers: int = 3,
        min_samples: int = 15,
    ) -> Tuple[Dict[str, TargetReadinessReport], List[str]]:
        """Evaluates readiness independently for compressive strength and water absorption.

        OPERATIONAL GATE RATIONALE (PLAN.md Section 12):
        The sample (15 provisional / 30 full) and paper (3 provisional / 5 full) thresholds
        are project-defined operational gates, NOT universal statistical laws:
        1. Grouped Evaluation Feasibility: At least 3 independent literature sources are required
           so that GroupKFold cross-validation (grouped on paper_id) can isolate whole publications
           between train and validation folds. Without >= 3 papers, grouped splits cannot run without
           severe leakage across identical laboratory setups.
        2. Small-Sample Overfitting Protection: Gradient boosted decision trees (XGBoost) fitted on
           fewer than 15 samples across < 3 groups exhibit extreme variance and memorize paper idiosyncrasies.
        3. Preprocessing Separation: All feature scalers, encoders, and missingness imputers must be
           fitted strictly on the training partition of each grouped split in Phase 6, never globally.
        4. Decoupling: Readiness indicates eligibility to enter the Phase 6 evaluation protocol; it does
           NOT imply scientific perfection (Phase 4 validator) or assert empirical model accuracy.
        """
        readiness_dict: Dict[str, TargetReadinessReport] = {}
        general_limitations: List[str] = []

        targets = [
            ("compressive_strength_mpa", "Compressive Strength (MPa)"),
            ("water_absorption_pct", "Water Absorption (%)"),
        ]

        for target_prop, target_display in targets:
            # Filter cohort records having valid measurements for this target
            valid_recs = [
                r for r in records
                if getattr(r, target_prop, None) is not None
                and not math.isnan(float(getattr(r, target_prop)))
            ]
            sample_count = len(valid_recs)
            missing_count = len(records) - sample_count

            # Independent grouping factors
            papers = {r.paper_id for r in valid_recs if r.paper_id}
            groups = {r.experiment_group_id for r in valid_recs if r.experiment_group_id}
            material_sys = Counter(r.material_system for r in valid_recs)

            # Core feature missingness for this target cohort
            feature_missingness: Dict[str, float] = {}
            if sample_count > 0:
                for f in ["fly_ash_fraction", "lime_fraction", "cement_fraction", "water_content_or_ratio", "curing_duration_days"]:
                    n_valid = sum(1 for r in valid_recs if getattr(r, f, None) is not None)
                    feature_missingness[f] = round(((sample_count - n_valid) / sample_count * 100.0), 2)


            # Grouped evaluation feasibility (must have at least min_papers to form distinct cross-validation folds)
            distinct_papers_n = len(papers)
            distinct_groups_n = len(groups)
            grouped_eval_feasible = distinct_papers_n >= min_papers

            # Target-specific limitations
            limitations: List[str] = []

            if sample_count == 0 or distinct_papers_n == 0:
                readiness_status = "unsupported_insufficient_data"
                split_strategy = "blocked_no_data"
                justification = f"Zero valid {target_display} experimental records exist in the reviewed corpus."
                limitations.append(f"No empirical literature data available for {target_display}.")
                limitations.append("Model training in Phase 6 is blocked until peer-reviewed records are ingested.")
            elif distinct_papers_n < min_papers:
                readiness_status = "unsupported_insufficient_data"
                split_strategy = "blocked_insufficient_papers"
                justification = (
                    f"Corpus contains {sample_count} samples for {target_display}, but from only {distinct_papers_n} "
                    f"independent paper(s). Grouped cross-validation requires at least {min_papers} independent papers "
                    f"to prevent severe literature leakage and memorization."
                )
                limitations.append(
                    f"Insufficient paper diversity ({distinct_papers_n} papers; minimum {min_papers} required for GroupKFold)."
                )
                limitations.append(
                    "Standard random train/test splits would cause cross-validation leakage between identical lab conditions."
                )
            elif sample_count < min_samples:
                readiness_status = "unsupported_insufficient_data"
                split_strategy = f"GroupKFold(n_splits={min(5, distinct_papers_n)}, groups=paper_id)"
                justification = (
                    f"Corpus contains only {sample_count} samples (minimum {min_samples} required for provisional evaluation). "
                    f"Dataset is too small to fit reliable regression models without extreme variance."
                )
                limitations.append(f"Sample count ({sample_count}) is below minimum threshold of {min_samples}.")
            elif sample_count < 30 or distinct_papers_n < 5:
                readiness_status = "preliminary_limited_evidence"
                split_strategy = f"GroupKFold(n_splits={min(5, distinct_papers_n)}, groups=paper_id)"
                justification = (
                    f"Sufficient data for exploratory modeling ({sample_count} samples across {distinct_papers_n} papers), "
                    f"but generalizability is constrained by limited sample diversity."
                )
                limitations.append(
                    f"Cohort size ({sample_count} records across {distinct_papers_n} papers) yields high variance in validation splits."
                )
                limitations.append(
                    "Resulting XGBoost models must be classified as preliminary research prototypes."
                )
            else:
                readiness_status = "ready_for_evaluation"
                split_strategy = f"GroupKFold(n_splits={min(5, distinct_papers_n)}, groups=paper_id)"
                justification = (
                    f"Corpus satisfies dataset readiness criteria: {sample_count} eligible samples across {distinct_papers_n} "
                    f"independent papers with feasible grouped cross-validation."
                )
                limitations.append(
                    "Model applicability strictly bounded to tested material systems and formulation ranges."
                )

            # Evaluate explicit unmet readiness criteria
            unmet_criteria: List[str] = []
            if distinct_papers_n < min_papers:
                unmet_criteria.append(
                    f"Paper Diversity: {distinct_papers_n}/{min_papers} independent publications (minimum {min_papers} required for GroupKFold)."
                )
            if sample_count < min_samples:
                unmet_criteria.append(
                    f"Sample Volume: {sample_count}/{min_samples} accepted empirical records (minimum {min_samples} required for provisional evaluation)."
                )

            # Determine actionable next corrective step
            if sample_count == 0 or distinct_papers_n == 0:
                next_action = f"Ingest and curate authentic research publications containing experimental {target_display} measurements via the literature PDF pipeline or curated CSV import."
            elif distinct_papers_n < min_papers:
                next_action = f"Curate experimental records from at least {min_papers - distinct_papers_n} additional independent publication(s) to enable grouped evaluation."
            elif sample_count < min_samples:
                next_action = f"Curate and accept at least {min_samples - sample_count} additional verified empirical record(s) from existing or new publications."
            elif sample_count < 30 or distinct_papers_n < 5:
                next_action = "Provisional readiness threshold met. Freeze an immutable dataset snapshot to evaluate preliminary models, or curate additional publications to reach full readiness (30 samples, 5 papers)."
            else:
                next_action = "Corpus meets full readiness criteria. Freeze an immutable dataset version snapshot to initiate paper-grouped XGBoost training."

            # Unit and mix-basis issues
            unit_basis_issues: List[str] = []
            non_standard_basis = [r for r in valid_recs if getattr(r, "mix_basis", "") not in ("dry_mass_fraction", "percentage")]
            if non_standard_basis:
                unit_basis_issues.append(f"{len(non_standard_basis)} record(s) use non-standard mix basis (e.g. mass_ratio, volume_fraction).")
            ambiguous_fractions = [
                r for r in valid_recs
                if getattr(r, "mix_basis", "") == "dry_mass_fraction" and getattr(r, "fly_ash_fraction", None) is not None and getattr(r, "fly_ash_fraction") > 1.0
            ]
            if ambiguous_fractions:
                unit_basis_issues.append(f"{len(ambiguous_fractions)} record(s) have constituent fractions > 1.0 under dry_mass_fraction basis.")

            # Duplicate and grouping concentration warnings
            duplicate_grouping_warnings: List[str] = []
            if distinct_papers_n > 0:
                paper_counts = Counter(r.paper_id for r in valid_recs if r.paper_id)
                top_paper, top_count = paper_counts.most_common(1)[0]
                if sample_count > 0 and (top_count / sample_count >= 0.70) and distinct_papers_n > 1:
                    duplicate_grouping_warnings.append(
                        f"Paper concentration: {top_count}/{sample_count} ({round(top_count/sample_count*100)}%) records originate from a single publication ('{top_paper}')."
                    )

            readiness_dict[target_prop] = TargetReadinessReport(
                target_property=target_prop,
                readiness_status=readiness_status,
                eligible_sample_count=sample_count,
                distinct_paper_count=distinct_papers_n,
                distinct_experiment_group_count=distinct_groups_n,
                missing_target_count=missing_count,
                material_system_counts=dict(material_sys),
                feature_missingness_summary=feature_missingness,
                grouped_evaluation_feasible=grouped_eval_feasible,
                recommended_split_strategy=split_strategy,
                justification=justification,
                limitations=limitations,
                unmet_readiness_criteria=unmet_criteria,
                next_corrective_action=next_action,
                unit_and_basis_issues=unit_basis_issues,
                duplicate_and_grouping_warnings=duplicate_grouping_warnings,
            )

        return readiness_dict, general_limitations
