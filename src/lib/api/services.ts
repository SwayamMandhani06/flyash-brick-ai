/**
 * FlyAsh Intel — Modular Application Services Layer
 * 
 * Sits between UI components and backend endpoints.
 * Provides client-side fallback/mocking for frontend prototype execution,
 * and seamless transition to real Python endpoints (FastAPI/Flask) via apiClient.
 */

import { apiClient } from './client';
import type {
  ExtractRequest,
  ExtractResponse,
  ValidateRequest,
  ValidateResponse,
  DatasetFilterParams,
  DatasetResponse,
  PredictRequest,
  PredictResponse,
  OptimizeRequest,
  OptimizeResponse,
  ExplainRequest,
  ExplainResponse,
} from './types';

import { DEMO_RESEARCH_PAPERS } from '../../data/demo/papers';
import { DEMO_BENCHMARK_DATASET } from '../../data/demo/dataset';
import { DEMO_CANDIDATE_SOLUTIONS } from '../../data/demo/optimization';
import { calculateDemoPrediction } from '../../data/demo/predictions';

// Helper for realistic async network simulation in demo mode
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// 1. Literature Extraction Service (POST /api/extract)
// ============================================================================
export const extractionService = {
  async extractPaperTables(request: ExtractRequest): Promise<ExtractResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.post<ExtractRequest, ExtractResponse>('/api/extract', request);
    }

    // Simulated extraction sequence
    await delay(700);
    const paper = DEMO_RESEARCH_PAPERS.find((p) => p.id === request.paperId) || DEMO_RESEARCH_PAPERS[0];

    return {
      paperMetadata: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        doi: paper.doi,
      },
      extractedTables: [
        {
          tableIndex: 1,
          title: paper.targetTable,
          boundingBox: paper.boundingBox,
          confidence: 0.986,
          rawHeaders: ['Batch Code', 'Fly Ash (g)', 'Hydrated Lime (g)', 'Gypsum (g)', 'W/B', '28D Comp (MPa)'],
          rawRows: [
            ['M1-65', 650, 180, 50, 0.14, 16.4],
            ['M2-60', 600, 150, 50, 0.15, 19.2],
          ],
          normalizedMixes: [
            {
              mixId: 'FA-EXT-01',
              flyAshPercent: 65.0,
              limePercent: 18.0,
              gypsumPercent: 5.0,
              sandPercent: 12.0,
              waterBinderRatio: 0.14,
              compressiveStrength: 16.4,
              waterAbsorption: 11.2,
              is12894Class: 'Class 15',
            },
            {
              mixId: 'FA-EXT-02',
              flyAshPercent: 60.0,
              limePercent: 15.0,
              gypsumPercent: 5.0,
              sandPercent: 20.0,
              waterBinderRatio: 0.15,
              compressiveStrength: 19.2,
              waterAbsorption: 10.4,
              is12894Class: 'Class 17.5',
            },
          ],
        },
      ],
      normalizedCount: 2,
      executionTimeMs: 420,
      status: 'complete',
    };
  },
};

// ============================================================================
// 2. Data Validation Service (POST /api/validate)
// ============================================================================
export const validationService = {
  async validateComposition(request: ValidateRequest): Promise<ValidateResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.post<ValidateRequest, ValidateResponse>('/api/validate', request);
    }

    await delay(300);
    const quarry = request.quarryDustPercent || 0;
    const total = parseFloat((request.flyAshPercent + request.limePercent + request.gypsumPercent + request.cementPercent + request.sandPercent + quarry).toFixed(1));
    const isMassBalanced = Math.abs(total - 100.0) <= 0.2;

    const issues: ValidateResponse['issues'] = [];

    if (!isMassBalanced) {
      issues.push({
        field: 'dryMassSum',
        rule: 'MASS_BALANCE_100_PERCENT',
        severity: 'error',
        message: `Sum of dry constituents must equal 100.0%. Current sum: ${total}%.`,
      });
    }

    if (request.flyAshPercent < 40) {
      issues.push({
        field: 'flyAshPercent',
        rule: 'IS_12894_MINIMUM_ASH',
        severity: 'warning',
        message: 'IS 12894 recommends at least 40% fly ash for sustainable pozzolanic classification.',
      });
    }

    if (request.waterBinderRatio > 0.25 || request.waterBinderRatio < 0.10) {
      issues.push({
        field: 'waterBinderRatio',
        rule: 'WORKABILITY_LIMITS',
        severity: 'warning',
        message: 'Water-to-binder ratio outside recommended range (0.10 - 0.22) for semi-dry hydraulic pressing.',
      });
    }

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      dryMassSum: total,
      isMassBalanced,
      issues,
      standardConformityNotice: 'Evaluated under IS 12894:2002 guidelines.',
    };
  },
};

