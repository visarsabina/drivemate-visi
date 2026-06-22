// Super-admin only: list admins of a tenant and reset their passwords.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: claimsData, error: claimsErr } = await admin.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      console.error("getClaims failed:", claimsErr);
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    // Caller must be super_admin
    const { data: r } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!r) return json({ error: "Access denied: super_admin required" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    const tenantId = String(body.tenant_id ?? "").trim();
    if (!tenantId) return json({ error: "tenant_id është i detyrueshëm" }, 400);

    if (action === "list") {
      // Find all admin user_ids in this tenant
      const { data: members, error: mErr } = await admin
        .from("user_tenants")
        .select("user_id")
        .eq("tenant_id", tenantId);
      if (mErr) return json({ error: mErr.message }, 500);
      const ids = (members ?? []).map((m) => m.user_id);
      if (ids.length === 0) return json({ admins: [] });

      const { data: roles } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids)
        .eq("role", "admin");
      const adminIds = (roles ?? []).map((r) => r.user_id);

      const admins: Array<{ id: string; email: string | null; full_name: string | null }> = [];
      for (const id of adminIds) {
        const { data: u } = await admin.auth.admin.getUserById(id);
        if (u?.user) {
          const meta = (u.user.user_metadata ?? {}) as Record<string, unknown>;
          admins.push({
            id: u.user.id,
            email: u.user.email ?? null,
            full_name: (meta.full_name as string) ?? null,
          });
        }
      }
      return json({ admins });
    }

    if (action === "reset_password") {
      const targetUserId = String(body.target_user_id ?? "").trim();
      const password = String(body.password ?? "");
      if (!targetUserId) return json({ error: "target_user_id mungon" }, 400);
      if (password.length < 6) return json({ error: "Fjalëkalimi duhet ≥ 6 karaktere" }, 400);

      // Verify target is admin in this tenant
      const { data: belongs } = await admin
        .from("user_tenants")
        .select("user_id")
        .eq("user_id", targetUserId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (!belongs) return json({ error: "Përdoruesi nuk i përket kësaj autoshkolle" }, 403);

      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return json({ error: "Përdoruesi nuk është admin" }, 403);

      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, { password });
      if (updErr) return json({ error: "Përditësimi dështoi: " + updErr.message }, 500);

      return json({ ok: true });
    }

    return json({ error: "Veprim i panjohur" }, 400);
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
