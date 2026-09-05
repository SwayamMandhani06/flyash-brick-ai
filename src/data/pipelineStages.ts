import type { PipelineStageInfo } from '../types/pipeline';

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'stage-literature',
    stepNumber: '01',
    title: 'Literature Data Extraction',
    shortTitle: 'Research Papers',
    subtitle: 'Automated table extraction and schema normalization from published empirical papers',
    description: 'Ingests academic PDFs from materials and civil engineering journals. Scans unstructured experimental matrices, parses tabular mix ratios, and standardizes multi-author terminology into machine-readable JSON records.',
    status: 'active',
    sampleMetrics: [
      { label: 'Papers Scanned', value: '42', unit: 'academic papers' },
      { label: 'Table Formats', value: '18', unit: 'heterogeneous layouts' },
      { label: 'Raw Mix Points', value: '380+', unit: 'data rows' }
    ],
    schemaFields: ['Paper DOI', 'Authors & Year', 'Raw Mix Proportions', 'Reported Curing Protocol', 'Reported Testing Method'],
    scientificReference: 'ISO/TR 24014 / Elsevier ScienceDirect API'
  },
  {
    id: 'stage-standardization',
    stepNumber: '02',
    title: 'Standardization & Validation',
    shortTitle: 'Document AI & ETL',
    subtitle: 'Constituent stoichiometry mapping and compliance validation against Indian Standards',
    description: 'Normalizes varied units (wt%, vol%, dry mass ratios) into a unified chemical-physical feature space. Enforces chemical mass balance checks, detects outliers, and validates conformity with IS 3812:2013 and IS 12894:2002.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Schema Attributes', value: '16', unit: 'standardized fields' },
      { label: 'Validation Rules', value: '24', unit: 'stoichiometric constraints' },
      { label: 'Imputation Quality', value: '98.4%', unit: 'confidence score' }
    ],
    schemaFields: ['Fly Ash Class (F/C)', 'Lime (CaO %)', 'Gypsum (CaSO4 %)', 'Cement (OPC/PPC %)', 'W/B Ratio', 'Bulk Density'],
    scientificReference: 'IS 3812:2013 Part 1 / ASTM C618'
  },
  {
    id: 'stage-dataset',
    stepNumber: '03',
    title: 'Intelligent Benchmark Dataset',
    shortTitle: 'Benchmark Dataset',
    subtitle: 'The first unified, open experimental benchmark corpus for fly ash brick research',
    description: 'A curated, deduplicated, and version-controlled dataset bridging decades of isolated laboratory testing into a single high-fidelity corpus optimized for machine learning benchmark baselines.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Total Formulations', value: '320', unit: 'standardized records' },
      { label: 'Binder Types', value: 'FaL-G, OPC, Lime', unit: 'chemistries' },
      { label: 'Target Properties', value: 'Strength & Absorption', unit: 'dual targets' }
    ],
    schemaFields: ['Record UID', 'Constituent Matrix (%)', 'Curing Regimen (Days)', 'Compressive Strength (MPa)', 'Water Absorption (%)'],
    scientificReference: 'FA-BENCH-2024 Specification'
  },
  {
    id: 'stage-prediction',
    stepNumber: '04',
    title: 'Adaptive AI Quality Prediction',
    shortTitle: 'Prediction Engine',
    subtitle: 'Multi-target surrogate models predicting 28-day strength and porosity in milliseconds',
    description: 'Ensemble regressors (Gradient Boosted Trees, Random Forests, Multi-Layer Perceptrons) trained on the benchmark dataset to accurately forecast structural compressive strength (MPa) and water absorption (%) from raw constituent batching.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Target R²', value: '0.942', unit: 'strength variance' },
      { label: 'RMSE', value: '1.18', unit: 'MPa' },
      { label: 'Inference Latency', value: '< 12', unit: 'milliseconds' }
    ],
    schemaFields: ['Predicted Compressive Strength', 'Predicted Water Absorption', 'IS 12894 Strength Class', 'Hydration Curve'],
    scientificReference: 'Multi-target Gradient Boosting Framework'
  },
  {
    id: 'stage-optimization',
    stepNumber: '05',
    title: 'Manufacturing Mix Optimizer',
    shortTitle: 'Adaptive Optimization',
    subtitle: 'Multi-objective constrained search for optimal sustainable mix formulations',
    description: 'Formulates mix design as a constrained Pareto optimization problem: maximizes industrial fly ash utilization, minimizes expensive/carbon-intensive OPC cement, while guaranteeing target compressive strength and water absorption.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Fly Ash Ratio', value: 'Up to 72%', unit: 'waste utilization' },
      { label: 'Cement Clinker', value: '0% - 5%', unit: 'near-zero clinker' },
      { label: 'CO2 Reduction', value: '64% - 82%', unit: 'vs red clay brick' }
    ],
    schemaFields: ['Constituent Recipe', 'Water-to-Solids Ratio', 'Estimated Unit Cost', 'Embodied Carbon Rating'],
    scientificReference: 'Constrained NSGA-II / Bayesian Optimization'
  },
  {
    id: 'stage-decision',
    stepNumber: '06',
    title: 'Industrial Decision Support',
    shortTitle: 'Manufacturing Decision',
    subtitle: 'Actionable batching guidelines, curing protocols, and plant feasibility validation',
    description: 'Translates theoretical Pareto-optimal mix parameters into practical production batch sheets for automated brick molding plants, accounting for aggregate moisture fluctuations, pan mixer capacity, and steam/ambient curing cycles.',
    status: 'ready',
    sampleMetrics: [
      { label: 'Compliance', value: 'IS 12894', unit: 'conforming' },
      { label: 'Batch Sheet', value: 'Auto-Generated', unit: 'kg / 1000 bricks' },
      { label: 'Demolding Time', value: '24 hrs', unit: 'operational cycle' }
    ],
    schemaFields: ['Pan Mixer Batch Weight (kg)', 'Hydraulic Compaction (MPa)', 'Curing Protocol', 'QC Checklist'],
    scientificReference: 'National Building Code of India (SP 7)'
  }
];
