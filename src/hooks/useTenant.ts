import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns the tenant_id of the currently authenticated user.
 * Returns null while loading or if the user has no tenant assigned.
 */
export const useTenant = () => {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTenantId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_tenants")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Failed to load tenant:", error);
          setTenantId(null);
        } else {
          setTenantId(data?.tenant_id ?? null);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { tenantId, loading };
};

/**
 * Resolves the tenant_id for the current public domain (used for public
 * registration forms where there is no logged-in user).
 * Falls back to the "visi" tenant if no domain match is found.
 */
export const resolveTenantByDomain = async (): Promise<string | null> => {
  const host = window.location.hostname.replace(/^www\./, "");

  // Try exact domain match first
  const { data: byDomain } = await supabase
    .from("tenants")
    .select("id")
    .eq("domain", host)
    .eq("is_active", true)
    .maybeSingle();

  if (byDomain?.id) return byDomain.id;

  // Fallback to default tenant (visi)
  const { data: fallback } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "visi")
    .maybeSingle();

  return fallback?.id ?? null;
};
