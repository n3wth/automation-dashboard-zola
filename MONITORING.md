# Monitoring & Observability

This document outlines the monitoring and observability system implemented in the Next.js automation dashboard.

## 1. Real-time Error Tracking (Sentry)

- **Service:** [Sentry](https://sentry.io/)
- **Configuration:**
  - `sentry.client.config.ts`: Client-side Sentry initialization.
  - `sentry.server.config.ts`: Server-side Sentry initialization.
  - `sentry.edge.config.ts`: Edge function Sentry initialization.
  - `next.config.ts`: Webpack plugin configuration for source map uploading.
- **Environment Variables:**
  - `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry project DSN.
- **Features:**
  - Automatic error capturing (client and server).
  - Performance monitoring (Web Vitals).
  - Session replay.

## 2. User Journey Analytics (PostHog)

- **Service:** [PostHog](https://posthog.com/)
- **Configuration:**
  - `app/providers/posthog-provider.tsx`: PostHog provider to initialize the SDK and handle user identification.
  - `app/layout.tsx`: The provider is wrapped around the entire application.
- **Environment Variables:**
  - `NEXT_PUBLIC_POSTHOG_KEY`: Your PostHog project API key.
  - `NEXT_PUBLIC_POSTHOG_HOST`: Your PostHog instance host.
- **Features:**
  - User identification and tracking.
  - Custom event tracking (can be extended).
  - Funnels, paths, and other product analytics features.

## 3. AI Model & Database Usage Tracking

- **Database Table:** `monitoring`
- **Logic:**
  - `lib/monitoring.ts`: `trackEvent` function to record events.
  - Events are tracked for:
    - User logins (`USER_LOGIN`).
    - AI model usage (`AI_MODEL_USAGE`).
- **Extensibility:** The `MonitoringEvent` enum and `trackEvent` function can be extended to track other events.

## 4. Database Performance Monitoring

- **Health Check:** The `/api/health` endpoint now checks the database connection status.
- **Slow Query Logging:** (Not implemented, but can be added) You can extend the Supabase client to log slow queries.

## 5. Automated Alerting System

- **Script:** `scripts/monitoring-check.ts`
- **Setup:**
  1. Install `ts-node`: `npm install -g ts-node`
  2. Set up your environment variables (e.g., in a `.env` file).
  3. Run the script: `ts-node scripts/monitoring-check.ts`
- **Cron Job:** This script can be configured to run as a cron job to perform regular checks.
  ```bash
  # Example cron job to run every hour
  0 * * * * ts-node /path/to/your/project/scripts/monitoring-check.ts
  ```
- **Features:**
  - Checks for database connection health.
  - Placeholder for checking error spikes.
  - Checks for unusual AI model usage.

## 6. Health Check Endpoint

- **Endpoint:** `/api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "...",
    "uptime": "...",
    "database": "ok"
  }
  ```

## 7. Metrics Dashboard

- **Page:** `/dashboard/monitoring`
- **Features:**
  - Displays real-time system status and uptime.
  - Shows total events and active users in the last 24 hours.
  - Visualizes AI model usage with a bar chart.
  - Shows events over time with a line chart.
- **API Endpoints:**
  - `/api/monitoring/health`: System health.
  - `/api/monitoring/usage`: Usage statistics.
  - `/api/monitoring/models`: AI model usage data.
