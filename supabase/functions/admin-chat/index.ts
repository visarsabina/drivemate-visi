// Admin chat: streams responses using Lovable AI Gateway with tools scoped to
// the caller's tenant. Only admins (or super_admin) may use this endpoint.
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.20";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Role check via RPCs (RLS-safe)
    const [{ data: isSuper }, roleRes] = await Promise.all([
      userClient.rpc("is_super_admin"),
      userClient.from("user_roles").select("role").eq("user_id", userData.user.id),
    ]);
    const isAdmin = Boolean(isSuper) || (roleRes.data ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only admins can use this chat" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const model = provider("google/gemini-2.5-pro");

    // ---- Tools scoped to caller (RLS applies) ----
    const tools = {
      list_candidates: tool({
        description: "Liston kandidatët e autoshkollës. Filtro me query (kërko emrin/mbiemrin/numrin personal) ose statusin.",
        inputSchema: z.object({
          query: z.string().optional().describe("Emri, mbiemri ose numri personal"),
          status: z.enum(["regjistuar", "ne_proces", "kaluar", "deshtur"]).optional(),
          limit: z.number().int().min(1).max(50).default(20),
        }),
        execute: async ({ query, status, limit }) => {
          let q = userClient.from("candidates").select(
            "id,numri_regjistrimit,emri,mbiemri,numri_personal,telefon,kategoria,statusi,data_regjistrimit,shuma_marreveshjes",
          ).order("data_regjistrimit", { ascending: false }).limit(limit ?? 20);
          if (status) q = q.eq("statusi", status);
          if (query) q = q.or(`emri.ilike.%${query}%,mbiemri.ilike.%${query}%,numri_personal.ilike.%${query}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, candidates: data };
        },
      }),
      get_candidate_details: tool({
        description: "Detajet e plota të një kandidati përfshirë pagesat dhe borxhin.",
        inputSchema: z.object({ candidate_id: z.string().uuid() }),
        execute: async ({ candidate_id }) => {
          const { data: c, error } = await userClient.from("candidates").select("*").eq("id", candidate_id).maybeSingle();
          if (error) return { error: error.message };
          if (!c) return { error: "Not found" };
          const { data: payments } = await userClient.from("candidate_payments").select("shuma,data,menyra,pershkrimi").eq("candidate_id", candidate_id).order("data", { ascending: false });
          const paid = (payments ?? []).reduce((s: number, p: any) => s + Number(p.shuma || 0), 0);
          return { candidate: c, payments, total_paid: paid, borxhi: Math.max(0, Number(c.shuma_marreveshjes || 0) - paid) };
        },
      }),
      stats_summary: tool({
        description: "Përmbledhje: numri i kandidatëve sipas statusit, mjetet, punëtorët dhe të hyrat e këtij muaji.",
        inputSchema: z.object({}),
        execute: async () => {
          const [candRes, vehRes, empRes, payRes] = await Promise.all([
            userClient.from("candidates").select("statusi"),
            userClient.from("vehicles").select("id", { count: "exact", head: true }),
            userClient.from("employees").select("id", { count: "exact", head: true }),
            userClient.from("candidate_payments").select("shuma,data"),
          ]);
          const cands = candRes.data ?? [];
          const byStatus: Record<string, number> = {};
          for (const c of cands) byStatus[c.statusi] = (byStatus[c.statusi] ?? 0) + 1;
          const now = new Date();
          const thisMonth = (payRes.data ?? []).filter((p: any) => {
            const d = new Date(p.data); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).reduce((s: number, p: any) => s + Number(p.shuma || 0), 0);
          return {
            candidates_total: cands.length,
            candidates_by_status: byStatus,
            vehicles_total: vehRes.count ?? 0,
            employees_total: empRes.count ?? 0,
            revenue_this_month: thisMonth,
          };
        },
      }),
      list_registrations: tool({
        description: "Regjistrimet online nga vizitorët e faqes publike.",
        inputSchema: z.object({
          status: z.enum(["new", "contacted", "converted", "rejected"]).optional(),
          limit: z.number().int().min(1).max(50).default(20),
        }),
        execute: async ({ status, limit }) => {
          let q = userClient.from("registrations").select("id,full_name,email,phone,message,status,created_at").order("created_at", { ascending: false }).limit(limit ?? 20);
          if (status) q = q.eq("status", status);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, registrations: data };
        },
      }),
      list_vehicles: tool({
        description: "Mjetet e autoshkollës.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await userClient.from("vehicles").select("id,marka,modeli,targa,kategoria,viti,kilometrazha").order("marka");
          return error ? { error: error.message } : { count: data?.length ?? 0, vehicles: data };
        },
      }),
      list_employees: tool({
        description: "Punëtorët e autoshkollës (instruktorë, staf).",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await userClient.from("employees").select("id,emri,mbiemri,pozita,telefoni,email").order("emri");
          return error ? { error: error.message } : { count: data?.length ?? 0, employees: data };
        },
      }),
      list_exams: tool({
        description: "Liston provimet (teori/praktik) të kandidatëve. Mund të filtrohen sipas datës (from/to YYYY-MM-DD), llojit ose statusit. Përdore për pyetje si 'kush ka provim nesër/sot/këtë javë'.",
        inputSchema: z.object({
          from: z.string().optional().describe("Data e fillimit YYYY-MM-DD (përfshirë)."),
          to: z.string().optional().describe("Data e mbarimit YYYY-MM-DD (përfshirë)."),
          exam_type: z.string().optional().describe("teori ose praktik"),
          status: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(50),
        }),
        execute: async ({ from, to, exam_type, status, limit }) => {
          let q = userClient
            .from("candidate_exams")
            .select("id,candidate_id,exam_date,exam_time,exam_type,status,kategoria,location,notes,candidates(emri,mbiemri,numri_personal,telefon,kategoria)")
            .order("exam_date", { ascending: true })
            .order("exam_time", { ascending: true })
            .limit(limit ?? 50);
          if (from) q = q.gte("exam_date", from);
          if (to) q = q.lte("exam_date", to);
          if (exam_type) q = q.eq("exam_type", exam_type as any);
          if (status) q = q.eq("status", status as any);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, exams: data };
        },
      }),
      list_lessons: tool({
        description: "Liston orët e mësimit të kandidatëve. Filtro sipas datës (from/to) ose kandidatit.",
        inputSchema: z.object({
          from: z.string().optional(),
          to: z.string().optional(),
          candidate_id: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(200).default(50),
        }),
        execute: async ({ from, to, candidate_id, limit }) => {
          let q = userClient
            .from("candidate_lessons")
            .select("id,candidate_id,data,hours,candidates(emri,mbiemri,kategoria)")
            .order("data", { ascending: false })
            .limit(limit ?? 50);
          if (from) q = q.gte("data", from);
          if (to) q = q.lte("data", to);
          if (candidate_id) q = q.eq("candidate_id", candidate_id);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, lessons: data };
        },
      }),
    };

    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
    const result = streamText({
      model,
      system: `Ti je asistenti inteligjent i autoshkollës. Përgjigju GJITHMONË në gjuhën shqipe, qartë dhe konciz.

Data e sotme: ${iso} (nesër: ${tomorrow}).

RREGULLA:
- Përdor GJITHMONË veglat për të marrë të dhëna reale — mos refuzo pa provuar veglat.
- Për pyetje "sa kandidatë kam", "përmbledhje", "statistika" → thirr 'stats_summary'.
- Për pyetje për provime ("kush ka provim sot/nesër/këtë javë") → thirr 'list_exams' me from/to të përshtatshme (p.sh. nesër = from=${tomorrow}&to=${tomorrow}).
- Për pyetje për orë mësimi → thirr 'list_lessons'.
- Për borxhet ose një kandidat specifik → 'list_candidates' pastaj 'get_candidate_details'.
- Nëse data është në formatin dd.mm.yyyy, konvertoje në YYYY-MM-DD para se ta thërrasësh veglën.
- Pas thirrjes së veglës, PËRGJIGJU GJITHMONË me tekst që përmbledh rezultatin — mos e lërë përgjigjen bosh.
- Nëse vegla kthen listë të zbrazët, thuaj qartë "Nuk ka rezultate për …".
- Formato monedhat si "123.45 €".`,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(15),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("admin-chat error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
