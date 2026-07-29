// Generates a marketing image with Lovable AI and stores it in the social-images bucket.
import { requireAdmin, corsHeaders, json } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY mungon" }, 500);

    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt ?? "").trim().slice(0, 1200);
    const schoolName = String(body.schoolName ?? "Autoshkolla").slice(0, 120);
    const basePath = typeof body.basePath === "string" ? body.basePath : "";
    if (!prompt) return json({ error: "Përshkrimi i fotos është i detyrueshëm" }, 400);

    // Optional: an uploaded image to combine with / edit.
    let baseDataUrl: string | null = null;
    if (basePath) {
      if (!basePath.startsWith(`${ctx.tenantId}/`)) {
        return json({ error: "Fotoja bazë nuk i përket kësaj autoshkolle" }, 403);
      }
      const { data: file, error: dlErr } = await ctx.admin.storage
        .from("social-images")
        .download(basePath);
      if (dlErr || !file) return json({ error: "Fotoja e ngarkuar nuk u gjet" }, 400);
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 8192) {
        bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      baseDataUrl = `data:${file.type || "image/png"};base64,${btoa(bin)}`;
    }

    const fullPrompt = baseDataUrl
      ? `Kombino dhe përpuno fotografinë e dhënë në një fotografi marketingu profesionale për autoshkollën ` +
        `"${schoolName}" në Kosovë. Ruaj personat/objektet kryesore nga fotoja origjinale. Tema: ${prompt}. ` +
        `Stil modern, ndriçim natyral, ngjyra të ngrohta, format katror për Instagram dhe Facebook. ` +
        `Pa tekst të shkruar në foto.`
      : `Fotografi marketingu profesionale për autoshkollën "${schoolName}" në Kosovë. ` +
        `Tema: ${prompt}. Stil modern, ndriçim natyral, ngjyra të ngrohta, format katror i përshtatshëm ` +
        `për Instagram dhe Facebook. Pa tekst të shkruar në foto.`;

    const content = baseDataUrl
      ? [
          { type: "text", text: fullPrompt },
          { type: "image_url", image_url: { url: baseDataUrl } },
        ]
      : fullPrompt;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });


    if (!aiRes.ok) {
      const details = await aiRes.text();
      console.error(`Image gateway failed [${aiRes.status}]: ${details}`);
      if (aiRes.status === 429) return json({ error: "Shumë kërkesa — provoni pas pak." }, 429);
      if (aiRes.status === 402) return json({ error: "Kreditet e AI kanë mbaruar." }, 402);
      return json({ error: "Gjenerimi i fotos dështoi", details }, aiRes.status);
    }

    const payload = await aiRes.json();
    const b64: string | undefined = payload?.data?.[0]?.b64_json;
    if (!b64) {
      console.error("No image payload:", JSON.stringify(payload).slice(0, 500));
      return json({ error: "Modeli nuk ktheu foto" }, 502);
    }

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${ctx.tenantId}/${crypto.randomUUID()}.png`;

    const { error: uploadErr } = await ctx.admin.storage
      .from("social-images")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (uploadErr) {
      console.error("Upload failed:", uploadErr.message);
      return json({ error: "Ruajtja e fotos dështoi", details: uploadErr.message }, 500);
    }

    const { data: signed } = await ctx.admin.storage
      .from("social-images")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    return json({ path, url: signed?.signedUrl ?? null });
  } catch (e) {
    console.error("social-image error:", e);
    return json({ error: e instanceof Error ? e.message : "Gabim i papritur" }, 500);
  }
});
