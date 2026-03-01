# E2E Smoke Tests

This project uses Playwright for end-to-end smoke coverage.

## Setup

1. Install dependencies:
   - `npm install`
2. Install Playwright browser:
   - `npx playwright install chromium`

## Environment

Set credentials for smoke auth flow:

- `OPP_E2E_EMAIL`
- `OPP_E2E_PASSWORD`

Optional:

- `E2E_BASE_URL` (defaults to `http://localhost:3000`)

## Run

- Headless: `npm run test:e2e`
- Headed: `npm run test:e2e:headed`
- UI mode: `npm run test:e2e:ui`

If credentials are not set, the auth smoke test is skipped by design.
