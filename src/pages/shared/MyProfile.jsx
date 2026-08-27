import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Camera, Pencil, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { usePatientProfile } from "../../hooks/usePatients";
import { useUploadAvatar } from "../../hooks/useAvatarUpload";
import { calculateAge, formatDate } from "../../utils/format";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Adjunct", "Visiting"];
const RANKS = ["Assistant Lecturer", "Lecturer II", "Lecturer I", "Senior Lecturer", "Associate Professor", "Professor"];

export default function MyProfile() {
  const { profile, role, refreshProfile } = useAuth();
  const { data, isLoading } = usePatientProfile(profile?.id, role);
  const [editing, setEditing] = useState(false);
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef(null);

  if (isLoading || !data) return <p className="text-sm text-clinic-400">Loading…</p>;

  const { profile: p, details } = data;
  const isLecturer = role === "lecturer";
  const isStudent = role === "student";

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Photo must be under 3MB.");
      return;
    }
    try {
      await uploadAvatar.mutateAsync({ userId: profile.id, file });
      await refreshProfile();
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(err.message || "Could not upload photo.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-clinic-100 text-2xl font-semibold text-clinic-700 dark:bg-clinic-800 dark:text-clinic-100">
              {p.passport_photo_url ? (
                <img src={p.passport_photo_url} alt={p.full_name} className="h-full w-full object-cover" />
              ) : (
                p.full_name.slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-clinic-500 text-white shadow-card hover:bg-clinic-600"
              aria-label="Change profile photo"
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">{p.full_name}</h2>
            <p className="text-sm text-clinic-500">
              {isLecturer && (details?.rank || "Lecturer")}
              {isStudent && `${details?.level || "—"} Level Student`}
              {details?.departments?.name && ` · ${details.departments.name}`}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-clinic-600 dark:text-clinic-300 sm:grid-cols-2">
              <span>{isLecturer ? "Employee ID" : "Matric Number"}: {details?.staff_number || details?.matric_number || "—"}</span>
              <span>Email: {p.email}</span>
              <span>Phone: {p.phone || "—"}</span>
              <span className="flex items-center gap-1.5">
                Status: <span className="h-2 w-2 rounded-full bg-clinic-500" /> {p.status === "active" ? "Active" : p.status}
              </span>
              {isLecturer && <span>Office: {details?.office || "—"}</span>}
              {details?.faculties?.name && <span>Faculty: {details.faculties.name}</span>}
            </div>
          </div>

          <button onClick={() => setEditing((v) => !v)} className="btn-secondary shrink-0">
            {editing ? <><X size={15} className="mr-1.5" /> Cancel</> : <><Pencil size={15} className="mr-1.5" /> Edit Profile</>}
          </button>
        </div>
      </div>

      {editing ? (
        <EditForm profile={profile} role={role} details={details} onDone={() => setEditing(false)} />
      ) : (
        <>
          <InfoTable
            title="Personal Information"
            rows={[
              ["Full Name", p.full_name],
              ["Gender", details?.gender],
              ["Date of Birth", details?.date_of_birth ? `${formatDate(details.date_of_birth)} (${calculateAge(details.date_of_birth)} yrs)` : null],
              ["Nationality", details?.nationality],
              ["Marital Status", details?.marital_status],
              ["Address", details?.address],
              isStudent ? ["Emergency Contact", [details?.emergency_contact_name, details?.emergency_contact_phone].filter(Boolean).join(" · ")] : null,
            ].filter(Boolean)}
          />

          {isLecturer && (
            <InfoTable
              title="Professional Information"
              rows={[
                ["Staff ID", details?.staff_number],
                ["Rank", details?.rank],
                ["Department", details?.departments?.name],
                ["Faculty", details?.faculties?.name],
                ["Employment Type", details?.employment_type],
                ["Date Employed", details?.date_employed ? formatDate(details.date_employed) : null],
              ]}
            />
          )}

          {isStudent && (
            <InfoTable
              title="Academic Information"
              rows={[
                ["Matric Number", details?.matric_number],
                ["Programme", details?.programme],
                ["Level", details?.level ? `${details.level} Level` : null],
                ["Department", details?.departments?.name],
                ["Faculty", details?.faculties?.name],
              ]}
              note="Blood group, genotype, and other medical fields are managed by clinic staff and shown on your medical records."
            />
          )}
        </>
      )}
    </div>
  );
}

function InfoTable({ title, rows, note }) {
  return (
    <div className="card">
      <h3 className="mb-3 font-display text-sm font-semibold text-clinic-900 dark:text-white">{title}</h3>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-clinic-100 dark:divide-clinic-800">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="w-1/3 py-2.5 pr-4 font-medium text-clinic-500">{label}</td>
              <td className="py-2.5 text-clinic-800 dark:text-clinic-200">{value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="mt-3 text-xs text-clinic-400">{note}</p>}
    </div>
  );
}

function EditForm({ profile, role, details, onDone }) {
  const [saving, setSaving] = useState(false);
  const { refreshProfile } = useAuth();
  const isLecturer = role === "lecturer";
  const isStudent = role === "student";

  const { register, handleSubmit } = useForm({
    defaultValues: {
      phone: profile.phone || "",
      nationality: details?.nationality || "",
      maritalStatus: details?.marital_status || "",
      address: details?.address || "",
      nextOfKinName: details?.next_of_kin_name || "",
      nextOfKinPhone: details?.next_of_kin_phone || "",
      nextOfKinRelationship: details?.next_of_kin_relationship || "",
      emergencyContactName: details?.emergency_contact_name || "",
      emergencyContactPhone: details?.emergency_contact_phone || "",
      guardianName: details?.guardian_name || "",
      guardianPhone: details?.guardian_phone || "",
      rank: details?.rank || "",
      office: details?.office || "",
      employmentType: details?.employment_type || "",
      dateEmployed: details?.date_employed || "",
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: values.phone || null })
        .eq("id", profile.id);
      if (profileError) throw profileError;

      if (isStudent) {
        const { error } = await supabase
          .from("students")
          .update({
            nationality: values.nationality || null,
            marital_status: values.maritalStatus || null,
            address: values.address || null,
            next_of_kin_name: values.nextOfKinName || null,
            next_of_kin_phone: values.nextOfKinPhone || null,
            next_of_kin_relationship: values.nextOfKinRelationship || null,
            emergency_contact_name: values.emergencyContactName || null,
            emergency_contact_phone: values.emergencyContactPhone || null,
            guardian_name: values.guardianName || null,
            guardian_phone: values.guardianPhone || null,
          })
          .eq("profile_id", profile.id);
        if (error) throw error;
      }

      if (isLecturer) {
        const { error } = await supabase
          .from("lecturers")
          .update({
            nationality: values.nationality || null,
            marital_status: values.maritalStatus || null,
            address: values.address || null,
            rank: values.rank || null,
            office: values.office || null,
            employment_type: values.employmentType || null,
            date_employed: values.dateEmployed || null,
          })
          .eq("profile_id", profile.id);
        if (error) throw error;
      }

      await refreshProfile();
      toast.success("Profile updated.");
      onDone();
    } catch (err) {
      toast.error(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="card space-y-4">
        <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Contact & personal details</h3>
        <Field label="Phone number"><input className="input-field" {...register("phone")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nationality"><input className="input-field" {...register("nationality")} /></Field>
          <Field label="Marital status">
            <select className="input-field" {...register("maritalStatus")}>
              <option value="">Select</option>
              <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
            </select>
          </Field>
        </div>
        <Field label="Address"><input className="input-field" {...register("address")} /></Field>
      </div>

      {isLecturer && (
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Professional details</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rank">
              <select className="input-field" {...register("rank")}>
                <option value="">Select</option>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Employment type">
              <select className="input-field" {...register("employmentType")}>
                <option value="">Select</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Office"><input className="input-field" {...register("office")} /></Field>
            <Field label="Date employed"><input type="date" className="input-field" {...register("dateEmployed")} /></Field>
          </div>
        </div>
      )}

      {isStudent && (
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Next of kin & emergency contact</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Next of kin name"><input className="input-field" {...register("nextOfKinName")} /></Field>
            <Field label="Relationship"><input className="input-field" {...register("nextOfKinRelationship")} /></Field>
          </div>
          <Field label="Next of kin phone"><input className="input-field" {...register("nextOfKinPhone")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency contact name"><input className="input-field" {...register("emergencyContactName")} /></Field>
            <Field label="Emergency contact phone"><input className="input-field" {...register("emergencyContactPhone")} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Guardian name"><input className="input-field" {...register("guardianName")} /></Field>
            <Field label="Guardian phone"><input className="input-field" {...register("guardianPhone")} /></Field>
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
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