import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { roleHomePath } from "../../routes/roleHomePath";

/**
 * Runs once, right after signup, to fill in the role-specific table
 * (students / lecturers / medical_staff / administrators) that the
 * `profiles` row alone doesn't cover. Role comes from router state if
 * present (fresh signup) or falls back to the authenticated profile's role.
 */
export default function CompleteProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const role = location.state?.role || profile?.role;

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch } = useForm();
  const selectedFaculty = watch("facultyId");

  useEffect(() => {
    supabase.from("faculties").select("id, name").order("name").then(({ data }) => {
      setFaculties(data || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      return;
    }
    supabase
      .from("departments")
      .select("id, name")
      .eq("faculty_id", selectedFaculty)
      .order("name")
      .then(({ data }) => setDepartments(data || []));
  }, [selectedFaculty]);

  if (!session) {
    navigate("/login", { replace: true });
    return null;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const uid = session.user.id;

      if (role === "student") {
        const { error } = await supabase.from("students").insert({
          profile_id: uid,
          matric_number: values.matricNumber,
          faculty_id: values.facultyId || null,
          department_id: values.departmentId || null,
          programme: values.programme,
          level: values.level,
          gender: values.gender || null,
          date_of_birth: values.dateOfBirth || null,
        });
        if (error) throw error;
      } else if (role === "lecturer") {
        const { error } = await supabase.from("lecturers").insert({
          profile_id: uid,
          staff_number: values.staffNumber,
          faculty_id: values.facultyId || null,
          department_id: values.departmentId || null,
          gender: values.gender || null,
          date_of_birth: values.dateOfBirth || null,
        });
        if (error) throw error;
      } else if (role === "medical_staff") {
        const { error } = await supabase.from("medical_staff").insert({
          profile_id: uid,
          staff_type: values.staffType,
          license_number: values.licenseNumber,
        });
        if (error) throw error;
      } else if (role === "administrator") {
        const { error } = await supabase.from("administrators").insert({
          profile_id: uid,
          title: values.title,
        });
        if (error) throw error;
      }

      await refreshProfile();
      toast.success("Profile completed.");
      navigate(roleHomePath(role), { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not save profile details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light px-4 py-10 dark:bg-surface-dark">
      <div className="w-full max-w-lg">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-clinic-900 dark:text-white">
          A few more details
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          {role === "student" && (
            <>
              <Field label="Matric number">
                <input className="input-field" {...register("matricNumber", { required: true })} />
              </Field>
              <FacultyDeptFields register={register} faculties={faculties} departments={departments} />
              <Field label="Programme">
                <input className="input-field" {...register("programme")} />
              </Field>
              <Field label="Level">
                <select className="input-field" {...register("level")}>
                  {["100", "200", "300", "400", "500"].map((l) => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </Field>
              <GenderDobFields register={register} />
            </>
          )}

          {role === "lecturer" && (
            <>
              <Field label="Staff number">
                <input className="input-field" {...register("staffNumber", { required: true })} />
              </Field>
              <FacultyDeptFields register={register} faculties={faculties} departments={departments} />
              <GenderDobFields register={register} />
            </>
          )}

          {role === "medical_staff" && (
            <>
              <Field label="Staff type">
                <select className="input-field" {...register("staffType", { required: true })}>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_scientist">Laboratory Scientist</option>
                </select>
              </Field>
              <Field label="License number">
                <input className="input-field" {...register("licenseNumber")} />
              </Field>
            </>
          )}

          {role === "administrator" && (
            <Field label="Title / position">
              <input className="input-field" {...register("title")} placeholder="e.g. Clinic Administrator" />
            </Field>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function FacultyDeptFields({ register, faculties, departments }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Faculty">
        <select className="input-field" {...register("facultyId")}>
          <option value="">Select faculty</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Department">
        <select className="input-field" {...register("departmentId")}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function GenderDobFields({ register }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Gender">
        <select className="input-field" {...register("gender")}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Field>
      <Field label="Date of birth">
        <input type="date" className="input-field" {...register("dateOfBirth")} />
      </Field>
    </div>
  );
}
