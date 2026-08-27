# AAUA Health Management System (HMS) — Ibadan Campus

A Progressive Web App for the Adekunle Ajasin University clinic (Ibadan
Campus) — student, lecturer, and staff medical records, clinic visits,
medications, lab results, appointments, and printable PDF reports, with
strict role-based access control.

## Stack

React + Vite · Tailwind CSS · Supabase (Auth + Postgres + RLS) · React
Router · React Hook Form + Zod · TanStack Query · jsPDF · Chart.js ·
vite-plugin-pwa · Netlify

## Launching the project — step by step

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project. Pick any name/region;
note the project URL and anon key from **Settings → API** once it's ready
(takes ~2 minutes to provision).

### 2. Run the database migrations
In the Supabase dashboard, open **SQL Editor → New query**, and run each
file in this exact order (copy-paste the contents, click Run, then move to
the next):

1. `supabase/migrations/0001_core_schema.sql`
2. `supabase/migrations/0002_clinical_schema.sql`
3. `supabase/migrations/0003_row_level_security.sql`
4. `supabase/migrations/0004_auth_trigger.sql`
5. `supabase/migrations/0005_scheduled_notifications.sql`

(If you have the Supabase CLI installed instead, `supabase link` then
`supabase db push` applies all five in order automatically.)

### 3. (Optional but recommended) Seed reference data
Insert at least one faculty, department, and academic session so signup
forms aren't empty on first run — either via **Table Editor** in the
dashboard, or SQL like:
```sql
insert into faculties (name, code) values ('Faculty of Science', 'SCI');
insert into departments (faculty_id, name, code)
  values ((select id from faculties where code = 'SCI'), 'Computer Science', 'CSC');
insert into academic_sessions (name, is_current, starts_on, ends_on)
  values ('2025/2026', true, '2025-09-01', '2026-07-31');
```
(You can also do this later from **Admin → Faculties & Depts** once you
have an administrator account — see step 6.)

### 4. Schedule the daily reminder job (optional)
In the Supabase dashboard, go to **Database → Cron** (or run via SQL
Editor) and schedule:
```sql
select cron.schedule('daily-reminders', '0 6 * * *', $$select run_daily_reminders()$$);
```
This powers appointment/follow-up/vaccination reminder notifications.
Skip this for now if you just want the app running — everything else
works without it.

### 5. Configure and run the app locally
```bash
# unzip the project, then inside the folder:
npm install
cp .env.example .env
```
Open `.env` and fill in your Supabase project's URL and anon key from
step 1:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Then start the dev server:
```bash
npm run dev
```
Open the URL it prints (typically `http://localhost:5173`).

### 6. Create your first account
Go to **Sign up**, register with role **Administrator**, complete your
profile. Every other account (students, lecturers, medical staff) signs
up the same way and picks its own role — there's no separate invite step.
Log in at `/login` by selecting the matching role, or the login will
reject a mismatched role/account combination on purpose (security check
from the spec).

### 7. Try the PWA install
On desktop Chrome/Edge, look for the install icon in the address bar. On
Android Chrome, use "Add to Home Screen" from the menu. On iOS Safari, use
Share → "Add to Home Screen". (PWA install prompts only appear on the
production build or over HTTPS — see step 8 for that.)

