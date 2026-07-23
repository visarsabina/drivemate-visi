// Super-admin only: manage admins of a tenant (list, reset password, change email, add, remove).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

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
      const { data: members, error: mErr } = await admin
        .from("user_tenants").select("user_id").eq("tenant_id", tenantId);
      if (mErr) return json({ error: mErr.message }, 500);
      const ids = (members ?? []).map((m) => m.user_id);
      if (ids.length === 0) return json({ admins: [] });

      const { data: roles } = await admin
        .from("user_roles").select("user_id, role").in("user_id", ids).eq("role", "admin");
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

    const verifyAdminInTenant = async (targetUserId: string) => {
      const { data: belongs } = await admin
        .from("user_tenants").select("user_id")
        .eq("user_id", targetUserId).eq("tenant_id", tenantId).maybeSingle();
      if (!belongs) return "Përdoruesi nuk i përket kësaj autoshkolle";
      const { data: roleRow } = await admin
        .from("user_roles").select("role")
        .eq("user_id", targetUserId).eq("role", "admin").maybeSingle();
      if (!roleRow) return "Përdoruesi nuk është admin";
      return null;
    };

    if (action === "reset_password") {
      const targetUserId = String(body.target_user_id ?? "").trim();
      const password = String(body.password ?? "");
      if (!targetUserId) return json({ error: "target_user_id mungon" }, 400);
      if (password.length < 6) return json({ error: "Fjalëkalimi duhet ≥ 6 karaktere" }, 400);
      const err = await verifyAdminInTenant(targetUserId);
      if (err) return json({ error: err }, 403);
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, { password });
      if (updErr) return json({ error: "Përditësimi dështoi: " + updErr.message }, 500);
      return json({ ok: true });
    }

    if (action === "update_email") {
      const targetUserId = String(body.target_user_id ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!targetUserId) return json({ error: "target_user_id mungon" }, 400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Email i pavlefshëm" }, 400);
      const err = await verifyAdminInTenant(targetUserId);
      if (err) return json({ error: err }, 403);
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, {
        email,
        email_confirm: true,
      });
      if (updErr) return json({ error: "Përditësimi dështoi: " + updErr.message }, 500);
      return json({ ok: true });
    }

    if (action === "add_admin") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const fullName = String(body.full_name ?? "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Email i pavlefshëm" }, 400);
      if (password.length < 6) return json({ error: "Fjalëkalimi duhet ≥ 6 karaktere" }, 400);

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : {},
      });
      if (cErr || !created?.user) return json({ error: "Krijimi dështoi: " + (cErr?.message ?? "") }, 500);
      const newId = created.user.id;

      await admin.from("user_tenants").insert({ user_id: newId, tenant_id: tenantId });
      await admin.from("user_roles").insert({ user_id: newId, role: "admin" });
      return json({ ok: true, user_id: newId });
    }

    if (action === "remove_admin") {
      const targetUserId = String(body.target_user_id ?? "").trim();
      if (!targetUserId) return json({ error: "target_user_id mungon" }, 400);
      if (targetUserId === callerId) return json({ error: "Nuk mund të largosh veten" }, 400);
      const err = await verifyAdminInTenant(targetUserId);
      if (err) return json({ error: err }, 403);

      await admin.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "admin");
      await admin.from("user_tenants").delete().eq("user_id", targetUserId).eq("tenant_id", tenantId);
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
