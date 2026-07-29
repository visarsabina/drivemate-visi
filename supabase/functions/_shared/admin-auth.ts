// Shared admin authentication helper for Marketing AI edge functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export interface AdminContext {
  userId: string;
  tenantId: string;
  admin: SupabaseClient;
  userClient: SupabaseClient;
}

/** Verifies the caller is an admin (or super admin) and resolves their tenant. */
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: isSuper }, roleRes, tenantRes] = await Promise.all([
    userClient.rpc("is_super_admin"),
    userClient.from("user_roles").select("role").eq("user_id", userData.user.id),
    userClient.rpc("get_user_tenant_id"),
  ]);

  const isAdmin = Boolean(isSuper) || (roleRes.data ?? []).some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) return json({ error: "Vetëm adminët mund ta përdorin këtë funksion" }, 403);

  const tenantId = (tenantRes.data as string | null) ?? "";
  if (!tenantId) return json({ error: "Nuk u gjet autoshkolla e përdoruesit" }, 400);

  return { userId: userData.user.id, tenantId, admin, userClient };
}
