import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, file }) => {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ passport_photo_url: photoUrl })
        .eq("id", userId);
      if (updateError) throw updateError;

      return photoUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
    },
  });
}