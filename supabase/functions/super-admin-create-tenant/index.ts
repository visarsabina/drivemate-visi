import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateTenantPayload {
  // Tenant
  name: string;
  slug: string;
  domain?: string;
  phone?: string;
  address?: string;
  email?: string;
  director_name?: string;
  primary_color?: string;
  // Admin user
  admin_email: string;
  admin_password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller JWT and that they are super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Invalid token" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check super_admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "Access denied: super_admin role required" }, 403);
    }

    const payload = (await req.json()) as CreateTenantPayload;

    // Basic validation
    if (!payload.name || !payload.slug) {
      return json({ error: "name and slug are required" }, 400);
    }
    if (!payload.admin_email || !payload.admin_password) {
      return json(
        { error: "admin_email and admin_password are required" },
        400,
      );
    }
    if (payload.admin_password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    if (!/^[a-z0-9-]+$/.test(payload.slug)) {
      return json(
        { error: "Slug must contain only lowercase letters, digits, hyphens" },
        400,
      );
    }

    // Check slug uniqueness
    const { data: existingSlug } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", payload.slug)
      .maybeSingle();
    if (existingSlug) {
      return json({ error: "Slug already in use" }, 409);
    }

    // Create or fetch admin user
    let adminUserId: string;
    const { data: createdUser, error: createErr } = await admin.auth.admin
      .createUser({
        email: payload.admin_email,
        password: payload.admin_password,
        email_confirm: true,
      });

    if (createErr) {
      // If already exists, look it up
      if (
        createErr.message?.toLowerCase().includes("already") ||
        (createErr as { code?: string }).code === "email_exists"
      ) {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list.users.find(
          (u) => u.email?.toLowerCase() === payload.admin_email.toLowerCase(),
        );
        if (!existing) {
          return json({ error: "User exists but could not be found" }, 500);
        }
        adminUserId = existing.id;
      } else {
        return json({ error: createErr.message }, 400);
      }
    } else {
      adminUserId = createdUser.user!.id;
    }

    // Create tenant + link admin via the SECURITY DEFINER function
    const { data: tenantId, error: rpcErr } = await admin.rpc(
      "create_tenant_with_admin",
      {
        _name: payload.name,
        _slug: payload.slug,
        _domain: payload.domain ?? "",
        _phone: payload.phone ?? "",
        _address: payload.address ?? "",
        _email: payload.email ?? "",
        _director_name: payload.director_name ?? "",
        _primary_color: payload.primary_color ?? "",
        _admin_user_id: adminUserId,
      },
    );

    if (rpcErr) {
      return json({ error: rpcErr.message }, 400);
    }

    return json({
      success: true,
      tenant_id: tenantId,
      admin_user_id: adminUserId,
      admin_email: payload.admin_email,
    }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
