// Super-admin only: delete a tenant and all its data.
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

    const { data: r } = await admin
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "super_admin").maybeSingle();
    if (!r) return json({ error: "Access denied: super_admin required" }, 403);

    const body = await req.json().catch(() => ({}));
    const tenantId = String(body.tenant_id ?? "").trim();
    const confirmName = String(body.confirm_name ?? "").trim();
    if (!tenantId) return json({ error: "tenant_id është i detyrueshëm" }, 400);

    const { data: t, error: tErr } = await admin
      .from("tenants").select("id, name").eq("id", tenantId).maybeSingle();
    if (tErr || !t) return json({ error: "Autoshkolla nuk u gjet" }, 404);
    if (confirmName !== t.name) return json({ error: "Konfirmimi i emrit nuk përputhet" }, 400);

    // Delete in dependency order (in case cascades aren't set).
    const tables = [
      "candidate_exams",
      "candidate_lessons",
      "candidate_payments",
      "exam_requests",
      "candidates",
      "vehicle_services",
      "vehicles",
      "employees",
      "staff",
      "licenses",
      "registrations",
      "question_overrides",
      "activity_logs",
      "tenant_subscription_payments",
      "user_tenants",
    ];
    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("tenant_id", tenantId);
      if (error) console.warn(`delete ${table} failed:`, error.message);
    }

    const { error: delErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (delErr) return json({ error: "Fshirja dështoi: " + delErr.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
