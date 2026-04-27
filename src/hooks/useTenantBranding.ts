import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  director_name: string | null;
}

const cache = new Map<string, TenantBranding>();

/**
 * Convert a hex color (#RRGGBB) to "H S% L%" string for CSS HSL variables.
 * Returns null if input is invalid.
 */
const hexToHslTriplet = (hex: string): string | null => {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Apply a tenant's primary color to CSS variables (--primary, --ring, --sidebar-primary).
 */
const applyPrimaryColor = (hex: string | null) => {
  if (!hex) return;
  const triplet = hexToHslTriplet(hex);
  if (!triplet) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", triplet);
  root.style.setProperty("--ring", triplet);
  root.style.setProperty("--sidebar-primary", triplet);
};

/**
 * Loads branding for the current authenticated user's tenant and applies it.
 */
export const useTenantBranding = () => {
  const { user } = useAuth();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBranding(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);

      // Super admin? use impersonated tenant id
      let tenantId: string | null = null;
      const { data: superRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (superRow) {
        try {
          tenantId = localStorage.getItem("sa_impersonated_tenant_id");
        } catch {
          tenantId = null;
        }
      } else {
        const { data: ut } = await supabase
          .from("user_tenants")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();
        tenantId = ut?.tenant_id ?? null;
      }

      if (!tenantId) {
        if (!cancelled) {
          setBranding(null);
          setLoading(false);
        }
        return;
      }

      const cached = cache.get(tenantId);
      if (cached) {
        if (!cancelled) {
          setBranding(cached);
          applyPrimaryColor(cached.primary_color);
          setLoading(false);
        }
        return;
      }

      const { data: t } = await supabase
        .from("tenants")
        .select("id, name, slug, domain, logo_url, primary_color, phone, address, email, director_name")
        .eq("id", tenantId)
        .maybeSingle();

      if (!cancelled) {
        if (t) {
          cache.set(t.id, t as TenantBranding);
          setBranding(t as TenantBranding);
          applyPrimaryColor(t.primary_color);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { branding, loading };
};

/**
 * Loads branding for the public-facing landing page based on the current
 * hostname OR an explicit slug (for /school/:slug).
 */
export const usePublicTenantBranding = (slug?: string) => {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);

      let row: TenantBranding | null = null;

      if (slug) {
        const { data } = await supabase
          .from("tenants")
          .select("id, name, slug, domain, logo_url, primary_color, phone, address, email, director_name")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();
        row = (data as TenantBranding | null) ?? null;
      } else {
        const host = window.location.hostname.replace(/^www\./, "");
        const { data: byDomain } = await supabase
          .from("tenants")
          .select("id, name, slug, domain, logo_url, primary_color, phone, address, email, director_name")
          .eq("domain", host)
          .eq("is_active", true)
          .maybeSingle();
        row = (byDomain as TenantBranding | null) ?? null;

        if (!row) {
          // Fallback to default tenant for preview/lovable.app domains
          const { data: fallback } = await supabase
            .from("tenants")
            .select("id, name, slug, domain, logo_url, primary_color, phone, address, email, director_name")
            .eq("slug", "visi")
            .maybeSingle();
          row = (fallback as TenantBranding | null) ?? null;
        }
      }

      if (!cancelled) {
        if (row) {
          setBranding(row);
          applyPrimaryColor(row.primary_color);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { branding, loading, notFound };
};
