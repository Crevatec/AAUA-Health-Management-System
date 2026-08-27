import { supabase } from "./supabaseClient";
import { logAudit } from "./audit";

/**
 * Sign up a new user. `role` is passed as auth metadata so the
 * `handle_new_user` Postgres trigger can create the matching `profiles` row.
 * The caller is responsible for then creating the role-specific row
 * (students / lecturers / medical_staff / administrators) — see
 * src/pages/auth/CompleteProfile.jsx.
 */
export async function signUp({ email, password, fullName, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Log in. The spec calls for email + password + "assigned role" at login —
 * we authenticate on email/password (Supabase's mechanism) and then verify
 * the selected role matches the account's actual role, so a student can't
 * accidentally (or deliberately) select "medical_staff" at the login screen.
 */
export async function signIn({ email, password, expectedRole }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw profileError;

  if (expectedRole && profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error(
      `This account is registered as ${profile.role.replace("_", " ")}, not ${expectedRole.replace("_", " ")}.`
    );
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated. Contact the clinic administrator.");
  }

  await logAudit({ actorId: data.user.id, action: "login" });

  return { session: data.session, profile };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return profile;
}
