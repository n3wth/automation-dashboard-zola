# Bob Quick Start Guide

This guide walks through the minimum steps required to get Bob running locally
and explains the different environment configurations used during
development, testing, and authentication flows.

---

## 1. Install dependencies

```bash
npm ci
```

> ℹ️ `npm ci` is faster and produces a clean install that matches the lockfile.

## 2. Configure environment variables

Copy the sample file and update any values you need:

```bash
cp .env.local.example .env.local
```

The default values enable **development auth**, so you can sign in without
Supabase or Google OAuth. When you are ready to integrate Supabase, flip the
`NEXT_PUBLIC_DEV_AUTH` flag to `false` and provide the Supabase + Google OAuth
credentials described at the bottom of `.env.local.example`.

### Required secrets

Even for the quick-start flow you must set:

- `CSRF_SECRET` – 32 hex characters (`openssl rand -hex 16`)
- `ENCRYPTION_KEY` – 44 character base64 string (`openssl rand -base64 32`)

These values keep session security intact even in local development.

## 3. Run the application

Start the development server on an explicit port to avoid conflicts with other
Next.js apps you might already be running:

```bash
npm run dev -- --port=3000
```

If port `3000` is in use, pick another one (for example `3001`) and update the
URLs in `.env.local` accordingly. The application logs the active port on
startup.

### Docker-based workflow

If you prefer Docker, the dev compose file maps the application to port 3001 to
avoid conflicts with existing local Next.js instances:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open [http://localhost:3001](http://localhost:3001) when using Docker.

## 4. Running tests

Bob provides ready-to-use defaults for both unit and end-to-end tests:

| Command | Purpose |
| --- | --- |
| `npm run test:run` | Vitest unit/integration suite with mocked Supabase env |
| `npm run test:e2e:chromium` | Playwright e2e tests against a dev server on port 3100 |
| `npm run lint` | ESLint static analysis |
| `npm run type-check` | TypeScript project validation |

The Playwright configuration now bootstraps its own development server on port
`3100` and injects safe placeholder environment variables. This keeps the test
suite isolated from whichever port you use for manual development.

## 5. Google OAuth + Supabase (optional)

When you switch to Supabase-backed authentication:

1. Set `NEXT_PUBLIC_DEV_AUTH=false` in `.env.local`.
2. Fill in your Supabase project URL, anon key, and service role key.
3. Configure Google OAuth credentials (Client ID + Secret) in the Google Cloud Console.
4. Add the following redirect URLs in Google Cloud:
   - `http://localhost:3000/auth/callback` (or the port you use locally)
   - `https://your-production-domain/auth/callback`
5. Update `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, and `NEXTAUTH_URL`
   to match the port/domain you plan to run on.

If you encounter a Supabase UUID error, double-check that your Supabase
migrations are up to date and that the anon/service keys belong to the same
project.

## 6. Troubleshooting checklist

- **Port already in use** – Restart the dev server with `npm run dev -- --port=<new-port>`.
- **OAuth redirect issues** – Verify callback URLs match your Google Cloud OAuth settings.
- **Tests failing due to env vars** – Ensure `.env.local` exists or rely on the
  defaults baked into `tests/setup.ts` and `playwright.config.ts`.
- **Database errors** – Confirm Supabase migrations are applied and the service
  role key is correct.

---

With these steps in place you should be able to bootstrap the dashboard, run
tests reliably, and iterate on new features without wrestling the tooling.
