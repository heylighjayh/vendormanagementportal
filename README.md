# Vendor Management Portal

This project is a lightweight vendor management portal focused on live operational work:

- vendor onboarding and document collection
- admin-managed onboarding template uploads
- vendor document submissions
- dual review by `admin` and `approver`
- role-based dashboards for admin, vendor, approver, and internal control
- file storage through Supabase Storage in production

The app UI is intentionally concise. Product-overview and architecture pages were removed so the website behaves like an active portal rather than an MVP showcase.

## Current app structure

- `/` concise portal entry page with live counts and workspace shortcuts
- `/login` role-based sign-in page
- `/dashboard/admin` admin queue, vendor setup, and onboarding template management
- `/dashboard/vendor` vendor document submission and onboarding pack
- `/dashboard/approver` approval queue
- `/dashboard/internal-control-reviewer` oversight watchlist
- `/api/portal` portal snapshot API
- `/api/onboarding/templates` onboarding template API

## Core modules

### Authentication

Auth.js handles sign-in and role-aware routing. Seeded credential login is available for development when `AUTH_DEV_ALLOW_EMAIL_LOGIN="true"`.

### Data layer

Prisma with PostgreSQL stores users, vendors, templates, submissions, approvals, jobs, and notifications.

### File uploads

Production uploads are intended for Supabase Storage. Local file storage is only used for local development.

### Dashboards

Each role gets a focused workspace:

- `admin`: create vendors, upload onboarding templates, monitor queues
- `vendor`: download templates, upload completed files, follow review status
- `approver`: handle second-line approvals
- `internal-control-reviewer`: monitor deadlines, exceptions, and control follow-up

## Stack

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Prisma 7`
- `PostgreSQL`
- `Auth.js`
- `Supabase Storage`
- `Tailwind CSS 4`

## Local run

```bash
npm install
npm run prisma:generate
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database setup

```bash
cp .env.example .env
# set DATABASE_URL
npm run db:push
npm run db:seed
```

If the database is unavailable or empty, the app can fall back to seeded sample portal data for preview purposes.

## Environment variables

Important variables used by the app:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_DEV_ALLOW_EMAIL_LOGIN`
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORAGE_BUCKET`
- provider credentials for Google or Microsoft if enabled

## Upload behavior

- On localhost, uploads can fall back to `public/uploads`
- On Vercel, uploads require Supabase storage variables to be configured
- If production storage is missing, the app now shows an inline dashboard error instead of crashing

## Notes

- The portal currently has working onboarding document upload flows for admins and vendors
- Some workflow areas still use sample snapshot data until their write paths are implemented
- Any future stack or architecture explanation should live in this README rather than inside the UI
