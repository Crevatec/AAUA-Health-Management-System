import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useFaculties() {
  return useQuery({
    queryKey: ["faculties-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculties").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useDepartments(facultyId) {
  return useQuery({
    queryKey: ["departments-admin", facultyId],
    queryFn: async () => {
      let query = supabase.from("departments").select("*, faculties(name)").order("name");
      if (facultyId) query = query.eq("faculty_id", facultyId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("faculties").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faculties-admin"] }),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from("departments").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments-admin"] }),
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("faculties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties-admin"] });
      queryClient.invalidateQueries({ queryKey: ["departments-admin"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments-admin"] }),
  });
}
