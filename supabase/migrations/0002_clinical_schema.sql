-- ============================================================================
-- AAUA HMS — Clinical schema: visits, medications, lab, feedback
-- ============================================================================

create type visit_status as enum ('open', 'in_progress', 'completed', 'referred');
create type lab_status as enum ('requested', 'in_progress', 'completed', 'approved');
create type appointment_status as enum ('booked', 'rescheduled', 'cancelled', 'completed');

-- ---------------------------------------------------------------------------
-- Clinic visits — the central clinical record
-- ---------------------------------------------------------------------------
create table clinic_visits (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references profiles(id),      -- student OR lecturer
  attending_staff_id uuid not null references profiles(id),
  visit_date date not null default current_date,
  visit_time time not null default current_time,
  reason_for_visit text not null,
  symptoms text,
  physical_examination text,
  -- Vital signs
  temperature_c numeric(4, 1),
  blood_pressure text,               -- e.g. '120/80'
  pulse_rate int,
  respiratory_rate int,
  oxygen_saturation numeric(4, 1),
  diagnosis text,
  treatment_administered text,
  follow_up_date date,
  doctors_notes text,
  status visit_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_visits_patient on clinic_visits(patient_id);
create index idx_visits_staff on clinic_visits(attending_staff_id);
create index idx_visits_date on clinic_visits(visit_date);

-- ---------------------------------------------------------------------------
-- Medical feedback (progress notes, recommendations, referrals)
-- ---------------------------------------------------------------------------
create table medical_feedback (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid references clinic_visits(id) on delete cascade,
  patient_id uuid not null references profiles(id),
  author_id uuid not null references profiles(id),
  progress_notes text,
  follow_up_instructions text,
  lifestyle_recommendations text,
  dietary_recommendations text,
  exercise_recommendations text,
  referral_notes text,
  recovery_status text,
  return_to_class boolean,
  created_at timestamptz not null default now()
);

create index idx_feedback_patient on medical_feedback(patient_id);

-- ---------------------------------------------------------------------------
-- Medications (prescriptions dispensed against a visit)
-- ---------------------------------------------------------------------------
create table medications (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid references clinic_visits(id) on delete cascade,
  patient_id uuid not null references profiles(id),
  medicine_name text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  administration_route text,
  quantity_dispensed int,
  prescribing_staff_id uuid not null references profiles(id),
  pharmacy_notes text,
  dispensed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_medications_patient on medications(patient_id);

-- ---------------------------------------------------------------------------
-- Laboratory module
-- ---------------------------------------------------------------------------
create table lab_requests (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid references clinic_visits(id) on delete cascade,
  patient_id uuid not null references profiles(id),
  requested_by uuid not null references profiles(id),
  test_category text not null,
  test_name text not null,
  status lab_status not null default 'requested',
  result_summary text,
  result_interpretation text,
  scanned_report_url text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lab_patient on lab_requests(patient_id);
create index idx_lab_status on lab_requests(status);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references profiles(id),
  medical_staff_id uuid references profiles(id),
  scheduled_date date not null,
  scheduled_time time not null,
  reason text,
  status appointment_status not null default 'booked',
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_patient on appointments(patient_id);
create index idx_appointments_date on appointments(scheduled_date);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create type notification_type as enum (
  'appointment_confirmation', 'appointment_reminder', 'lab_result',
  'follow_up_reminder', 'vaccination_reminder', 'medical_announcement',
  'prescription_available'
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  related_record_id uuid,            -- points at appointment/lab/visit id, not FK-enforced (polymorphic)
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on notifications(recipient_id, is_read);

-- ---------------------------------------------------------------------------
-- Audit log (security requirement: every sensitive action recorded)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,               -- e.g. 'view_record', 'update_visit', 'login'
  table_name text,
  record_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_actor on audit_logs(actor_id);
create index idx_audit_created on audit_logs(created_at);

create trigger trg_visits_updated_at before update on clinic_visits
  for each row execute function set_updated_at();
create trigger trg_lab_updated_at before update on lab_requests
  for each row execute function set_updated_at();
create trigger trg_appointments_updated_at before update on appointments
  for each row execute function set_updated_at();
