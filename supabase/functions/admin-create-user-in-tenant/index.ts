// Admin-only edge function: create a new auth user and add them to caller's tenant.
// Avoids the client-side issue where supabase.auth.signUp logs out the admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // Validate caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    // Service-role client for admin work
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check caller is admin
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      return json({ error: "Access denied: admin role required" }, 403);
    }

    // Get caller's tenant
    const { data: tenantRow, error: tenantErr } = await admin
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (tenantErr || !tenantRow) {
      return json({ error: "Caller has no tenant" }, 400);
    }
    const tenantId = tenantRow.tenant_id;

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const firstName = String(body.first_name ?? "").trim();
    const lastName = String(body.last_name ?? "").trim();
    // Backwards compatible: prefer explicit `role`, fall back to legacy `as_admin`.
    const requestedRoleRaw = String(body.role ?? "").trim();
    const allowedRoles = ["admin", "instructor", "user"] as const;
    type AllowedRole = typeof allowedRoles[number];
    const role: AllowedRole = (allowedRoles as readonly string[]).includes(requestedRoleRaw)
      ? (requestedRoleRaw as AllowedRole)
      : (Boolean(body.as_admin ?? true) ? "admin" : "user");

    if (!email || !password || password.length < 6) {
      return json({ error: "Email and password (min 6 chars) are required" }, 400);
    }
    if (!firstName || !lastName) {
      return json({ error: "First name and last name are required" }, 400);
    }

    // Try to create the user; if already exists, fetch their id
    let targetUserId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
    });

    if (createErr) {
      // If the email already exists, look it up
      const { data: list, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) {
        return json({ error: "Failed to lookup user: " + listErr.message }, 500);
      }
      const existing = list.users.find((u) => u.email?.toLowerCase() === email);
      if (!existing) {
        return json({ error: createErr.message }, 400);
      }
      targetUserId = existing.id;
    } else {
      targetUserId = created.user?.id ?? null;
    }

    if (!targetUserId) {
      return json({ error: "Could not resolve user id" }, 500);
    }

    // Link user to tenant
    const { error: linkErr } = await admin
      .from("user_tenants")
      .upsert(
        { user_id: targetUserId, tenant_id: tenantId },
        { onConflict: "user_id,tenant_id", ignoreDuplicates: true },
      );
    if (linkErr) {
      return json({ error: "Failed to link tenant: " + linkErr.message }, 500);
    }

    // Assign requested role (admin or instructor). "user" => no role row.
    if (role === "admin" || role === "instructor") {
      const { error: roleAssignErr } = await admin
        .from("user_roles")
        .upsert(
          { user_id: targetUserId, role },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
      if (roleAssignErr) {
        return json({ error: "Failed to assign role: " + roleAssignErr.message }, 500);
      }
    }

    return json({ user_id: targetUserId, email, tenant_id: tenantId, role });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
