# Vendor Lifecycle Management Portal

This repository now contains a maintainable MVP foundation for the portal you described:

- vendor onboarding with tracked document uploads
- admin-managed onboarding template packs for vendors to download and reupload
- dual approval by `admin` and `approver`
- admin-only job request creation
- category-based quote collection for verified vendors
- job completion form uploads
- invoice submission only after completion approval
- email reminder and alert planning
- future-ready hooks for Microsoft SSO, Google SSO, and SAP ByDesign

## Why this stack

- `Next.js + TypeScript`: one modular codebase for pages, APIs, and future backend logic
- `PostgreSQL + Prisma`: fast, scalable, and easy to reason about
- `Auth.js` path planned for Microsoft, Google, and email magic link sign-in
- Supabase Storage or local dev uploads for onboarding, completion, and invoice files

## What is implemented now

- branded landing page with your uploaded-logo-inspired mark
- role preview dashboards:
  - `/dashboard/admin`
  - `/dashboard/vendor`
  - `/dashboard/approver`
  - `/dashboard/internal-control-reviewer`
- Auth.js login scaffold at `/login`
- architecture page at `/architecture`
- database-backed portal API with sample fallback at `/api/portal`
- onboarding template API at `/api/onboarding/templates`
- domain types and workflow logic under `src/lib`
- Prisma schema, initial migration, and seed flow under `prisma/`
- environment template in `.env.example`

## Local run

```bash
npm install
npm run prisma:generate
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database setup

The app now includes a Prisma 7 database layer plus a seed script that mirrors the sample portal data.

```bash
cp .env.example .env
# update DATABASE_URL to your PostgreSQL instance
npm run db:push
npm run db:seed
```

If PostgreSQL is not reachable yet, the dashboards and `/api/portal` fall back to the built-in sample snapshot so local preview work can continue.

## Dev auth

For local development, the repo now supports a seeded-email Auth.js login flow at `/login`.

- Set `AUTH_DEV_ALLOW_EMAIL_LOGIN="true"` in `.env`
- Sign in with one of the seeded users after `npm run db:seed`
- Real Google, Microsoft Entra ID, and email magic-link providers can be enabled later with their secrets

## File uploads

The onboarding forms now support real browser file uploads.

- With `SUPABASE_SERVICE_ROLE_KEY` plus `NEXT_PUBLIC_SUPABASE_URL`, files are stored in Supabase Storage
- Without those storage env vars, uploads fall back to local files under `public/uploads` so you can test immediately on localhost
- `STORAGE_BUCKET` defaults to `portal-files`

## Suggested production next steps

1. Add real authentication with Microsoft Entra ID, Google, and email magic links.
2. Extend the same upload flow to completion forms and invoices.
3. Add write-side database mutations for onboarding, quotes, assignments, completions, and invoices.
4. Wire email delivery for onboarding reminders, quote alerts, assignment notices, and invoice unlock notifications.
5. Add a later SAP ByDesign adapter once the core workflow is live.

## Notes

- The current build is intentionally a clean starter, not yet a production-complete system.
- Prisma now powers live reads when `DATABASE_URL` is configured; the sample dataset remains as a safe preview fallback.
- The internal control reviewer role is modeled as an oversight and exception-monitoring role because your requirements did not make it a mandatory approval gate.
