-- ============================================================================
-- AAUA HMS — Core schema: roles, profiles, students, lecturers, departments
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type user_role as enum ('administrator', 'medical_staff', 'student', 'lecturer');
create type medical_staff_type as enum ('doctor', 'nurse', 'pharmacist', 'lab_scientist');
create type account_status as enum ('active', 'inactive', 'suspended');
create type gender_type as enum ('male', 'female');
create type blood_group_type as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
create type genotype_type as enum ('AA', 'AS', 'SS', 'AC', 'SC');

-- ---------------------------------------------------------------------------
-- Faculties / Departments (Administrator-managed reference data)
-- ---------------------------------------------------------------------------
create table faculties (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default uuid_generate_v4(),
  faculty_id uuid not null references faculties(id) on delete cascade,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now(),
  unique (faculty_id, name)
);

create table academic_sessions (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,        -- e.g. '2025/2026'
  is_current boolean not null default false,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles — one row per auth.users entry, holds role + shared identity fields
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  status account_status not null default 'active',
  full_name text not null,
  email text not null unique,
  phone text,
  passport_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Administrator-only extension (kept separate so RBAC checks stay simple)
create table administrators (
  profile_id uuid primary key references profiles(id) on delete cascade,
  title text
);

-- Medical staff extension
create table medical_staff (
  profile_id uuid primary key references profiles(id) on delete cascade,
  staff_type medical_staff_type not null,
  license_number text,
  department text
);

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
create table students (
  profile_id uuid primary key references profiles(id) on delete cascade,
  matric_number text not null unique,
  faculty_id uuid references faculties(id),
  department_id uuid references departments(id),
  programme text,
  level text,                        -- e.g. '100', '200', '300', '400'
  gender gender_type,
  date_of_birth date,
  blood_group blood_group_type,
  genotype genotype_type,
  height_cm numeric(5, 1),
  weight_kg numeric(5, 1),
  -- BMI is derived, not stored redundantly as a fact — computed in the app/view layer
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relationship text,
  emergency_contact_name text,
  emergency_contact_phone text,
  guardian_name text,
  guardian_phone text,
  updated_at timestamptz not null default now()
);

create table student_allergies (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(profile_id) on delete cascade,
  allergen text not null,
  severity text,                     -- mild / moderate / severe
  notes text,
  recorded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table student_conditions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(profile_id) on delete cascade,
  condition_name text not null,
  diagnosed_on date,
  is_chronic boolean not null default false,
  notes text,
  recorded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table vaccinations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references profiles(id) on delete cascade, -- student OR lecturer
  vaccine_name text not null,
  dose_number int,
  administered_on date not null,
  administered_by uuid references profiles(id),
  next_due_on date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lecturers
-- ---------------------------------------------------------------------------
create table lecturers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  staff_number text not null unique,
  faculty_id uuid references faculties(id),
  department_id uuid references departments(id),
  gender gender_type,
  date_of_birth date,
  blood_group blood_group_type,
  genotype genotype_type,
  updated_at timestamptz not null default now()
);

create index idx_students_department on students(department_id);
create index idx_lecturers_department on lecturers(department_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper (reused across every table with an updated_at col)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_students_updated_at before update on students
  for each row execute function set_updated_at();
create trigger trg_lecturers_updated_at before update on lecturers
  for each row execute function set_updated_at();
