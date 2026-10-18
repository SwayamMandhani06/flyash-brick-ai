# Project Competition, Exhibition & Dissemination Tracking

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 19.3 — Competition participation; Section 22.2 — Academic and external deliverables)
**Current Status:** `Planned / Entry Materials Prepared` (Pre-Registration)

---

## 1. Targeted Competitions & Review II Alignment

In accordance with the project review rubric, entering a recognized student technical competition, innovation hackathon, or engineering exhibition is a required external milestone:

| Competition / Event | Organizing Body | Theme / Category | Alignment with Project | Target Timeline | Status |
|---|---|---|---|---|---|
| **Smart India Hackathon (SIH)** | Ministry of Education & AICTE, Govt. of India | Clean & Green Tech / Sustainable Infrastructure | Fits industrial byproduct valorization, circular economy, and AI-guided sustainable masonry. | Annual Cycle | **Entry Materials Prepared** |
| **INAE Youth Conclave** | Indian National Academy of Engineering | Sustainable Engineering & Waste-to-Wealth | Demonstrates materials informatics and empirical optimization for civil infrastructure. | National Conclave | **Identified / Under Review** |
| **National Civil Engineering Convention (ISTE)** | Indian Society for Technical Education | Green Construction Materials & Automation | Directly showcases automated literature standardization and IS 12894 code compliance checks. | Regional/National Expo | **Identified / Under Review** |

---

## 2. Prepared Competition Submission Materials

### 2.1 Executive Project Abstract (Word Count: 198 words)
> Rapid industrialization generates over 270 million tons of coal fly ash annually in India, posing severe disposal and environmental hazards. While fly ash bricks offer a low-carbon alternative to fertile clay topsoil bricks, commercial adoption is hindered by raw ash variability and trial-and-error plant batching. **FlyAsh Intel** is an end-to-end materials informatics platform designed to standardize published experimental literature, predict mechanical and durability performance with XGBoost regression, and optimize mix formulations under civil engineering standards (IS 12894:2002). The system ingests research papers via cryptographic PDF and CSV curation, normalizes mix proportions under a canonical schema, and executes paper-grouped cross-validation (`GroupKFold`) to eliminate laboratory memorization. Local additive feature attributions are computed via TreeSHAP to interpret binder sensitivity without unsubstantiated causal claims. An integrated multi-objective bounded search optimizer identifies non-dominated Pareto formulations balancing 28-day compressive strength ($\ge 3.5 - 10\text{ MPa}$), water absorption ($\le 20\%$), and maximum ash replacement ($40 - 80\%$). Built with React 19 and FastAPI with 137 passing automated tests, FlyAsh Intel transforms fragmented research into actionable, quality-controlled masonry manufacturing candidates.

### 2.2 10-Slide Presentation Deck Outline
1. **Slide 1: Title & Author Team:** Project title, student names, department, institutional affiliation, and faculty guide.
2. **Slide 2: Problem Statement:** The 270 MT annual coal ash challenge; fertile clay topsoil depletion; raw-material variability bottlenecks.
3. **Slide 3: Approved Objectives:** The three baseline objectives (Extraction, XGBoost Prediction, Constrained Optimization).
4. **Slide 4: System Architecture:** Decoupled React + FastAPI + SQLite topology; raw extraction vs human curation.
5. **Slide 5: Research Ingestion & Provenance:** Curation via `pdfplumber` and batch CSV; null preservation; no zero-fabrication.
6. **Slide 6: Machine Learning Pipeline:** Dual-target XGBoost regressors; paper-grouped `GroupKFold`; reference mean baseline comparator.
7. **Slide 7: TreeSHAP Explainability:** Local additive sensitivity attribution; chemical kinetics boundary disclaimer.
8. **Slide 8: Constrained Pareto Optimization:** FaL-G vs Cement–Fly Ash constraints; dry mass balance; Pareto non-domination.
9. **Slide 9: Scientific Integrity & Fail-Closed Gates:** Operational readiness thresholds; 137 automated tests; strict refusal to fabricate data.
10. **Slide 10: Conclusion & Handover:** Software readiness; deployment runbook; roadmap to empirical laboratory validation under IS 3495.

### 2.3 5-Minute Live Interactive Demonstration Script
- **Minute 1: Ingestion & Curation:** Upload sample research PDF or curated CSV batch in `DatasetPage`; demonstrate non-destructive duplicate detection and automated dry mass balance calculation.
- **Minute 2: Human Review & Audit Trail:** Correct constituent fractions in `ResearcherCurationPanel`; show that status auto-reverts to `needs_review` with permanent entries in `review_history`.
- **Minute 3: Readiness Gating Diagnostics:** Demonstrate live `/api/datasets/readiness` endpoint showing fail-closed gating (`unsupported_insufficient_data`) when literature records are insufficient.
- **Minute 4: Surrogate Prediction & IS 12894 Check:** Input proposed mix parameters in `PredictionPage`; display instant structural minimum class check and fail-closed notice on untrained models.
- **Minute 5: Pareto Optimization Workstation:** Configure target compressive strength in `OptimizationPage`; display candidate ranking cards and mandatory physical validation disclaimers.

---

## 3. Dissemination & Submission Integrity Record

> [!NOTE]
> **Honest Reporting Notice:**
> The project entry materials above have been compiled and verified in Phase 12. As of this report:
> - The project is **not** registered or submitted to any competition.
> - No entry fees have been disbursed and no competition organizers have processed an application.
> - **Zero awards, rankings, or shortlists are claimed.** Winning is never guaranteed or promised.
