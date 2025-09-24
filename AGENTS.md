# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and route handlers.
- `src/components` and `components/`: shared React UI (feature wrappers vs. design primitives).
- `src/lib` and `lib/`: Supabase clients, providers, server utilities—extend helpers before adding new modules.
- `tests/`, `playwright.config.ts`, and `test-results/`: Playwright suites and artifacts; `coverage/` stores Vitest reports.
- `supabase/`: local migrations and auth scripts; `scripts/` holds maintenance utilities.
- `docs/`, `QUICK_START.md`, `TROUBLESHOOTING_AUTH.md`: update whenever behavior or setup steps change.

## Build, Test, and Development Commands
- `npm run dev`: Turbopack dev server with middleware hot reload.
- `npm run build` → `npm run start`: production build plus preview server.
- `npm run lint`, `npm run type-check`: ESLint (`eslint.config.mjs`) and strict TypeScript gates.
- `npm run test:run`, `npm run test:coverage`: Vitest unit suites with optional coverage.
- `npm run test:e2e[:chromium|:ui|:debug]`: Playwright smoke, headed, or UI runner; install browsers via `npm run test:install`.
- `npm run test:ci`: combined coverage + Chromium E2E parity with CI.

## Coding Style & Naming Conventions
- Use TypeScript across React components; prefer server components in `app/` when possible.
- Prettier enforces two-space indent, double quotes, trailing commas, and import/Tailwind sorting (`.prettierrc.json`). Run `npx prettier . --write` or enable on-save formatting.
- Co-locate hooks under `src/hooks`, utilities under `utils/`, and name files with kebab-case (e.g., `chat-panel.tsx`).
- Keep Tailwind class lists tidy; reuse variants from `components/common` and `components/ui` before inventing new ones.

## Testing Guidelines
- Unit tests live beside source as `*.spec.ts[x]` or in `tests/` when shared; cover Supabase edge cases.
- New Playwright journeys go in `tests/e2e`; prefer `data-test` selectors to avoid brittle class hooks.
- Visual checks belong in `tests/visual`; update baselines only when intentional and document the change.
- Run `npm run test:coverage` before review and call out notable gaps in the PR description.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commit prefixes (`feat`, `fix`, `style`, `chore`, etc.) per recent history.
- Squash WIP commits and keep each change focused.
- PRs must include: summary, test plan (commands executed), screenshots or GIFs for UI tweaks, linked issue/ticket, and notes on env/config updates.
- Flag Supabase-sensitive changes for maintainer review and list any follow-up actions.