### 8. Deploy to Netlify (for submission / real use)
1. Push this project to a GitHub repo.
2. On [netlify.com](https://netlify.com), "Add new site" → import the repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Under **Site settings → Environment variables**, add the same two
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` values from your `.env`.
5. Deploy. Netlify gives you a live HTTPS URL — the PWA install prompt and
   offline caching only fully work over HTTPS, so this is the version to
   demo/submit.

### PWA icons (cosmetic, do before final submission)
Drop `icon-192.png`, `icon-512.png`, and `icon-512-maskable.png` into
`public/icons/`, plus `favicon.svg` and `apple-touch-icon.png` into
`public/` — use the AAUA/clinic logo. The app runs fine without these;
you'll just see a generic icon when installed.

## What's built so far

**Stage 1 — Foundation**
- Full Postgres schema: profiles, students, lecturers, medical staff,
  administrators, clinic visits, medications, lab requests, appointments,
  notifications, audit logs, vaccinations, allergies, chronic conditions.
- Row Level Security policies enforcing the spec's RBAC rules directly in
  the database (students/lecturers see only their own records; medical
  staff and admins see what their role needs).
- Auth: signup, login (with role verification), forgot/reset password,
  profile completion flow, session handling via context.
- App shell: role-aware sidebar navigation, topbar (dark mode, user menu),
  protected routing per role, overview dashboards for all four roles with
  live stats from Supabase.
- PWA: installable manifest, offline app-shell caching, network-first
  caching for API calls so clinic data is never served stale.

**Stage 2 — Clinic Visit module**
- Patient search (`/staff/patients`) across students and lecturers by
  name/matric/staff number.
- Full patient profile (`/staff/patients/:id`): demographics, age, BMI
  (derived, not stored), allergies, chronic conditions, vaccination
  history, and full clinic visit history.
- New visit form (`/staff/visits/new`): symptoms, physical exam, vitals
  (temp/BP/pulse/respiration/SpO₂), diagnosis, treatment, follow-up date,
  doctor's notes, visit status.
- Visit detail page, shared between staff and patients (`/staff/visits/:id`,
  `/student/records/:id`, `/lecturer/records/:id`) — staff get an editable
  view with a feedback form (progress, follow-up instructions, lifestyle/
  diet/exercise recommendations, referral notes, return-to-class decision);
  patients get a read-only view of the same data, enforced by RLS.
- "My Records" list (`/student/records`, `/lecturer/records`) — a patient's
  own visit history.
- Clinic-wide visit log for staff (`/staff/visits`).

**Stage 3 — Medications & Laboratory**
- Prescribe medication from a visit (`/staff/visits/:id/medications`) —
  medicine, dosage, frequency, duration, route, quantity, pharmacy notes.
- Medications list (`/staff/medications`) — every prescription clinic-wide,
  with a one-click "mark dispensed" action.
- Request a lab test from a visit (`/staff/visits/:id/lab-request`) —
  category + specific test.
- Laboratory list (`/staff/lab`) with status filters (requested → in
  progress → completed → approved).
- Lab request detail (`/staff/lab/:id`): staff move a request through
  processing, enter results and interpretation, then approve — matching
  the spec's "approval by laboratory personnel" requirement. Scanned
  report upload is stubbed for Supabase Storage.
- Visit detail page now shows the medications and lab requests tied to
  that visit inline — patients only ever see lab results once approved.

**Stage 4 — Appointments**
- Booking form (`/student/appointments/book`, `/lecturer/appointments/book`)
  — date, time, optional preferred medical staff, reason. Fires an
  "appointment confirmation" notification on booking (spec requirement).
- "My appointments" (`/student/appointments`, `/lecturer/appointments`) —
  patients reschedule or cancel their own booked appointments inline.
- Staff schedule (`/staff/appointments`) — full clinic schedule with an
  "upcoming only" toggle, and one-click complete/cancel per appointment.

**Stage 5 — Notifications**
- In-app inbox (`/{role}/notifications`) shared across all four roles —
  unread state, mark-one-read, mark-all-read, type-specific icons.
- Real unread badge on the topbar bell (polls every 60s), click-through to
  the inbox.
- Action-triggered notifications now fire for real: appointment
  confirmation (booking), prescription available (medication prescribed),
  lab result available (result approved), follow-up scheduled (visit saved
  with a follow-up date).
- Time-based reminders — appointment reminder (1 day out), follow-up
  reminder (1 day out), vaccination due (7 days out) — live as Postgres
  functions in `0005_scheduled_notifications.sql`. These can't be triggered
  by a page load, so schedule `run_daily_reminders()` with Supabase's
  pg_cron (Database → Cron in the dashboard) to run once daily.
- `broadcast_announcement()` SQL function ready for Admin's future
  "Clinic Settings → Announcements" page to call.

**Stage 6 — PDF Report Generation**
- `src/lib/pdfReport.js` — jsPDF + autoTable report builder matching the
  spec's required layout: school logo/name/clinic name, report title,
  patient information, consultation details, diagnosis, treatment,
  prescriptions table, laboratory results table, medical feedback,
  doctor's signature line, hospital stamp box, and date generated. A4,
  print-ready.
- **Single-visit report** — "Download PDF" button on the visit detail page
  (`/staff/visits/:id`, `/student/records/:id`, `/lecturer/records/:id`).
  Available to staff and to the patient themselves; patients only ever get
  lab results that have been approved, matching the RLS-enforced rule
  elsewhere in the app.
- **Patient summary report** — "Download summary" button on the staff
  patient profile page: full medical history across every visit, plus
  allergies and chronic conditions, in one document (the spec's
  "Generate reports" requirement for medical staff/admin).
- Logo is a placeholder teal badge — swap in the real AAUA/clinic logo via
  `doc.addImage()` in `drawHeader()` once you have the artwork.

**Stage 7 — Admin**
- **User management** (`/admin/users`) — search/filter by role and status,
  inline role changes, activate/deactivate accounts. Every status/role
  change and every login writes to `audit_logs`.
- **Faculties & Departments** (`/admin/faculties`) — add/remove reference
  data used across student and lecturer profiles.
- **Reports & analytics** (`/admin/reports`) — 14-day visit trend, user
  role breakdown, and visit-status breakdown, via Chart.js.
- **Audit log viewer** (`/admin/audit`) — filterable trail of logins and
  account/role changes, backed by the `audit_logs` table + RLS (admin-only
  read).
- **Clinic settings** (`/admin/settings`) — broadcast announcements to all
  students/lecturers (or one group) via the `broadcast_announcement()` SQL
  function from Stage 5, plus academic session management (add sessions,
  mark one current).

## Project status: feature-complete against the spec

Every module in the original brief now has a working implementation:
auth & RBAC, student/lecturer/staff/admin dashboards, clinic visits,
medications, laboratory, appointments, notifications, PDF reports, and
admin management — all installable as a PWA.

## Reasonable next steps (polish, not core features)

- Student/lecturer self-service profile editing (non-medical fields only —
  RLS already restricts what they can touch; just needs a form)
- Scanned lab report upload via Supabase Storage (a bucket + file input)
- Seed script for AAUA's real faculties/departments so the app isn't empty
  on first run
- Swap the placeholder PDF/PWA logo for the real AAUA/clinic crest
- Automated tests (the migrations and RLS policies are good candidates for
  `supabase test db` / pgTAP)
