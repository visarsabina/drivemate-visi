import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const IMPERSONATE_KEY = "sa_impersonated_tenant_id";

export const getImpersonatedTenantId = (): string | null => {
  try {
    return localStorage.getItem(IMPERSONATE_KEY);
  } catch {
    return null;
  }
};

export const setImpersonatedTenantId = (tenantId: string | null) => {
  try {
    if (tenantId) localStorage.setItem(IMPERSONATE_KEY, tenantId);
    else localStorage.removeItem(IMPERSONATE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Returns the tenant_id of the currently authenticated user.
 * For super admins, returns the impersonated tenant_id from localStorage
 * (set when they click on a tenant in /super-admin).
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

      // Check super_admin first — they pick a tenant via SuperAdmin page
      const { data: superRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (superRow) {
        const impersonated = getImpersonatedTenantId();
        if (impersonated) {
          if (!cancelled) {
            setTenantId(impersonated);
            setLoading(false);
          }
          return;
        }
        // Fallback: if super_admin is also a member of a tenant, use that one
        // so they can work on it directly without first picking via SuperAdmin.
        const { data: ownMembership } = await supabase
          .from("user_tenants")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) {
          setTenantId(ownMembership?.tenant_id ?? null);
          setLoading(false);
        }
        return;
      }

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

  const { data: byDomain } = await supabase
    .from("tenants")
    .select("id")
    .eq("domain", host)
    .eq("is_active", true)
    .maybeSingle();

  if (byDomain?.id) return byDomain.id;

  const { data: fallback } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "visi")
    .maybeSingle();

  return fallback?.id ?? null;
};
