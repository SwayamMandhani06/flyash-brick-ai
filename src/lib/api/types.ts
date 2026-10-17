/**
 * FlyAsh Intel — API Contracts & Type Definitions
 * 
 * Formal interfaces prepared for integration with future Python (FastAPI/Flask) backend:
 * - POST /api/extract
 * - POST /api/validate
 * - GET  /api/dataset
 * - POST /api/predict
 * - POST /api/optimize
 * - POST /api/explain
 */

import type { FlyAshMixRecord } from '../../types/dataset';
import type { DemoPaper } from '../../data/demo/papers';
import type { CandidateSolution } from '../../data/demo/optimization';

// ==========================================
// 01. Extraction Service Contracts
// ==========================================
export interface ExtractRequest {
  paperId?: string;
  file?: File;
  ocrEngine?: 'tesseract' | 'layoutlm' | 'heuristic';
}

export interface ExtractedTableData {
  tableIndex: number;
  title: string;
  boundingBox: { x: number; y: number; w: number; h: number };
  confidence: number;
  rawHeaders: string[];
  rawRows: (string | number)[][];
  normalizedMixes: Partial<FlyAshMixRecord>[];
}

export interface ExtractResponse {
  paperMetadata: Partial<DemoPaper>;
  extractedTables: ExtractedTableData[];
  normalizedCount: number;
  executionTimeMs: number;
  status: 'complete' | 'partial' | 'failed';
}

// ==========================================
// 02. Validation Service Contracts
// ==========================================
export interface ValidateRequest {
  flyAshPercent: number;
  limePercent: number;
  gypsumPercent: number;
  cementPercent: number;
  sandPercent: number;
  quarryDustPercent?: number;
  waterBinderRatio: number;
  standardTarget?: 'IS_12894_2002' | 'IS_3812_PART_1';
}

