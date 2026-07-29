// Publishes a saved social post to Facebook, Instagram or TikTok.
import { requireAdmin, corsHeaders, json } from "../_shared/admin-auth.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

interface PostRow {
  id: string;
  tenant_id: string;
  content: string;
  image_url: string | null;
  platform: string;
}

/** Turns a stored bucket path into a temporary public URL the provider can fetch. */
async function signImage(admin: any, imagePath: string | null): Promise<string | null> {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const { data } = await admin.storage.from("social-images").createSignedUrl(imagePath, 60 * 60);
  return data?.signedUrl ?? null;
}

async function readError(res: Response) {
  const text = await res.text();
  return `[${res.status}] ${text}`;
}

async function publishFacebook(content: string, imageUrl: string | null) {
  const pageId = Deno.env.get("META_PAGE_ID");
  const token = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  if (!pageId || !token) {
    throw new Error("Facebook nuk është i konfiguruar (META_PAGE_ID / META_PAGE_ACCESS_TOKEN).");
  }
  const url = imageUrl ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
  const params = new URLSearchParams({ access_token: token });
  if (imageUrl) {
    params.set("url", imageUrl);
    params.set("caption", content);
  } else {
    params.set("message", content);
  }
  const res = await fetch(url, { method: "POST", body: params });
  if (!res.ok) throw new Error(`Facebook: ${await readError(res)}`);
  const data = await res.json();
  return String(data.post_id ?? data.id ?? "");
}

async function publishInstagram(content: string, imageUrl: string | null) {
  const igUserId = Deno.env.get("META_IG_USER_ID");
  const token = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  if (!igUserId || !token) {
    throw new Error("Instagram nuk është i konfiguruar (META_IG_USER_ID / META_PAGE_ACCESS_TOKEN).");
  }
  if (!imageUrl) throw new Error("Instagram kërkon një foto për postim.");

  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption: content,
    access_token: token,
  });
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, { method: "POST", body: createParams });
  if (!createRes.ok) throw new Error(`Instagram: ${await readError(createRes)}`);
  const { id: creationId } = await createRes.json();

  const publishParams = new URLSearchParams({ creation_id: creationId, access_token: token });
  const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, { method: "POST", body: publishParams });
  if (!pubRes.ok) throw new Error(`Instagram: ${await readError(pubRes)}`);
  const data = await pubRes.json();
  return String(data.id ?? "");
}

async function publishTikTok(content: string, imageUrl: string | null) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const tiktokKey = Deno.env.get("TIKTOK_API_KEY");
  if (!lovableKey || !tiktokKey) {
    throw new Error("TikTok nuk është i lidhur ende. Lidhni llogarinë TikTok për të publikuar.");
  }
  if (!imageUrl) throw new Error("TikTok kërkon të paktën një foto ose video.");

  const res = await fetch("https://connector-gateway.lovable.dev/tiktok/post/publish/content/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tiktokKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: { title: content.slice(0, 90), description: content.slice(0, 2000) },
      source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [imageUrl] },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }),
  });
  if (!res.ok) throw new Error(`TikTok: ${await readError(res)}`);
  const data = await res.json();
  if (data?.error && data.error.code && data.error.code !== "ok") {
    throw new Error(`TikTok: ${data.error.message ?? data.error.code}`);
  }
  return String(data?.data?.publish_id ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    const body = await req.json().catch(() => ({}));
    const postId = String(body.postId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(postId)) return json({ error: "postId i pavlefshëm" }, 400);

    const { data: post, error } = await ctx.userClient
      .from("social_posts")
      .select("id, tenant_id, content, image_url, platform")
      .eq("id", postId)
      .maybeSingle<PostRow>();
    if (error || !post) return json({ error: "Postimi nuk u gjet" }, 404);

    const imageUrl = await signImage(ctx.admin, post.image_url);
    const platform = (post.platform || "").toLowerCase();

    let externalId = "";
    try {
      if (platform.includes("facebook")) externalId = await publishFacebook(post.content, imageUrl);
      else if (platform.includes("instagram")) externalId = await publishInstagram(post.content, imageUrl);
      else if (platform.includes("tiktok")) externalId = await publishTikTok(post.content, imageUrl);
      else return json({ error: `Publikimi automatik nuk mbështetet për ${post.platform}` }, 400);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publikimi dështoi";
      console.error("publish failed:", message);
      await ctx.admin.from("social_posts").update({ publish_error: message }).eq("id", postId);
      return json({ error: message }, 502);
    }

    await ctx.admin
      .from("social_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_post_id: externalId,
        publish_error: null,
      })
      .eq("id", postId);

    return json({ ok: true, externalId });
  } catch (e) {
    console.error("social-publish error:", e);
    return json({ error: e instanceof Error ? e.message : "Gabim i papritur" }, 500);
  }
});
