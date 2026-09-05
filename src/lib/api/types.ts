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
