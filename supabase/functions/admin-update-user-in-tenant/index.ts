// Admin-only edge function: update a tenant user's name and/or password.
// Caller must be admin and target user must belong to caller's tenant.
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
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller must be admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Access denied: admin role required" }, 403);

    // Caller tenant
    const { data: tenantRow } = await admin
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (!tenantRow) return json({ error: "Caller has no tenant" }, 400);
    const callerTenantId = tenantRow.tenant_id;

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.target_user_id ?? "").trim();
    const firstName = body.first_name === undefined ? null : String(body.first_name ?? "").trim();
    const lastName = body.last_name === undefined ? null : String(body.last_name ?? "").trim();
    const password = body.password === undefined ? null : String(body.password ?? "");

    if (!targetUserId) return json({ error: "target_user_id është i detyrueshëm" }, 400);
    if (password !== null && password.length > 0 && password.length < 6) {
      return json({ error: "Fjalëkalimi duhet të ketë së paku 6 karaktere" }, 400);
    }

    // Target must be in the same tenant (or be a candidate of that tenant)
    const { data: targetTenant } = await admin
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", targetUserId)
      .eq("tenant_id", callerTenantId)
      .maybeSingle();

    let belongs = !!targetTenant;
    if (!belongs) {
      const { data: cand } = await admin
        .from("candidates")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("tenant_id", callerTenantId)
        .maybeSingle();
      belongs = !!cand;
    }
    if (!belongs) return json({ error: "Përdoruesi nuk i përket autoshkollës tuaj" }, 403);

    // Fetch current metadata to merge first/last name without losing existing fields
    const updates: Record<string, unknown> = {};
    if (password && password.length >= 6) updates.password = password;
    if (firstName !== null || lastName !== null) {
      const { data: existing } = await admin.auth.admin.getUserById(targetUserId);
      const meta = (existing.user?.user_metadata as Record<string, unknown>) ?? {};
      const newFirst = firstName !== null ? firstName : (meta.first_name as string | undefined) ?? "";
      const newLast = lastName !== null ? lastName : (meta.last_name as string | undefined) ?? "";
      updates.user_metadata = {
        ...meta,
        first_name: newFirst,
        last_name: newLast,
        full_name: `${newFirst} ${newLast}`.trim(),
      };
    }

    if (Object.keys(updates).length === 0) {
      return json({ error: "Asgjë për të përditësuar" }, 400);
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, updates);
    if (updErr) return json({ error: "Përditësimi dështoi: " + updErr.message }, 500);

    return json({ ok: true, user_id: targetUserId });
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
