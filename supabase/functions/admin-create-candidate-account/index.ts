// Admin-only edge function: create an auth account for a candidate
// (using the personal number as the login identifier) and link it to the
// existing candidate row via candidates.user_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const candidateEmail = (personal: string) => `c${personal}@candidate.local`;

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

    const { data: tenantRow } = await admin
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (!tenantRow) return json({ error: "Caller has no tenant" }, 400);
    const tenantId = tenantRow.tenant_id;

    const body = await req.json().catch(() => ({}));
    const candidateId = String(body.candidate_id ?? "");
    const password = String(body.password ?? "");
    if (!candidateId || !password || password.length < 6) {
      return json({ error: "candidate_id dhe fjalëkalim min 6 karaktere janë të detyrueshëm" }, 400);
    }

    // Fetch candidate (must belong to caller tenant)
    const { data: cand, error: candErr } = await admin
      .from("candidates")
      .select("id, tenant_id, numri_personal, user_id, emri, mbiemri")
      .eq("id", candidateId)
      .maybeSingle();
    if (candErr || !cand) return json({ error: "Kandidati nuk u gjet" }, 404);
    if (cand.tenant_id !== tenantId) return json({ error: "Kandidati i përket një autoshkolle tjetër" }, 403);
    if (!cand.numri_personal || !/^\d{10}$/.test(cand.numri_personal)) {
      return json({ error: "Kandidati duhet të ketë numër personal me 10 shifra" }, 400);
    }

    const email = candidateEmail(cand.numri_personal);

    let targetUserId: string | null = cand.user_id ?? null;

    if (targetUserId) {
      // Account already exists -> just reset password
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, { password });
      if (updErr) return json({ error: "Përditësimi i fjalëkalimit dështoi: " + updErr.message }, 500);
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { candidate_id: candidateId, full_name: `${cand.emri} ${cand.mbiemri}` },
      });
      if (createErr) {
        // Try to recover if email already exists (re-use account)
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find((u) => u.email?.toLowerCase() === email);
        if (!existing) return json({ error: createErr.message }, 400);
        targetUserId = existing.id;
        const { error: pwErr } = await admin.auth.admin.updateUserById(existing.id, { password });
        if (pwErr) return json({ error: pwErr.message }, 500);
      } else {
        targetUserId = created.user?.id ?? null;
      }
    }

    if (!targetUserId) return json({ error: "Could not resolve user id" }, 500);

    // Link candidate -> user
    const { error: linkErr } = await admin
      .from("candidates")
      .update({ user_id: targetUserId })
      .eq("id", candidateId);
    if (linkErr) return json({ error: "Lidhja dështoi: " + linkErr.message }, 500);

    // Assign candidate role
    const { error: roleAssignErr } = await admin
      .from("user_roles")
      .upsert({ user_id: targetUserId, role: "candidate" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (roleAssignErr) return json({ error: "Roli dështoi: " + roleAssignErr.message }, 500);

    return json({ user_id: targetUserId, email, candidate_id: candidateId });
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
