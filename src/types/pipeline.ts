export interface PipelineStageInfo {
  id: string;
  stepNumber: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  status: 'active' | 'ready' | 'pending';
  sampleMetrics: {
    label: string;
    value: string;
    unit?: string;
  }[];
  schemaFields: string[];
  scientificReference?: string;
}

export interface ExtractionSimulationStep {
  id: number;
  label: string;
  detail: string;
  durationMs: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

export interface OptimizationTarget {
  minCompressiveStrength: number; // MPa
  maxWaterAbsorption: number; // %
  curingDays: number;
  maxCementAllowed: number; // %
  targetFlyAshRatio: number; // %
}

export interface OptimizationResult {
  id: string;
  rank: number;
  mixId: string;
  flyAshPercent: number;
  limePercent: number;
  gypsumPercent: number;
  cementPercent: number;
  quarryDustPercent: number;
  waterBinderRatio: number;
  predictedStrength: number;
  predictedAbsorption: number;
  embodiedCarbonReduction: number; // % vs standard clay brick
  costIndex: number;
  feasibilityScore: number;
}
