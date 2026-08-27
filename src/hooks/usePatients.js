import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

/**
 * Medical staff need to find a patient by name, matric/staff number,
 * department, or blood group — the spec's "Advanced Search" requirement.
 * Students and lecturers live in separate tables (different identity
 * fields) so we query both and merge, tagging each result with its type.
 */
export function usePatientSearch(term) {
  return useQuery({
    queryKey: ["patient-search", term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const like = `%${term.trim()}%`;

      const [{ data: students, error: sErr }, { data: lecturers, error: lErr }] = await Promise.all([
        supabase
          .from("students")
          .select(
            "profile_id, matric_number, level, programme, blood_group, profiles!inner(full_name, email, passport_photo_url)"
          )
          .or(`matric_number.ilike.${like},profiles.full_name.ilike.${like}`)
          .limit(20),
        supabase
          .from("lecturers")
          .select(
            "profile_id, staff_number, blood_group, profiles!inner(full_name, email, passport_photo_url)"
          )
          .or(`staff_number.ilike.${like},profiles.full_name.ilike.${like}`)
          .limit(20),
      ]);

      if (sErr) throw sErr;
      if (lErr) throw lErr;

      const studentResults = (students || []).map((s) => ({
        id: s.profile_id,
        type: "student",
        name: s.profiles.full_name,
        email: s.profiles.email,
        identifier: s.matric_number,
        subtitle: [s.level && `${s.level} Level`, s.programme].filter(Boolean).join(" · "),
        bloodGroup: s.blood_group,
        photoUrl: s.profiles.passport_photo_url,
      }));

      const lecturerResults = (lecturers || []).map((l) => ({
        id: l.profile_id,
        type: "lecturer",
        name: l.profiles.full_name,
        email: l.profiles.email,
        identifier: l.staff_number,
        subtitle: "Lecturer",
        bloodGroup: l.blood_group,
        photoUrl: l.profiles.passport_photo_url,
      }));

      return [...studentResults, ...lecturerResults].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

/**
 * Full patient profile — merges the profiles row with the type-specific
 * table (students or lecturers), plus allergies/conditions/vaccinations.
 * `patientType` lets callers skip a guessing round-trip when already known
 * (e.g. arriving from search results); otherwise it's detected.
 */
export function usePatientProfile(patientId, patientType) {
  return useQuery({
    queryKey: ["patient-profile", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();
      if (pErr) throw pErr;

      let type = patientType;
      let details = null;

      if (!type || type === "student") {
        const { data, error } = await supabase
          .from("students")
          .select("*, faculties(name), departments(name)")
          .eq("profile_id", patientId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          type = "student";
          details = data;
        }
      }

      if (!details && (!type || type === "lecturer")) {
        const { data, error } = await supabase
          .from("lecturers")
          .select("*, faculties(name), departments(name)")
          .eq("profile_id", patientId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          type = "lecturer";
          details = data;
        }
      }

      const [{ data: allergies }, { data: conditions }, { data: vaccinations }] = await Promise.all([
        supabase.from("student_allergies").select("*").eq("student_id", patientId).order("created_at", { ascending: false }),
        supabase.from("student_conditions").select("*").eq("student_id", patientId).order("created_at", { ascending: false }),
        supabase.from("vaccinations").select("*").eq("patient_id", patientId).order("administered_on", { ascending: false }),
      ]);

      return { profile, type, details, allergies: allergies || [], conditions: conditions || [], vaccinations: vaccinations || [] };
    },
  });
}