export interface ValidationIssue {
  field: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidateResponse {
  isValid: boolean;
  dryMassSum: number; // Must strictly equal 100% ± 0.1%
  isMassBalanced: boolean;
  issues: ValidationIssue[];
  standardConformityNotice: string;
}

// ==========================================
// 03. Dataset Service Contracts
// ==========================================
export interface DatasetFilterParams {
  search?: string;
  curingDays?: number | 'all';
  minFlyAsh?: number;
  maxFlyAsh?: number;
  page?: number;
  limit?: number;
  sortBy?: keyof FlyAshMixRecord;
  sortOrder?: 'asc' | 'desc';
}

export interface DatasetResponse {
  records: FlyAshMixRecord[];
  total: number;
  schemaVersion: string;
  standardReference: string;
}

// ==========================================
// 04. AI Quality Prediction Service Contracts
// ==========================================
export interface PredictRequest {
  flyAshPercent: number;
  limePercent: number;
  gypsumPercent: number;
  cementPercent: number;
  waterBinderRatio: number;
  curingDays?: number;
}

export interface CuringProgression {
  age3d: number;
  age7d: number;
  age14d: number;
  age28d: number;
}

export interface PredictResponse {
  compressiveStrength28d: number; // in MPa
  compressiveStrengthAtAge: number; // at requested curingDays
  waterAbsorption: number; // % by mass
  is12894Class: string; // e.g. "Class 15"
  curingProgression: CuringProgression;
  isDemoEstimate: boolean;
  surrogateConfidenceScore?: number;
}

// ==========================================
// 05. Manufacturing Mix Optimizer Contracts
// ==========================================
export interface OptimizeRequest {
  targetStrengthMpa: number;
  maxWaterAbsorptionPercent: number;
  allowCementClinker: boolean;
  primaryObjective: 'waste' | 'cost' | 'speed';
}

export interface PanMixerBatchSheet {
  unitsPerBatch: number; // e.g. 500 bricks
  flyAshKg: number;
  limeKg: number;
  gypsumKg: number;
  cementKg: number;
  sandKg: number;
  waterLiters: number;
  waterBinderRatio: number;
  totalBatchWeightKg: number;
  brickDimensionsMm: string; // "230 x 110 x 70"
  embodiedCarbonReduction: string; // "88% vs Clay Bricks"
}

export interface OptimizeResponse {
  recommendedCandidate: CandidateSolution;
  allParetoCandidates: CandidateSolution[];
  batchSheet: PanMixerBatchSheet;
  searchSpaceEvaluatedCount: number;
  solverType: string; // e.g. "NSGA-II Multi-Objective Evolutionary Algorithm"
  isDemoSimulation: boolean;
}

export interface LiveCandidateFormulation {
  candidate_id: string;
  rank: number;
  material_system: string;
  mix_proportions: Record<string, number>;
  dry_mass_sum: number;
  water_parameter: {
    water_content_or_ratio: number;
    water_basis: string;
  };
  curing_parameters: {
    curing_duration_days: number;
    curing_temperature_c: number;
  };
  predicted_compressive_strength_mpa?: number;
  predicted_water_absorption_pct?: number;
  is_feasible: boolean;
  constraint_violations: string[];
  supported_domain_status: 'supported' | 'extrapolated' | 'unverified_no_empirical_baseline';
  objective_score: number;
  is_pareto_optimal: boolean;
}

export interface LiveOptimizationRequest {
  material_system: string;
  primary_objective: string;
  performance_requirements: {
    min_compressive_strength_mpa?: number;
    max_water_absorption_pct?: number;
  };
  formulation_constraints?: {
    min_fly_ash_fraction?: number;
    max_fly_ash_fraction?: number;
    min_lime_fraction?: number;
    max_lime_fraction?: number;
    min_cement_fraction?: number;
    max_cement_fraction?: number;
    min_gypsum_fraction?: number;
    max_gypsum_fraction?: number;
    min_water_content_or_ratio?: number;
    max_water_content_or_ratio?: number;
  };
  max_candidates?: number;
  top_k?: number;
  random_seed?: number;
}

export interface LiveOptimizationResponse {
  run_id: string;
  status: 'completed' | 'blocked' | 'no_feasible_solution';
  material_system: string;
  primary_objective: string;
  algorithm_version: string;
  random_seed: number;
  search_space_generated: number;
  feasible_candidates_count: number;
  models_used: Record<string, string>;
  dataset_version_id?: string;
  recommended_candidates: LiveCandidateFormulation[];
  rejection_summary: Record<string, number>;
  warnings: string[];
  disclaimer: string;
  created_at: string;
}

// ==========================================
// 06. Model Explainability Contracts
// ==========================================
export interface ExplainRequest {
  mixComposition: {
    flyAshPercent: number;
    limePercent: number;
    gypsumPercent: number;
    cementPercent: number;
    waterBinderRatio: number;
  };
  target: 'compressiveStrength' | 'waterAbsorption';
}

export interface FeatureImportanceItem {
  featureName: string;
  shapValue: number;
  relativeImpact: 'positive' | 'negative';
  description: string;
}

export interface ExplainResponse {
  target: string;
  baselineMean: number;
  features: FeatureImportanceItem[];
  method: string; // "KernelSHAP / TreeSHAP"
  isDemoExplanation: boolean;
}

// ==========================================
// 07. Curation CSV Import & Readiness Contracts
// ==========================================
export interface CSVImportRowResult {
  row_number: number;
  record_id?: string;
  paper_id?: string;
  status: 'created' | 'warning' | 'error' | 'skipped';
  errors: string[];
  warnings: string[];
  duplicate_suspect: boolean;
  matched_existing_record_id?: string;
}

export interface CSVImportResponse {
  curator_name: string;
  filename: string;
  total_rows_processed: number;
  imported_records_count: number;
  rows_with_warnings_count: number;
  rows_failed_count: number;
  created_record_ids: string[];
  row_results: CSVImportRowResult[];
  summary: string;
}

export interface LiveTargetReadinessReport {
  target_property: string;
  readiness_status: 'ready_for_evaluation' | 'preliminary_limited_evidence' | 'unsupported_insufficient_data';
  eligible_sample_count: number;
  distinct_paper_count: number;
  distinct_experiment_group_count: number;
  missing_target_count: number;
  material_system_counts: Record<string, number>;
  feature_missingness_summary: Record<string, number>;
  grouped_evaluation_feasible: boolean;
  recommended_split_strategy: string;
  justification: string;
  limitations: string[];
  unmet_readiness_criteria: string[];
  next_corrective_action: string;
  unit_and_basis_issues: string[];
  duplicate_and_grouping_warnings: string[];
}

export interface LiveReadinessOverviewResponse {
  analysis_id?: string;
  dataset_version_id?: string;
  compressive_strength: LiveTargetReadinessReport;
  water_absorption: LiveTargetReadinessReport;
  general_limitations: string[];
  evaluated_at: string;
}
