# Contributing to FlyAsh Intel

Thank you for contributing to the **FlyAsh Intel** research project. This document outlines lightweight guidelines and conventions tailored for our student engineering team.

---

## 1. Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SwayamMandhani06/flyash-brick-ai.git
   cd flyash-brick-ai
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Local Environment**:
   ```bash
   cp .env.example .env.local
   ```
   *(By default, `VITE_USE_MOCK_API=true` runs the frontend in standalone prototype mode without requiring a running Python backend.)*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Validate Build & Types**:
   ```bash
   npm run build
   ```

---

## 2. Branch Naming Conventions

Use lowercase branch names prefixed with the purpose of the work:

- `feature/<feature-name>`: New workstation capability, visualization, or service (e.g., `feature/shap-explainer-view`)
- `fix/<bug-description>`: Bug fixes or responsiveness corrections (e.g., `fix/mobile-table-overflow`)
- `refactor/<component-or-module>`: Code restructuring without altering functionality (e.g., `refactor/api-client-service`)
- `docs/<topic>`: Documentation, schema updates, or research references (e.g., `docs/add-citation-links`)

---

## 3. Commit Expectations

- Write concise, imperative commit messages:
  - `Add interactive Pareto convergence visualizer`
  - `Fix horizontal scroll overflow in benchmark table on mobile`
  - `Centralize demo datasets into src/data/demo/`
- Avoid monolithic commits. Group related changes logically.
- Never commit secrets, local `.env` files, or large raw binary PDFs directly to git.

---

## 4. Code Standards & Quality Checks

Before submitting a Pull Request or pushing to `main`:

1. **Type Safety**: Run `npm run build` to ensure `tsc -b` completes with 0 errors.
   - Respect `verbatimModuleSyntax: true` (`import type { ... }` for pure type imports).
   - Ensure zero unused local variables or imports (`noUnusedLocals: true`).
2. **Linting**: Run `npm run lint` (`oxlint`) to catch syntax and React hook issues.
3. **No Fabricated Claims**: Ensure any demonstrator outputs or mock values are clearly labeled as `Demo`, `Sample`, or `Illustrative`. Do not commit fabricated experimental findings as confirmed research achievements.
4. **Accessibility**: Verify `:focus-visible` outlines, accessible button labels, and responsive layout across mobile and desktop.

---

## 5. Pull Requests & Code Review

1. Push your branch to GitHub and open a Pull Request against `main`.
2. Provide a brief summary of:
   - What was added or changed.
   - How it was tested (browser sizes, build status).
   - Any dependencies or schema changes introduced.
3. Obtain review and sign-off from at least one peer before merging.
4. Update `CHANGELOG.md` when introducing user-facing additions or major milestones.
