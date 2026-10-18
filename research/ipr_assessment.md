# Intellectual Property Rights (IPR) Assessment

**Project:** XGBoost-Based Quality Prediction and Process Optimization for Sustainable Fly Ash Brick Manufacturing
**Authoritative Plan Reference:** Root `PLAN.md` (Section 19.4 — IPR assessment; Section 22.2 — Academic and external deliverables)
**Assessment Date:** October 2026
**Status:** `Assessment Completed / Software Copyright Recommended`

---

## 1. Executive Summary & Recommended Strategy

This assessment evaluates potential intellectual property protection pathways for **FlyAsh Intel** in compliance with institutional guidelines and national legal frameworks (Indian Patents Act, 1970 and Indian Copyright Act, 1957).

### Key Recommendations
1. **Primary Route — Software Copyright Registration:** Apply for statutory copyright registration for the original software codebase, database schema (`v1.0.0-canonical`), and optimization algorithms under Class: Computer Software.
2. **Patentability Assessment — Not Recommended for Software Algorithms:** Machine learning algorithms, surrogate decision trees, and mathematical candidate searches per se are statutorily excluded from patentability under Section 3(k) of the Indian Patents Act.
3. **Open-Source Research Dissemination:** Maintain the permissive **MIT License** for the core platform, promoting open academic replication and community civil engineering adoption.

---

## 2. Legal Analysis of Protection Pathways

### 2.1 Software Copyright (Indian Copyright Act, 1957)
- **Applicable Subject Matter:** Source code, backend service architecture, relational database schemas, Pydantic data models, and React UI components are recognized as original "literary works" under Section 2(o).
- **Protection Scope:** Protects the specific expression, algorithmic implementation, and structural architecture against unauthorized copying, distribution, or commercial appropriation.
- **Feasibility:** **High.** The codebase contains over 5,000 lines of original, auditable TypeScript and Python code, fully documented with 137 passing tests.
- **Action Plan:** Prepare form XIV with the institutional IP cell for copyright filing upon project completion.

### 2.2 Patentability Review (Indian Patents Act, 1970)
- **Section 3(k) Statutory Bar:**
  Section 3(k) explicitly excludes *"a mathematical method or a business method or a computer programme per se or algorithms"* from patentable subject matter.
- **Technical Effect / Technical Contribution Test:**
  Under the Indian Patent Office Guidelines for Examination of Computer-Related Inventions (CRIs), software can only be patented if it produces a demonstrable "technical effect" in conjunction with novel, non-obvious physical hardware.
- **Assessment for FlyAsh Intel:**
  The current software acts as a decision-support surrogate. It does not control physical actuators, automated brick press machinery, or real-time kilns via novel hardware interfaces. Furthermore, empirical validation data are currently pending. Therefore, filing a standalone patent application for the software algorithms would face severe rejection under Section 3(k).

### 2.3 Literature Data Rights & Database Rights
- **Factual Data Extraction:** Physical mix proportions, water ratios, and compressive strength values extracted from peer-reviewed publications constitute factual scientific observations. Factual data per se are not protected by copyright under Indian or international law.
- **Database Compilation:** The structured canonical database (`v1.0.0-canonical`) represents an original compilation resulting from intellectual selection, normalization, and quality validation.
- **Redistribution Restrictions:** Restrictive publisher-formatted PDF files and proprietary layout figures must remain stored locally (`backend/data/documents/`) and excluded from public Git repositories. Standardized factual numbers with source citations are freely publishable.

### 2.4 Open-Source Dependency & License Compatibility Check
The platform is released under the **MIT License**. All third-party libraries were audited for license compatibility:

| Component / Dependency | License | Permitted Uses | Compatibility with MIT |
|---|---|---|---|
| **FastAPI / Starlette** | MIT License | Commercial, modification, distribution | Fully Compatible |
| **React 19 / Vite** | MIT License | Commercial, modification, distribution | Fully Compatible |
| **XGBoost** | Apache-2.0 | Commercial, modification, patent grant | Fully Compatible |
| **SHAP** | MIT License | Commercial, modification, distribution | Fully Compatible |
| **SQLAlchemy 2.x** | MIT License | Commercial, modification, distribution | Fully Compatible |
| **pdfplumber** | MIT License | Commercial, modification, distribution | Fully Compatible |
| **SQLite 3** | Public Domain / Dedication | Unrestricted use | Fully Compatible |

Zero GPL/AGPL viral copyleft dependencies are incorporated into the backend or frontend architecture, ensuring unencumbered deployment.

---

## 3. Authorship & Institutional Attribution

- **Contributors:** Swayam Mandhani, Project Development Team.
- **Supervision:** Project Faculty Guide & Institutional Department of Civil Engineering.
- **Institutional Rights:** Ownership of student capstone and academic research projects is governed by institutional IP regulations. Joint institutional copyright filing is recommended.

---

## 4. Statutory Status Declaration

> [!IMPORTANT]
> **No Premature IP Claims:**
> In adherence to `PLAN.md` Section 2 and Section 19.4:
> - **No patent has been granted or applied for.**
> - **No copyright registration certificate has yet been issued.**
> - The project is accurately described as an evaluated software framework with recommended copyright registration.