// ============================================================================
// 3. Benchmark Dataset Service (GET /api/dataset)
// ============================================================================
export const datasetService = {
  async getDataset(params?: DatasetFilterParams): Promise<DatasetResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.get<DatasetResponse>('/api/dataset', params as any);
    }

    await delay(200);
    let records = [...DEMO_BENCHMARK_DATASET];

    if (params?.search) {
      const q = params.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.mixId.toLowerCase().includes(q) ||
          r.authors.toLowerCase().includes(q) ||
          r.paperId.toLowerCase().includes(q)
      );
    }

    if (params?.curingDays && params.curingDays !== 'all') {
      records = records.filter((r) => r.curingDays === params.curingDays);
    }

    if (params?.minFlyAsh) {
      records = records.filter((r) => r.flyAshPercent >= (params.minFlyAsh || 0));
    }

    if (params?.sortBy) {
      const field = params.sortBy;
      const asc = params.sortOrder === 'asc';
      records.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return {
      records,
      total: records.length,
      schemaVersion: 'v0.1.0-canonical',
      standardReference: 'IS 12894:2002 / IS 3812 (Part 1)',
    };
  },
};

// ============================================================================
// 4. Quality Prediction Service (POST /api/predict)
// ============================================================================
export const predictionService = {
  async predictQuality(request: PredictRequest): Promise<PredictResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.post<PredictRequest, PredictResponse>('/api/predict', request);
    }

    await delay(350);
    const computed = calculateDemoPrediction(
      request.flyAshPercent,
      request.cementPercent,
      request.limePercent,
      request.gypsumPercent,
      request.waterBinderRatio,
      request.curingDays || 28
    );

    return {
      compressiveStrength28d: computed.str28d,
      compressiveStrengthAtAge: computed.currentAgeStrength,
      waterAbsorption: computed.abs,
      is12894Class: computed.is12894Class,
      curingProgression: {
        age3d: computed.str3d,
        age7d: computed.str7d,
        age14d: computed.str14d,
        age28d: computed.str28d,
      },
      isDemoEstimate: true,
      surrogateConfidenceScore: 0.94,
    };
  },
};

// ============================================================================
// 5. Mix Optimizer Service (POST /api/optimize)
// ============================================================================
export const optimizationService = {
  async optimizeMix(request: OptimizeRequest): Promise<OptimizeResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.post<OptimizeRequest, OptimizeResponse>('/api/optimize', request);
    }

    await delay(600);

    // Filter suitable Pareto candidate based on target
    let rec = DEMO_CANDIDATE_SOLUTIONS[0];
    if (request.targetStrengthMpa >= 20) {
      rec = DEMO_CANDIDATE_SOLUTIONS.find((c) => c.id === 'OPT-03') || DEMO_CANDIDATE_SOLUTIONS[0];
    } else if (request.targetStrengthMpa <= 12) {
      rec = DEMO_CANDIDATE_SOLUTIONS.find((c) => c.id === 'OPT-02') || DEMO_CANDIDATE_SOLUTIONS[1];
    }

    const unitsPerBatch = 500;
    const kgPerBrick = 2.36;
    const totalMassKg = Math.round(unitsPerBatch * kgPerBrick);

    const flyAshKg = Math.round((rec.flyAsh / 100) * totalMassKg);
    const limeKg = Math.round((rec.lime / 100) * totalMassKg);
    const gypsumKg = Math.round((rec.gypsum / 100) * totalMassKg);
    const cementKg = Math.round((rec.cement / 100) * totalMassKg);
    const sandKg = totalMassKg - (flyAshKg + limeKg + gypsumKg + cementKg);
    const waterLiters = Math.round(totalMassKg * 0.14);

    return {
      recommendedCandidate: rec,
      allParetoCandidates: DEMO_CANDIDATE_SOLUTIONS,
      batchSheet: {
        unitsPerBatch,
        flyAshKg,
        limeKg,
        gypsumKg,
        cementKg,
        sandKg,
        waterLiters,
        waterBinderRatio: 0.14,
        totalBatchWeightKg: totalMassKg,
        brickDimensionsMm: '230 x 110 x 70',
        embodiedCarbonReduction: rec.co2,
      },
      searchSpaceEvaluatedCount: 1420,
      solverType: 'NSGA-II Multi-Objective Evolutionary Algorithm (Demo)',
      isDemoSimulation: true,
    };
  },
};

// ============================================================================
// 6. Explainability Service (POST /api/explain)
// ============================================================================
export const explainabilityService = {
  async explainPrediction(request: ExplainRequest): Promise<ExplainResponse> {
    if (!apiClient.isMockEnabled()) {
      return apiClient.post<ExplainRequest, ExplainResponse>('/api/explain', request);
    }

    await delay(300);

    return {
      target: request.target,
      baselineMean: 15.2,
      features: [
        {
          featureName: 'Hydrated Lime % (CaO source)',
          shapValue: +3.4,
          relativeImpact: 'positive',
          description: 'Primary alkaline activator triggering pozzolanic C-S-H formation.',
        },
        {
          featureName: 'Water/Binder Ratio',
          shapValue: -2.1,
          relativeImpact: 'negative',
          description: 'Excess free water creates capillary voids that reduce dry compressive strength.',
        },
        {
          featureName: 'Phospho-Gypsum % (Sulfate activator)',
          shapValue: +1.8,
          relativeImpact: 'positive',
          description: 'Supplies sulfate ions for early ettringite micro-structural bridging.',
        },
        {
          featureName: 'Class F Fly Ash % (Silica/Alumina donor)',
          shapValue: +1.2,
          relativeImpact: 'positive',
          description: 'Provides long-term pozzolanic glass dissolution and micro-filler matrix densification.',
        },
      ],
      method: 'TreeSHAP Attribution (Demo Surrogate)',
      isDemoExplanation: true,
    };
  },
};
