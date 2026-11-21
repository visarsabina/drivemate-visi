import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GalleryPost = Tables<"school_gallery"> & { imageUrl: string };

export function useSchoolGallery(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ["school-gallery", tenantId],
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    queryFn: async (): Promise<GalleryPost[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase.from("school_gallery").select("*")
        .eq("tenant_id", tenantId).order("event_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data.length) return [];
      const { data: images, error: imageError } = await supabase.storage.from("school-gallery")
        .createSignedUrls(data.map(post => post.image_path), 3600);
      if (imageError) throw imageError;
      return data.map(post => ({ ...post, imageUrl: images?.find(image => image.path === post.image_path)?.signedUrl || "" }));
    },
  });
}