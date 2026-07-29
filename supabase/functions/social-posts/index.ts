// Generates social media post drafts (Albanian) for the driving school.
// Admin-only. Uses Lovable AI Gateway.
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.20";
import { generateText } from "npm:ai@5.0.60";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
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
    const [{ data: isSuper }, roleRes] = await Promise.all([
      userClient.rpc("is_super_admin"),
      userClient.from("user_roles").select("role").eq("user_id", userData.user.id),
    ]);
    const isAdmin = Boolean(isSuper) || (roleRes.data ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "Vetëm adminët mund ta përdorin këtë funksion" }, 403);

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic ?? "").slice(0, 500);
    const platform = String(body.platform ?? "Facebook").slice(0, 40);
    const tone = String(body.tone ?? "Miqësor").slice(0, 40);
    const length = String(body.length ?? "Mesatar").slice(0, 40);
    const schoolName = String(body.schoolName ?? "Autoshkolla").slice(0, 120);
    const contact = String(body.contact ?? "").slice(0, 200);
    if (!topic.trim()) return json({ error: "Tema është e detyrueshme" }, 400);

    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const { text } = await generateText({
      model: provider("google/gemini-3.5-flash"),
      system: `Ti je menaxher i marketingut digjital për autoshkolla në Kosovë.
Shkruaj GJITHMONË në gjuhën shqipe, natyrshëm dhe pa gabime drejtshkrimore.
Gjenero SAKTËSISHT 3 variante postimi, të ndara me një rresht që përmban vetëm "---".
Çdo variant: tekst i gatshëm për publikim + emoji të matura + 5-8 hashtag-e relevante në fund.
Mos shto tituj si "Varianti 1", mos shto shpjegime, mos përdor markdown headers.`,
      prompt: `Autoshkolla: ${schoolName}
Platforma: ${platform}
Toni: ${tone}
Gjatësia: ${length}
Kontakti (përfshije nëse ka): ${contact || "—"}
Tema e postimit: ${topic}`,
    });

    const variants = text
      .split(/^\s*---\s*$/m)
      .map((v) => v.trim())
      .filter(Boolean);

    return json({ variants: variants.length ? variants : [text.trim()] });
  } catch (e: any) {
    console.error("social-posts error:", e);
    const msg = String(e?.message ?? e);
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return json({ error: msg }, status);
  }
});
