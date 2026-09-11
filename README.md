# FlyAsh Intel

<div align="center">

### AI-Driven Intelligent Benchmark Dataset and Adaptive Optimization Framework for Sustainable Fly Ash Brick Manufacturing

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Standard: IS 12894](https://img.shields.io/badge/Standard-IS%2012894%3A2002-059669)](https://www.services.bis.gov.in/)
[![UN SDG 9 & 12](https://img.shields.io/badge/UN%20SDG-9%20%7C%2012-10B981)](https://sdgs.un.org/goals)

*An academic research and engineering platform designed to transform fragmented fly ash brick literature into a standardized benchmark corpus, evaluate multi-target predictive surrogate models, and optimize factory manufacturing mix formulations.*

[Live Platform](#getting-started) • [Architecture](#system-architecture) • [Modules](#platform-modules) • [Dataset Schema](#benchmark-dataset-schema) • [Research Team](#project-team)

</div>

---

## Table of Contents
- [Project Overview](#project-overview)
- [Research Motivation & Background](#research-motivation--background)
- [Core Objectives](#core-objectives)
- [System Architecture](#system-architecture)
- [Platform Modules](#platform-modules)
- [Current Implementation Status](#current-implementation-status)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Deployment on Vercel](#deployment-on-vercel)
- [Environment Variables](#environment-variables)
- [Demo Data & Prototype Disclaimers](#demo-data--prototype-disclaimers)
- [Research Methodology](#research-methodology)
- [Machine Learning & Optimization Direction](#machine-learning--optimization-direction)
- [Benchmark Dataset Schema](#benchmark-dataset-schema)
- [Research References & Standards](#research-references--standards)
- [Academic Context & SDG Alignment](#academic-context--sdg-alignment)
- [Project Team](#project-team)
- [License & Intellectual Property](#license--intellectual-property)

---

## Project Overview

In civil engineering and sustainable construction materials, pulverized coal fly ash serves as a critical industrial byproduct substitute for clay topsoil and carbon-intensive Portland cement. However, broad industrial adoption is hindered by significant practical challenges:

- **Raw-Material Variability**: Fly ash characteristics (amorphous reactive silica, unburnt carbon loss-on-ignition, calcium oxide content, fineness) vary substantially across thermal power plant sources and combustion batches.
- **Fragmented Research Literature**: Decades of experimental laboratory studies on fly ash-lime-gypsum (FaL-G) and hybrid alkali-activated formulations remain trapped in unstructured PDF tables with non-uniform reporting notations (dry weight fractions, mass per batch, volumetric ratios).
- **Trial-and-Error Mix Design**: Brick manufacturing plants typically rely on empirical rules-of-thumb, resulting in unpredictable 28-day compressive strength and high water absorption rates that risk structural non-conformance under building standards.

**FlyAsh Intel** addresses these challenges through an integrated computational workflow: extracting empirical research records from publications, standardizing them into a canonical benchmark dataset, utilizing surrogate predictive models to forecast mechanical behavior, and applying multi-objective Pareto optimization to prescribe factory-feasible batching recipes.

---

## Research Motivation & Background

Conventional fired clay brick manufacturing consumes billions of tonnes of fertile agricultural topsoil annually and burns vast quantities of coal in traditional kilns, emitting substantial greenhouse gases ($CO_2$) and particulate air pollution. While fly ash bricks offer a zero-clinker or low-carbon alternative, industrial manufacturers face recurring quality-control bottlenecks:

1. **Inconsistent Pozzolanic Reactivity**: Differences between Class F (low-calcium) and Class C (high-calcium) fly ash change ambient hydration kinetics and setting times.
2. **Data Sparsity & Lack of Unified Baselines**: Civil engineering lacks an open-access, standardized benchmark dataset for computational machine learning benchmarks in masonry units.
3. **Multi-Objective Trade-Offs**: Maximizing industrial ash utilization often conflicts with demolding strength requirements, water permeability thresholds, and material costs.

FlyAsh Intel bridges materials informatics with modern software engineering to provide systematic, data-driven decision support for sustainable masonry production.

---

## Core Objectives

In accordance with the approved research project synopsis, the platform pursues four central objectives:

1. **AI-Assisted Data Extraction & Standardization**: Develop an intelligent ingestion pipeline that extracts experimental mix designs, curing protocols, and mechanical test results from unstructured scientific publications and normalizes them under canonical units.
2. **Unified Benchmark Dataset**: Curate, validate, and maintain an open-access experimental benchmark corpus adhering to Indian Standards (IS 12894:2002 and IS 3812 Part 1) and ASTM specifications.
3. **Adaptive Surrogate Modeling**: Develop and evaluate multi-target machine learning regressors to forecast 28-day compressive strength and 24-hour water absorption directly from raw constituent proportions.
4. **Manufacturing Mix Optimization**: Formulate constrained Pareto optimization algorithms that synthesize cost-effective, code-conforming batch sheets maximizing fly ash utilization for plant pan mixers.

---

## System Architecture

```mermaid
flowchart TD
    subgraph ResearchPipeline ["Empirical Research Pipeline"]
        A[Published Academic Papers] --> B[01 Literature Extraction Engine]
        B --> C[Data Standardization & Validation]
        C --> D[02 Canonical Benchmark Dataset]
        D --> E[03 Adaptive AI Prediction Engine]
        E --> F[04 Manufacturing Mix Optimizer]
        F --> G[Plant Batch Prescription & Decision Support]
    end

    subgraph SoftwareArchitecture ["Software Architecture & Decoupling"]
        UI[Frontend UI / Workstation Suite<br><i>React 19 + TypeScript + Vite</i>]
        SVC[Service Abstraction Layer<br><i>src/lib/api/services.ts</i>]
        API[API Gateway / Router<br><i>FastAPI Endpoints</i>]
        BE[Python Analytical Core<br><i>Planned ML & Optimization Modules</i>]

        UI --> SVC
        SVC -.->|Development / Demo Mode| MOCK[(Centralized Demo Data<br>src/data/demo/)]
        SVC -->|Production Mode| API
        API --> BE
    end
```

> **Architecture Note**: The frontend interface, design system, and workstation prototypes are fully implemented in this repository. The Python backend services, OCR table detection models, and ML training pipelines are planned for subsequent phases. The frontend includes a formal service abstraction layer (`src/lib/api/`) ready for backend connection.

---

## Platform Modules

### 01. Literature Data Extraction Engine
- **Purpose**: Ingests unstructured academic PDFs, identifies experimental tabular bounding boxes, extracts constituent numerical cells, and maps heterogeneous author terminology into standardized notation.
- **Key Capabilities**: Spatial layout heuristics, OCR cell tokenization, dry mass unit normalization ($g/\text{batch}$, $\text{wt}\%$, $\text{kg}/\text{m}^3 \rightarrow \text{dry mass } \%$), and PDF layout inspection view.

### 02. Benchmark Dataset & Validator
- **Purpose**: Curates and maintains a standardized, open-access experimental dataset with strict stoichiometric validation.
- **Key Capabilities**: 100% dry mass balance verification ($\sum \text{constituents} = 100.0\% \pm 0.1\%$), outlier detection, dual-view explorer (canonical dense table vs interactive SVG scatter plot), curing duration filtering, and CSV export.

### 03. Adaptive AI Quality Prediction Workbench
- **Purpose**: Provides real-time surrogate inference predicting 28-day Compressive Strength ($\text{MPa}$) and 24-hour Water Absorption ($\%$) from raw batch inputs.
- **Key Capabilities**: Stoichiometric slider formulation, water-to-binder ratio sensitivity, hydration kinetics curves across curing ages (3d, 7d, 14d, 28d), and IS 12894 building code classification.

### 04. Manufacturing Mix Optimizer Workstation
- **Purpose**: Solves multi-objective trade-offs between fly ash replacement ratio, cement clinker minimization, material cost, and compressive resistance.
- **Key Capabilities**: Interactive Pareto convergence frontier visualization, candidate formulation ranking, and production pan mixer batch sheets (prescribing kg per 500 modular bricks).

---

## Current Implementation Status

| Module / Component | Frontend UI | Backend / ML Core | Current Status |
|---|---|---|---|
| **Public Platform & Overview** | Complete | N/A | Available |
| **01. Literature Extraction** | Interactive Workspace | Planned (Python/LayoutLM) | Prototype (Simulated) |
| **02. Benchmark Dataset** | Complete (Table + Scatter) | Planned (PostgreSQL/API) | Available (Curated Demo Corpus) |
| **03. AI Quality Prediction** | Interactive Laboratory UI | Planned (Scikit-Learn/PyTorch) | Prototype (Heuristic Surrogate) |
| **04. Manufacturing Mix Optimizer** | Interactive Workstation | Planned (NSGA-II/DEAP) | Prototype (Pareto Frontier Simulation) |
| **Model Explainability (SHAP)** | API Contract Ready | Planned (TreeSHAP/KernelSHAP) | Architectural Interface Ready |
| **Theme System (Light/Dark)** | Complete | N/A | Available |
| **API Client Service Layer** | Complete (`src/lib/api/`) | Planned (FastAPI Backend) | Available (`VITE_USE_MOCK_API`) |
| **Vercel SPA Deployment** | Configured (`vercel.json`) | N/A | Production Ready |

---

## Technology Stack

### Frontend Foundation
- **Core Framework**: [React 19](https://react.dev/) (`react` 19.2.8, `react-dom` 19.2.8)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (`typescript` ~6.0.2 / strict type-checking)
- **Build Tool & Dev Server**: [Vite](https://vitejs.dev/) (`vite` ^8.2.2)
- **Client-Side Routing**: [React Router](https://reactrouter.com/) (`react-router-dom` ^7.18.3)
- **Iconography**: [Lucide React](https://lucide.dev/) (`lucide-react` ^1.41.0)
- **Linter & Code Quality**: [Oxlint](https://oxc.rs/) (`oxlint` ^1.79.0)
- **Styling Architecture**: Vanilla CSS Design Token System with CSS Custom Properties (zero CSS framework runtime overhead, responsive layouts, high performance)

### Planned Backend & Machine Learning Stack
- **API Framework**: Python 3.11+ / FastAPI
- **Data Engineering**: Pandas, NumPy, Pydantic v2
- **Document Extraction**: PDFPlumber, OpenCV, Tesseract OCR / LayoutLM
- **Machine Learning**: Scikit-learn, XGBoost, PyTorch
- **Optimization**: DEAP (Distributed Evolutionary Algorithms in Python), SciPy, Optuna
- **Model Explainability**: SHAP (SHapley Additive exPlanations)

---

## Repository Structure

```text
flyash-brick-ai/
├── public/                     # Static web assets and icons
├── src/
│   ├── assets/                 # SVGs and branding media
│   ├── components/
│   │   ├── common/             # Reusable UI primitives (Button, GlassPanel, Stepper, State Indicators)
│   │   ├── dataset/            # Dataset table and SVG ScatterPlotVisualizer
│   │   ├── hero/               # Hero typography & InteractivePipeline visualizer
│   │   ├── layout/             # Navbar, Footer, AppShell workstation wrapper
│   │   ├── modules/            # Two-pillar editorial architecture overview
│   │   ├── optimization/       # ParetoConvergenceVisualizer and batch prescription views
│   │   ├── prediction/         # Prediction preview and kinetics progression
│   │   └── scroll-story/       # 7-stage editorial storytelling pipeline
│   ├── context/                # ThemeContext (Light, System, Dark)
│   ├── data/
│   │   └── demo/               # Centralized demo datasets (papers, dataset, optimization)
│   │       ├── dataset.ts      # 18 curated benchmark mixes
│   │       ├── papers.ts       # Empirical literature metadata for extraction simulation
│   │       ├── optimization.ts # Candidate populations & Pareto optimal solutions
│   │       ├── predictions.ts  # Formulation presets & surrogate heuristics
│   │       ├── pipeline.ts     # Formal research milestone specifications
│   │       └── index.ts        # Central re-export barrel
│   ├── layouts/                # PublicLayout and WorkstationLayout wrappers
│   ├── lib/
│   │   └── api/                # Service layer decoupling frontend from future backend
│   │       ├── types.ts        # Formal request/response contracts for all endpoints
│   │       ├── client.ts       # Standardized fetch client with mock mode toggle
│   │       ├── services.ts     # Extraction, validation, dataset, prediction, optimization services
│   │       └── index.ts
│   ├── pages/                  # Page route components
│   ├── types/                  # Core TypeScript domain models (FlyAshMixRecord, etc.)
│   ├── App.tsx                 # Root application routing and providers
│   ├── index.css               # Design tokens, accessibility, and theme variables
│   └── main.tsx                # Application entry point
├── .env.example                # Environment variable configuration template
├── .gitignore                  # Comprehensive version control ignore rules
├── vercel.json                 # Vercel Single Page Application rewrite rules
├── CHANGELOG.md                # Project version history
├── CONTRIBUTING.md             # Developer workflow and guidelines
├── LICENSE                     # MIT License source code notice
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript project configuration
└── vite.config.ts              # Vite configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: version 18.0 or higher recommended
- **npm**: version 9.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/SwayamMandhani06/flyash-brick-ai.git
cd flyash-brick-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env.local
```
*(By default, `VITE_USE_MOCK_API=true` is enabled, permitting standalone execution without a local Python server.)*

### 4. Start Local Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```
Runs TypeScript verification (`tsc -b`) and produces an optimized production bundle in the `dist/` directory.

### 6. Preview Production Build Locally
```bash
npm run preview
```

---

## Deployment on Vercel

The repository includes a pre-configured [`vercel.json`](vercel.json) file with Single Page Application rewrite rules to ensure seamless routing on page refreshes:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploy via GitHub Integration (Recommended)
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) using your GitHub account.
3. Select **Add New...** > **Project** and import `flyash-brick-ai`.
4. Vercel automatically detects the Vite preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. The site will be live with automatic CI/CD on subsequent pushes.

---

## Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for the future Python backend API endpoints |
| `VITE_USE_MOCK_API` | `true` | When `true`, services return client-side simulated data. Set to `false` when connecting to live backend |
| `VITE_APP_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `VITE_BENCHMARK_SCHEMA_VERSION` | `v0.1.0-canonical` | Canonical benchmark schema version tag |

---

## Demo Data & Prototype Disclaimers

Current frontend interactive features utilize curated mock data stored in `src/data/demo/`:

- `papers.ts`: Empirical research paper metadata representing published literature.
- `dataset.ts`: 18 standardized formulation records derived from published experiments.
- `optimization.ts`: Illustrative candidate vectors and non-dominated Pareto solutions.
- `predictions.ts`: Computational heuristics simulating multi-target surrogate responses.

> **Research Integrity Notice**: These values demonstrate user experience and data flow. They **must not** be interpreted as completed experimental findings or verified published model metrics. All demo outputs in the UI are visibly marked with illustrative indicators.

---

## Research Methodology

The platform models an end-to-end analytical workflow:

```text
Published Literature Sourcing (PDFs)
       ↓
Bounding-Box Table Localization & Heuristic OCR
       ↓
Constituent Token Extraction & Column Mapping
       ↓
Unit Standardization to Dry Solid Mass %
       ↓
Stoichiometric Validation (100% Mass Balance & Outlier Filtering)
       ↓
Standardized Benchmark Corpus (IS 12894 / IS 3812 Conformance)
       ↓
Multi-Target Surrogate ML Modeling (Compressive Strength & Water Absorption)
       ↓
Constrained Multi-Objective Pareto Optimization (NSGA-II)
       ↓
Factory Pan Mixer Batching Prescription
```

---

## Machine Learning & Optimization Direction

The planned analytical core encompasses:

- **Model Families**:
  - Random Forest Regression (non-linear baseline and feature interaction)
  - Gradient Boosted Decision Trees (XGBoost / LightGBM)
  - Artificial Neural Networks (Multi-Layer Perceptron for continuous response mapping)
- **Target Variables**:
  1. $y_1$: 28-day Compressive Strength ($\text{MPa}$)
  2. $y_2$: 24-hour Cold Water Absorption ($\%$ by mass)
- **Target Evaluation Metrics**:
  - Root Mean Squared Error ($\text{RMSE}$)
  - Mean Absolute Error ($\text{MAE}$)
  - Coefficient of Determination ($R^2$)
  - 10-Fold Cross-Validation
- **Interpretability Framework**:
  - SHAP (SHapley Additive exPlanations) for global constituent importance and local sample attributions.
- **Optimization Algorithms**:
  - Non-Dominated Sorting Genetic Algorithm II (NSGA-II)
  - Bayesian Optimization using Gaussian Process surrogates

---

## Benchmark Dataset Schema

The standardized benchmark dataset schema includes the following primary fields:

| Field Name | Data Type | Units / Format | Description |
|---|---|---|---|
| `paperId` | String | DOI / Citation | Unique identifier of source research publication |
| `mixId` | String | Alphanumeric | Batch formulation identifier |
| `authors` | String | Author List | Primary researchers who conducted the experiment |
| `year` | Integer | YYYY | Year of publication |
| `flyAshPercent` | Float | % by dry mass | Pulverized fuel ash fraction (Class F / Class C) |
| `cementPercent` | Float | % by dry mass | Ordinary Portland Cement (OPC) additive |
| `limePercent` | Float | % by dry mass | Hydrated lime ($\text{Ca(OH)}_2$) or quicklime activator |
| `gypsumPercent` | Float | % by dry mass | Phospho-gypsum / mineral gypsum sulfate activator |
| `sandPercent` | Float | % by dry mass | River sand / fine aggregate filler |
| `quarryDustPercent` | Float | % by dry mass | Crushed stone dust secondary aggregate |
| `waterBinderRatio` | Float | Dimensionless | Total water to solid binder ratio ($W/B$) |
| `curingDays` | Integer | Days | Curing duration prior to mechanical testing (7, 14, 28) |
| `curingType` | String | Water / Steam / Ambient | Curing environmental regimen |
| `compressiveStrength` | Float | $\text{MPa}$ | Crushing resistance under IS 3495 (Part 1) |
| `waterAbsorption` | Float | % by dry mass | 24-hour water absorption under IS 3495 (Part 2) |
| `is12894Class` | String | Class Designation | Masonry classification (Class 7.5 to Class 25) |

---

## Research References & Standards

1. **Kumar, S., & Prasad, J.** (2021). *Experimental Investigation on Pozzolanic Reactivity of Class F Fly Ash-Lime-Gypsum Bricks*. Construction and Building Materials. [DOI: 10.1016/j.conbuildmat.2021.124501](https://doi.org/10.1016/j.conbuildmat.2021.124501)
2. **Shaikh, F. U. A., et al.** (2019). *Mechanical and Durability Properties of High Volume Fly Ash Bricks with OPC Additives*. Materials and Structures (RILEM). [DOI: 10.1016/j.conbuildmat.2019.04.112](https://doi.org/10.1016/j.conbuildmat.2019.04.112)
3. **Turgut, P., & Algin, H. M.** (2020). *Steam-Cured Fly Ash-Quarry Dust Bricks for High-Strength Masonry Units*. ASCE Journal of Materials in Civil Engineering. [DOI: 10.1061/(ASCE)MT.1943-5533.0003011](https://doi.org/10.1061/(ASCE)MT.1943-5533.0003011)
4. **Bureau of Indian Standards**. *IS 12894:2002 — Pulverized Fuel Ash-Lime Bricks — Specification*.
5. **Bureau of Indian Standards**. *IS 3812 (Part 1):2013 — Pulverized Fuel Ash — Specification for Use as Pozzolana in Cement, Cement Mortar and Concrete*.
6. **Bureau of Indian Standards**. *IS 3495 (Parts 1 to 4):2019 — Methods of Tests of Burnt Clay Building Bricks*.
7. **ASTM International**. *ASTM C618 — Standard Specification for Coal Fly Ash and Raw or Calcined Natural Pozzolan for Use in Concrete*.

---

## Academic Context & SDG Alignment

This project is conducted as an academic capstone initiative within the **Department of Computer Engineering**, bridging computational computer science (applied machine learning, heuristic extraction, evolutionary multi-objective optimization) with sustainable civil engineering materials.

### United Nations Sustainable Development Goals (SDG) Alignment:
- **SDG 9: Industry, Innovation and Infrastructure** — Fostering resource-efficient industrial manufacturing through data-driven computational optimization.
- **SDG 12: Responsible Consumption and Production** — Promoting substantial reduction of topsoil consumption and carbon emissions by maximizing thermal power plant fly ash recycling in construction materials.

---

## Project Team

This project is developed as an academic capstone initiative in the **Department of Computer Engineering**:

| Team Member | Academic Program | Domain Focus |
|---|---|---|
| **Swayam Mandhani** | B.Tech Computer Engineering | Applied ML & Platform Architecture |
| **Pruthviraj Mule** | B.Tech Computer Engineering | Data Engineering & Optimization |
| **Khush Paliwal** | B.Tech Computer Engineering | ML Modeling & Evaluation |
| **Rohan Mungse** | B.Tech Computer Engineering | Pipeline Ingestion & UI/UX Engineering |

- **Institutional Department**: Department of Computer Engineering
- **Focus Area**: Applied Machine Learning, Materials Informatics, Sustainable Computing
- **Repository Maintainer**: [Swayam Mandhani](https://github.com/SwayamMandhani06)

---

## License & Intellectual Property

The source code of this software platform is released under the [MIT License](LICENSE).

> **Important Notice on Research Material & Third-Party Literature**:  
> The MIT License applies exclusively to the software source code contained in this repository. Academic research papers, publishers' copyrighted articles, citation abstracts, and any future literature-derived benchmark records remain the intellectual property of their respective authors and publishers, and may be subject to separate copyright, academic fair-use, or open-access licensing terms.
