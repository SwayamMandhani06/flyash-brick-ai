# Changelog

All notable changes to the **FlyAsh Intel** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-05

### Added
- **Public Research Platform**:
  - Research-grade homepage featuring intentional typography and editorial layout.
  - Interactive 6-stage Intelligence Pipeline Visualizer (`Research Papers` → `Document AI` → `Benchmark Dataset` → `Quality Prediction` → `Optimization` → `Manufacturing Decision`) with hover telemetry and animated conduits.
  - 7-Stage Scroll-Driven Storytelling module detailing the data extraction to production pipeline.
  - Interactive SVG Empirical Scatter Plot (`Fly Ash Content %` vs `Compressive Strength MPa`) with live tooltip inspection, filter pills, and IS 12894 reference lines.
  - Comprehensive Research Background and Computational Methodology documentation pages.
  - Project specifications and academic attribution page.

- **Engineering Workstation Application Suite**:
  - Application Shell with live system telemetry, standard references (IS 12894 / IS 3812), and active module status chips.
  - **01 Literature Data Extraction Engine**: Document-centric workspace with empirical research paper selector, PDF OCR viewport mockup, bounding-box coordinate detection, and standardized mix matrix conversion.
  - **02 Benchmark Dataset Explorer**: Dual-view data product interface (`Dense Canonical Table` vs `Interactive Scatter Plot`), schema summary metrics, multi-parameter search/filters, and CSV export.
  - **03 AI Quality Prediction Workbench**: Model-centric laboratory interface with interactive stoichiometry sliders, dry mass balance checks, dual-target surrogate readouts (28d Strength & Absorption), and curing kinetics curves (3d, 7d, 14d, 28d).
  - **04 Manufacturing Mix Optimizer**: Engineering workstation featuring interactive objective priority toggles, target constraint sliders, Pareto convergence scatter plot, plant pan mixer batching prescription (kg per 500 bricks), and candidate formulation rankings.

- **Frontend Architecture & Design System**:
  - Design token system in CSS variables supporting Light, System, and Dark themes.
  - Deliberate Public Website vs Application Workstation navigation modes in `Navbar`.
  - Reusable component library: `Button`, `GlassPanel`, `SectionHeading`, `ProcessingStepper`, `AnimatedCounter`, `EmptyState`, `ErrorState`, `LoadingState`, `StatusIndicator`, `Breadcrumbs`, and `SkeletonLoader`.
  - Centralized demo data repository in `src/data/demo/` covering papers, benchmark records, optimization candidate vectors, and prediction heuristics.
  - Clean API service abstraction layer in `src/lib/api/` prepared for future Python (FastAPI/Flask) backend integration with mock fallback toggle (`VITE_USE_MOCK_API`).
  - Accessibility enhancements including `:focus-visible` high-contrast outlines and `@media (prefers-reduced-motion: reduce)` overrides.
  - Full responsive layout coverage across desktop (1440px/1280px), tablet (1024px/768px), and mobile (430px/390px/375px).
