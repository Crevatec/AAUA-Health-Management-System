# AAUA Health Management System (HMS)

A Progressive Web App for managing student, lecturer, and staff health
records at the Adekunle Ajasin University Clinic, Ibadan Campus — built
with role-based access control enforced at the database level, not just
in the UI.

## Overview

The system digitizes clinic operations end to end: patient records,
consultations, prescriptions, laboratory requests, appointment booking,
notifications, and printable PDF medical reports — each gated by role
(Administrator, Medical Staff, Student, Lecturer) through PostgreSQL Row
Level Security, so access rules hold even if someone bypasses the
frontend entirely.

As a PWA, it installs on Android, iOS, and desktop like a native app,
works offline for cached views, and requires no app-store distribution.

## Features

- **Authentication & RBAC** — email/password auth with role verification
  at login; four distinct account types, each with its own dashboard
- **Patient records** — demographics, BMI (calculated), allergies,
  chronic conditions, vaccination history
- **Clinic visits** — vitals, symptoms, diagnosis, treatment, follow-up
  scheduling, staff feedback with lifestyle/dietary/exercise recommendations
- **Medications** — prescriptions linked to visits, pharmacy dispensing log
- **Laboratory** — test requests, results entry, staff approval workflow
- **Appointments** — booking, rescheduling, cancellation, clinic-wide
  schedule view for staff
- **Notifications** — in-app inbox with both action-triggered alerts
  (booking confirmed, results ready, prescription available) and
  scheduled reminders (appointments, follow-ups, vaccinations due)
- **PDF reports** — printable, spec-compliant consultation reports and
  full patient medical history summaries
- **Admin console** — user management, faculty/department setup, audit
  log, system-wide analytics, and clinic-wide announcements
- **Profile management** — photo upload, editable contact/personal
  details, with medical fields locked to clinic staff only
- **PWA** — installable, offline-tolerant app shell, background sync-ready

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| State/data | TanStack Query, React Hook Form + Zod |
| Reports | jsPDF + autoTable |
| Charts | Chart.js |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | Netlify |

## Getting started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Clone and install
```bash
git clone https://github.com/Crevatec/AAUA-Health-Management-System.git
cd AAUA-Health-Management-System
npm install
```

### 2. Set up the database
In your Supabase project's SQL Editor, run each file in
`supabase/migrations/` **in numeric order** (0001 through 0007).

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in your Supabase project URL and anon/publishable key from
**Settings → API**:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

### 4. Run locally
```bash
npm run dev
```
Visit `http://localhost:5173`. Sign up as an Administrator first, then
any other role can self-register.

### 5. Test the installable PWA
The service worker only builds in production:
```bash
npm run build
npm run preview
```
Open the preview URL — an install prompt should appear in the browser's
address bar.

### 6. Deploy
Push to GitHub, connect the repo to [Netlify](https://netlify.com), set
build command `npm run build` / publish directory `dist`, and add the
same two `VITE_*` environment variables under Site settings. Netlify's
HTTPS URL is what makes "Add to Home Screen" work reliably on real
devices.

## Database & security model

Every table has Row Level Security enabled. Access is enforced by a
handful of SQL helper functions (`current_user_role()`, `is_admin()`,
`is_medical_staff()`, `is_self()`) rather than repeating logic per
policy — students and lecturers can only ever read their own records;
medical staff and administrators see what their role requires; audit
logs are readable by administrators only. See
`supabase/migrations/0003_row_level_security.sql` for the full policy set.

Scheduled reminder notifications (appointments, follow-ups, vaccinations)
run as Postgres functions intended to be triggered by Supabase's pg_cron
— see `0005_scheduled_notifications.sql` for the schedule statement.

## Project structure

```
src/
  components/    # layout (sidebar/topbar), auth guards, shared UI
  contexts/      # auth/session state
  hooks/         # data-fetching & mutation hooks (one per domain)
  lib/           # Supabase client, auth helpers, PDF generation, audit logging
  pages/
    admin/       # user mgmt, faculties, reports, audit log, settings
    auth/        # login, signup, password reset, profile completion
    medical-staff/  # patient search, visits, medications, lab, appointments
    student/     # student-only dashboard
    lecturer/    # lecturer-only dashboard
    shared/      # views used by more than one role (records, profile, etc.)
  routes/        # role → dashboard path mapping
  utils/         # formatting, BMI calculation, notification metadata
supabase/
  migrations/    # numbered SQL migrations — run in order
```

## Roadmap

- Scanned lab report upload (Supabase Storage bucket already exists for
  avatars; extending to lab reports is a small addition)
- Seed script for real AAUA faculty/department data
- Automated tests for RLS policies (pgTAP) and component tests

## License

Built as an academic project for Adekunle Ajasin University, Ibadan
Campus. Not currently licensed for reuse outside academic evaluation.
