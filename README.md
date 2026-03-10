# Vendor Lifecycle Management Portal

This repository now contains a maintainable MVP foundation for the portal you described:

- vendor onboarding with tracked document uploads
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
- blob storage path planned for uploaded onboarding, completion, and invoice files

## What is implemented now

- branded landing page with your uploaded-logo-inspired mark
- role preview dashboards:
  - `/dashboard/admin`
  - `/dashboard/vendor`
  - `/dashboard/approver`
  - `/dashboard/internal-control-reviewer`
- architecture page at `/architecture`
- sample portal API at `/api/portal`
- domain types and workflow logic under `src/lib`
- Prisma schema draft under `prisma/schema.prisma`
- environment template in `.env.example`

## Local run

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Suggested production next steps

1. Add real authentication with Microsoft Entra ID, Google, and email magic links.
2. Connect Prisma to PostgreSQL and create migrations from `prisma/schema.prisma`.
3. Add document upload storage for onboarding forms, completion forms, and invoices.
4. Replace sample data with database-backed queries and mutations.
5. Wire email delivery for onboarding reminders, quote alerts, assignment notices, and invoice unlock notifications.
6. Add a later SAP ByDesign adapter once the core workflow is live.

## Notes

- The current build is intentionally a clean starter, not yet a production-complete system.
- The internal control reviewer role is modeled as an oversight and exception-monitoring role because your requirements did not make it a mandatory approval gate.
