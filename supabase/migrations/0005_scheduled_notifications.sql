-- ============================================================================
-- AAUA HMS — Scheduled notification generation
-- ============================================================================
-- Appointment/follow-up/vaccination "reminders" are time-based, not
-- triggered by a user action, so they can't fire from the frontend the way
-- confirmations, lab results, and prescriptions do. These functions do the
-- generation; schedule them with pg_cron (Supabase: Database → Cron) to run
-- once daily, e.g.:
--   select cron.schedule('daily-reminders', '0 6 * * *', $$select run_daily_reminders()$$);

create or replace function generate_appointment_reminders()
returns void language plpgsql as $$
begin
  insert into notifications (recipient_id, type, title, body, related_record_id)
  select
    a.patient_id,
    'appointment_reminder',
    'Appointment tomorrow',
    'Reminder: you have a clinic appointment tomorrow at ' || a.scheduled_time || '.',
    a.id
  from appointments a
  where a.scheduled_date = current_date + interval '1 day'
    and a.status in ('booked', 'rescheduled')
    and a.reminder_sent = false;

  update appointments
  set reminder_sent = true
  where scheduled_date = current_date + interval '1 day'
    and status in ('booked', 'rescheduled')
    and reminder_sent = false;
end;
$$;

create or replace function generate_followup_reminders()
returns void language plpgsql as $$
begin
  insert into notifications (recipient_id, type, title, body, related_record_id)
  select
    cv.patient_id,
    'follow_up_reminder',
    'Follow-up due tomorrow',
    'Your clinic follow-up is scheduled for tomorrow, ' || cv.follow_up_date || '.',
    cv.id
  from clinic_visits cv
  where cv.follow_up_date = current_date + interval '1 day'
    -- avoid duplicate reminders for the same visit
    and not exists (
      select 1 from notifications n
      where n.related_record_id = cv.id
        and n.type = 'follow_up_reminder'
        and n.created_at::date = current_date
    );
end;
$$;

create or replace function generate_vaccination_reminders()
returns void language plpgsql as $$
begin
  insert into notifications (recipient_id, type, title, body, related_record_id)
  select
    v.patient_id,
    'vaccination_reminder',
    'Vaccination due soon',
    v.vaccine_name || ' (dose ' || coalesce(v.dose_number::text, 'next') || ') is due on ' || v.next_due_on || '.',
    v.id
  from vaccinations v
  where v.next_due_on = current_date + interval '7 days'
    and not exists (
      select 1 from notifications n
      where n.related_record_id = v.id
        and n.type = 'vaccination_reminder'
        and n.created_at::date = current_date
    );
end;
$$;

create or replace function run_daily_reminders()
returns void language plpgsql as $$
begin
  perform generate_appointment_reminders();
  perform generate_followup_reminders();
  perform generate_vaccination_reminders();
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin broadcast — a medical_announcement to every active student/lecturer,
-- called from the app (Admin > Clinic Settings > Announcements, Stage 6).
-- ---------------------------------------------------------------------------
create or replace function broadcast_announcement(title text, body text, audience user_role default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, type, title, body)
  select p.id, 'medical_announcement', title, body
  from profiles p
  where p.status = 'active'
    and (audience is null or p.role = audience)
    and p.role in ('student', 'lecturer');
end;
$$;
