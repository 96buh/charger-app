# Repository Guidelines

## Project Structure & Module Organization

- Source code lives under `app/`, `components/`, `contexts/`, and `utils/`.
  - `app/` uses Expo Router for screens and navigation.
  - `components/` contains reusable UI (e.g., `BarChart.tsx`).
  - `contexts/` holds React Context providers (e.g., `HardwareContext.tsx`).
  - `utils/` contains helpers and services (e.g., `i18n.ts`, `backgroundMonitor.ts`).
- Assets are in `assets/`. Native projects are in `android/` and `ios/`.
- Path alias `@/*` maps to the repo root (see `tsconfig.json`). Use imports like `@/contexts/HardwareContext`.

## Build, Test, and Development Commands

- `npm run start` — Launch Expo Dev server (local development).
- `npm run android` / `npm run ios` — Build and run the native app locally.
- `npm run web` — Run the web target.
- `npm run lint` — Lint using `eslint-config-expo`.
- `npm run reset-project` — Clean/reset project state (use sparingly).
- Production builds: `eas build --platform android|ios` (configure EAS first; see `eas.json`).

## Coding Style & Naming Conventions

- TypeScript-first (`.ts`/`.tsx`). Two-space indentation; semicolons optional per ESLint config.
- Components: PascalCase files and exports (e.g., `LineChart.tsx`).
- Contexts: `NameContext.tsx` exporting `NameProvider`.
- Utilities: camelCase (e.g., `backgroundMonitor.ts`).
- Use the `@` alias for internal imports; prefer absolute over relative paths.

## Testing Guidelines

- No test suite is configured yet. Recommended setup: Jest + `@testing-library/react-native`.
- Place tests alongside sources as `*.test.ts(x)`.
- Aim for coverage of hooks, context logic, and pure utilities.

## Commit & Pull Request Guidelines

- Commits: short, imperative subject; include scope when helpful (e.g., `feat(history): add charge log`).
- Branches: `feature/<topic>`, `fix/<issue>`, `chore/<task>` (e.g., `feature/background-fetch`).
- PRs: include a clear description, linked issues, screenshots/recordings for UI, and test notes.
- Keep PRs focused and small; note any follow-ups.

## Security & Configuration Tips

- Do not commit secrets or credentials. Use platform secrets for EAS builds.
- Avoid committing large binaries (e.g., APKs). Add to `.gitignore` if needed.
- Keep `eslint.config.js`, `tsconfig.json`, and `app.json` in sync with code changes.

## Charging Abnormality Detection App

- Platform: Android Mobile Application
- Goal: Receive and display charging abnormality detection data from an IoT device
- Input Data:
  - Sensor data transmitted from the IoT device
  - Device abnormality labels (label map):
    - 0 → Normal
    - 1 → Corroded Charging Cable
    - 2 → Corroded Adapter
  - Temperature abnormality state, determined by different thresholds
- Responsibilities:
  - Receive real-time data from the IoT device
  - Detect and classify charging abnormalities
  - Display abnormality information to the user (Normal / Corroded Cable / Corroded Adapter / Temperature Abnormality)
