import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Megaphone, CalendarRange, Trash2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useAcademicSessions() {
  return useQuery({
    queryKey: ["academic-sessions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academic_sessions").select("*").order("starts_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("academic_sessions").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions-admin"] }),
  });
}

function useSetCurrentSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await supabase.from("academic_sessions").update({ is_current: false }).neq("id", id);
      const { error } = await supabase.from("academic_sessions").update({ is_current: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions-admin"] }),
  });
}

export default function ClinicSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Clinic settings</h2>
        <p className="text-sm text-clinic-500">Announcements and academic session configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnnouncementForm />
        <SessionsPanel />
      </div>
    </div>
  );
}

function AnnouncementForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [sending, setSending] = useState(false);

  const onSubmit = async (values) => {
    setSending(true);
    try {
      const { error } = await supabase.rpc("broadcast_announcement", {
        title: values.title,
        body: values.body,
        audience: values.audience || null,
      });
      if (error) throw error;
      toast.success("Announcement sent.");
      reset();
    } catch (err) {
      toast.error(err.message || "Could not send the announcement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-clinic-900 dark:text-white">
        <Megaphone size={16} /> Broadcast an announcement
      </h3>
      <div>
        <label className="field-label">Title</label>
        <input className="input-field" {...register("title", { required: true })} />
        {errors.title && <p className="mt-1 text-xs text-clay-600">Title is required</p>}
      </div>
      <div>
        <label className="field-label">Message</label>
        <textarea rows={3} className="input-field" {...register("body", { required: true })} />
        {errors.body && <p className="mt-1 text-xs text-clay-600">Message is required</p>}
      </div>
      <div>
        <label className="field-label">Audience</label>
        <select className="input-field" {...register("audience")}>
          <option value="">Everyone (students & lecturers)</option>
          <option value="student">Students only</option>
          <option value="lecturer">Lecturers only</option>
        </select>
      </div>
      <button type="submit" disabled={sending} className="btn-primary w-full">
        {sending ? "Sending…" : "Send announcement"}
      </button>
    </form>
  );
}

function SessionsPanel() {
  const { data: sessions, isLoading } = useAcademicSessions();
  const createSession = useCreateSession();
  const setCurrent = useSetCurrentSession();
  const { register, handleSubmit, reset } = useForm();

  const onCreate = async (values) => {
    try {
      await createSession.mutateAsync({
        name: values.name,
        starts_on: values.startsOn,
        ends_on: values.endsOn,
      });
      toast.success("Academic session added.");
      reset();
    } catch (err) {
      toast.error(err.message || "Could not add session.");
    }
  };

  return (
    <div className="card">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-clinic-900 dark:text-white">
        <CalendarRange size={16} /> Academic sessions
      </h3>

      <form onSubmit={handleSubmit(onCreate)} className="mb-4 space-y-2">
        <input placeholder="e.g. 2026/2027" className="input-field" {...register("name", { required: true })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input-field" {...register("startsOn", { required: true })} />
          <input type="date" className="input-field" {...register("endsOn", { required: true })} />
        </div>
        <button type="submit" disabled={createSession.isPending} className="btn-secondary w-full">
          <Plus size={15} className="mr-1.5" /> Add session
        </button>
      </form>

      {isLoading && <p className="text-sm text-clinic-400">Loading…</p>}
      <ul className="divide-y divide-clinic-100 dark:divide-clinic-800">
        {sessions?.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-clinic-700 dark:text-clinic-200">{s.name}</span>
            {s.is_current ? (
              <span className="rounded-full bg-clinic-50 px-2.5 py-1 text-xs font-medium text-clinic-600 dark:bg-clinic-500/10">Current</span>
            ) : (
              <button onClick={() => setCurrent.mutate(s.id)} className="text-xs font-medium text-clinic-500 hover:underline">
                Set as current
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
