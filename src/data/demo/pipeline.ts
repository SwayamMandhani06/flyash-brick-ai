import type { PipelineStageInfo } from '../../types/pipeline';

/**
 * FlyAsh Intel — Intelligence Pipeline Stage Specifications
 * 
 * Formal methodological stages defined in the approved research project synopsis:
 * 1. Literature Extraction Engine
 * 2. Data Standardization & Validation Engine
 * 3. Unified Benchmark Dataset
 * 4. Adaptive AI Prediction Engine
 * 5. Manufacturing Optimization Engine
 * 6. Decision Support & Formulation Guidance
 */
export const DEMO_PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'stage-literature',
    stepNumber: '01',
    title: 'Literature Data Extraction',
    shortTitle: 'Research Papers',
    subtitle: 'Automated table extraction and schema normalization from published empirical papers',
    description: 'Ingests academic PDFs from civil and materials engineering literature. Scans experimental mix design tables, parses multi-column batch proportions, and standardizes multi-author notations into structured JSON records.',
    status: 'active',
    sampleMetrics: [
      { label: 'Target Domain', value: 'FaL-G & Lime-Ash', unit: 'materials scope' },
      { label: 'Extraction Mode', value: 'Table OCR + Layout', unit: 'spatial heuristics' },
      { label: 'Ingestion Status', value: 'Demo Prototype', unit: 'simulated' }
    ],
    schemaFields: ['Paper DOI', 'Authors & Year', 'Raw Mix Proportions', 'Reported Curing Protocol', 'Testing Method'],
    scientificReference: 'Methodology: Heuristic Table Detection & Cell Token Mapping'
  },
  {
    id: 'stage-standardization',
    stepNumber: '02',
    title: 'Standardization & Validation',
    shortTitle: 'Document AI & ETL',
    subtitle: 'Constituent stoichiometry mapping and compliance validation against Indian Standards',
    description: 'Normalizes disparate units (wt%, dry mass ratios, g/kg) into a canonical dry mass percentage space. Enforces chemical mass balance constraints (Σ = 100%) and checks boundary limits against IS 3812 and IS 12894.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Standard Schema', value: '12 Canonical Fields', unit: 'mass balance' },
      { label: 'Sanity Rules', value: 'IS 3812 & IS 12894', unit: 'standard baseline' },
      { label: 'Validation Protocol', value: 'Deterministic', unit: 'stoichiometric' }
    ],
    schemaFields: ['Fly Ash (Class F)', 'Hydrated Lime %', 'Phospho-Gypsum %', 'OPC Clinker %', 'Water/Binder Ratio', 'Aggregate %'],
    scientificReference: 'IS 3812:2013 (Part 1) / IS 12894:2002'
  },
  {
    id: 'stage-dataset',
    stepNumber: '03',
    title: 'Intelligent Benchmark Dataset',
    shortTitle: 'Benchmark Dataset',
    subtitle: 'Unified open experimental benchmark corpus for fly ash masonry research',
    description: 'A curated, standardized, and version-controlled dataset consolidating isolated experimental findings across civil engineering publications into an open baseline for machine learning benchmarks.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Curated Formulations', value: '18 Demo Records', unit: 'standardized mixes' },
      { label: 'Binder Systems', value: 'FaL-G & Hybrid OPC', unit: 'chemistries' },
      { label: 'Target Properties', value: 'Strength & Absorption', unit: 'dual outputs' }
    ],
    schemaFields: ['Record UID', 'Constituent Proportions (Dry %)', 'Curing Regimen (Days)', 'Compressive Strength (MPa)', 'Water Absorption (%)'],
    scientificReference: 'FlyAsh Intel Canonical Corpus v0.1 (Demo)'
  },
  {
    id: 'stage-prediction',
    stepNumber: '04',
    title: 'Adaptive AI Quality Prediction',
    shortTitle: 'Prediction Engine',
    subtitle: 'Multi-target surrogate models forecasting compressive strength gain and water absorption',
    description: 'Planned ensemble regression architectures (Random Forests, Gradient Boosted Trees, Artificial Neural Networks) designed to model non-linear hydration kinetics and forecast 28-day performance from raw batch inputs.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Model Families', value: 'RF, XGBoost, ANN', unit: 'planned ensemble' },
      { label: 'Evaluation Metrics', value: 'RMSE, MAE, R²', unit: 'training targets' },
      { label: 'Explainability', value: 'SHAP Attribution', unit: 'planned framework' }
    ],
    schemaFields: ['Input Feature Vector (X)', 'Predicted Compressive Strength (y1)', 'Predicted Water Absorption (y2)', 'IS 12894 Class'],
    scientificReference: 'Methodology: Multi-Output Surrogate Regression'
  },
  {
    id: 'stage-optimization',
    stepNumber: '05',
    title: 'Manufacturing Mix Optimizer',
    shortTitle: 'Optimization',
    subtitle: 'Constrained Pareto optimization balancing waste utilization, cost, and structural resistance',
    description: 'Multi-objective evolutionary algorithms (NSGA-II) and Bayesian Optimization exploring the feasible formulation space to synthesize viable factory batch sheets that meet building code targets while minimizing clinker consumption.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Optimization Core', value: 'NSGA-II / Bayesian', unit: 'multi-objective' },
      { label: 'Objective Functions', value: 'Max FA %, Min Carbon', unit: 'sustainability' },
      { label: 'Constraints', value: 'Strength ≥ Code Limit', unit: 'IS 12894 target' }
    ],
    schemaFields: ['Target Engineering Class', 'Maximum Absorption Limit', 'Clinker Policy', 'Batch Proportions (kg/pan)'],
    scientificReference: 'Methodology: Constrained Non-Dominated Sorting'
  },
  {
    id: 'stage-decision',
    stepNumber: '06',
    title: 'Manufacturing Decision Support',
    shortTitle: 'Decision Support',
    subtitle: 'Actionable batch prescriptions and environmental impact accounting for brick plants',
    description: 'Translates theoretical Pareto-optimal vectors into plant-floor batching recipes, prescribing exact pan mixer weights, optimal water dosage, and verified embodied carbon savings compared to traditional burnt clay bricks.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Output Format', value: 'Pan Mixer Batch Sheet', unit: 'kg per 500 units' },
      { label: 'Ecological Metric', value: 'Embodied Carbon', unit: 'CO₂ reduction' },
      { label: 'Code Conformance', value: 'IS 12894 Reference', unit: 'masonry standard' }
    ],
    schemaFields: ['Batch Sheet PDF', 'Component Mass Balance', 'Curing Schedule', 'Sustainability Ledger'],
    scientificReference: 'Application: Factory Plant Decision Support'
  }
];

export const PIPELINE_STAGES = DEMO_PIPELINE_STAGES;
