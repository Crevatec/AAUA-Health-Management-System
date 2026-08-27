-- ============================================================================
-- AAUA HMS — auto-provision a `profiles` row whenever a new auth.users
-- record is created. Role and identity fields come from the signup form's
-- metadata (see src/lib/auth.js -> signUp()).
-- ============================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed User'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
