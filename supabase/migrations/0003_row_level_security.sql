-- ============================================================================
-- AAUA HMS — Row Level Security (this IS the role-based access control layer)
-- ============================================================================
-- Design: every table checks the caller's role via a small set of helper
-- functions rather than repeating auth.uid() plumbing in every policy.
-- Students/lecturers only ever see rows where they are the patient.
-- Medical staff and administrators see what their role requires.

create or replace function current_user_role()
returns user_role language sql stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin() returns boolean language sql stable as $$
  select current_user_role() = 'administrator';
$$;

create or replace function is_medical_staff() returns boolean language sql stable as $$
  select current_user_role() = 'medical_staff';
$$;

create or replace function is_self(check_id uuid) returns boolean language sql stable as $$
  select auth.uid() = check_id;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_own_or_staff" on profiles for select
  using (is_self(id) or is_admin() or is_medical_staff());

create policy "profiles_update_own" on profiles for update
  using (is_self(id))
  with check (is_self(id));

create policy "profiles_admin_manage" on profiles for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- students — a student sees only their own row; lecturers see none;
-- medical staff and admins see all (needed for clinic search)
-- ---------------------------------------------------------------------------
alter table students enable row level security;

create policy "students_select" on students for select
  using (is_self(profile_id) or is_admin() or is_medical_staff());

create policy "students_update_own_limited" on students for update
  using (is_self(profile_id))
  with check (is_self(profile_id));
  -- NOTE: enforce the "students cannot edit official medical fields" rule
  -- (blood_group, genotype, allergies, conditions) at the application layer
  -- by only exposing editable columns (phone, next_of_kin, emergency_contact)
  -- in the student-facing update form / API call.

create policy "students_admin_staff_manage" on students for insert
  with check (is_admin() or is_medical_staff());
create policy "students_admin_delete" on students for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- lecturers — same shape as students
-- ---------------------------------------------------------------------------
alter table lecturers enable row level security;

create policy "lecturers_select" on lecturers for select
  using (is_self(profile_id) or is_admin() or is_medical_staff());

create policy "lecturers_update_own" on lecturers for update
  using (is_self(profile_id)) with check (is_self(profile_id));

create policy "lecturers_admin_staff_manage" on lecturers for insert
  with check (is_admin() or is_medical_staff());
create policy "lecturers_admin_delete" on lecturers for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- student_allergies / student_conditions / vaccinations
-- patients read their own; only medical staff write
-- ---------------------------------------------------------------------------
alter table student_allergies enable row level security;
create policy "allergies_select" on student_allergies for select
  using (is_self(student_id) or is_admin() or is_medical_staff());
create policy "allergies_staff_write" on student_allergies for insert
  with check (is_medical_staff() or is_admin());
create policy "allergies_staff_update" on student_allergies for update
  using (is_medical_staff() or is_admin());

alter table student_conditions enable row level security;
create policy "conditions_select" on student_conditions for select
  using (is_self(student_id) or is_admin() or is_medical_staff());
create policy "conditions_staff_write" on student_conditions for insert
  with check (is_medical_staff() or is_admin());

alter table vaccinations enable row level security;
create policy "vaccinations_select" on vaccinations for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());
create policy "vaccinations_staff_write" on vaccinations for insert
  with check (is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- clinic_visits — patient sees only their own; staff sees all; staff write
-- ---------------------------------------------------------------------------
alter table clinic_visits enable row level security;

create policy "visits_select" on clinic_visits for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());

create policy "visits_staff_insert" on clinic_visits for insert
  with check (is_medical_staff() or is_admin());

create policy "visits_staff_update" on clinic_visits for update
  using (is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- medical_feedback — patient reads their own; staff read/write all
-- ---------------------------------------------------------------------------
alter table medical_feedback enable row level security;

create policy "feedback_select" on medical_feedback for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());

create policy "feedback_staff_write" on medical_feedback for insert
  with check (is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- medications — same pattern
-- ---------------------------------------------------------------------------
alter table medications enable row level security;

create policy "medications_select" on medications for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());

create policy "medications_staff_write" on medications for insert
  with check (is_medical_staff() or is_admin());

create policy "medications_staff_update" on medications for update
  using (is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- lab_requests
-- ---------------------------------------------------------------------------
alter table lab_requests enable row level security;

create policy "lab_select" on lab_requests for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());

create policy "lab_staff_write" on lab_requests for insert
  with check (is_medical_staff() or is_admin());

create policy "lab_staff_update" on lab_requests for update
  using (is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- appointments — patient manages their own; staff sees/manages all
-- ---------------------------------------------------------------------------
alter table appointments enable row level security;

create policy "appointments_select" on appointments for select
  using (is_self(patient_id) or is_admin() or is_medical_staff());

create policy "appointments_patient_book" on appointments for insert
  with check (is_self(patient_id) or is_medical_staff() or is_admin());

create policy "appointments_update" on appointments for update
  using (is_self(patient_id) or is_medical_staff() or is_admin());

-- ---------------------------------------------------------------------------
-- notifications — strictly own-only
-- ---------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications for select
  using (is_self(recipient_id));

create policy "notifications_update_own" on notifications for update
  using (is_self(recipient_id)) with check (is_self(recipient_id));

create policy "notifications_system_insert" on notifications for insert
  with check (is_admin() or is_medical_staff());

-- ---------------------------------------------------------------------------
-- audit_logs — write-only for normal users, read-only for admins
-- ---------------------------------------------------------------------------
alter table audit_logs enable row level security;

create policy "audit_insert_any_authenticated" on audit_logs for insert
  with check (auth.uid() is not null);

create policy "audit_select_admin_only" on audit_logs for select
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Reference data (faculties, departments, sessions) — everyone can read,
-- only admins can write
-- ---------------------------------------------------------------------------
alter table faculties enable row level security;
alter table departments enable row level security;
alter table academic_sessions enable row level security;

create policy "faculties_read_all" on faculties for select using (true);
create policy "faculties_admin_write" on faculties for all
  using (is_admin()) with check (is_admin());

create policy "departments_read_all" on departments for select using (true);
create policy "departments_admin_write" on departments for all
  using (is_admin()) with check (is_admin());

create policy "sessions_read_all" on academic_sessions for select using (true);
create policy "sessions_admin_write" on academic_sessions for all
  using (is_admin()) with check (is_admin());

alter table administrators enable row level security;
create policy "administrators_admin_only" on administrators for all
  using (is_admin()) with check (is_admin());

alter table medical_staff enable row level security;
create policy "medical_staff_select" on medical_staff for select
  using (is_self(profile_id) or is_admin() or is_medical_staff());
create policy "medical_staff_admin_write" on medical_staff for all
  using (is_admin()) with check (is_admin());
