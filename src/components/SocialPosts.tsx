import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Copy, Check, Image as ImageIcon, Save, Send, Trash2, RefreshCw, Upload, Download,
} from "lucide-react";

const PLATFORMS = ["Facebook", "Instagram", "TikTok", "LinkedIn"];
const TONES = ["Miqësor", "Profesional", "Argëtues", "Motivues", "Urgjent (ofertë)"];
const LENGTHS = ["Shkurt", "Mesatar", "Gjatë"];

const IDEAS = [
  "Regjistrimet e reja për kategorinë B janë të hapura",
  "Ofertë speciale për orë plotësuese praktike",
  "Urime kandidatëve që kaluan provimin këtë javë",
  "Këshilla sigurie në trafik për vozitësit e rinj",
  "Prezantimi i instruktorëve tanë",
];

interface SocialPost {
  id: string;
  topic: string | null;
  platform: string;
  content: string;
  image_url: string | null;
  status: string;
  published_at: string | null;
  publish_error: string | null;
  created_at: string;
}

const db = supabase as any;

const invoke = async (fn: string, body: unknown) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429) throw new Error("Shumë kërkesa — provoni pas pak.");
    if (res.status === 402) throw new Error("Kreditet e AI kanë mbaruar.");
    throw new Error(payload?.error ?? "Veprimi dështoi.");
  }
  return payload;
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  published: "I publikuar",
};

const SocialPosts = () => {
  const { branding } = useTenantBranding();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [tone, setTone] = useState("Miqësor");
  const [length, setLength] = useState("Mesatar");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const [imageLoading, setImageLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    const { data, error } = await db
      .from("social_posts")
      .select("id, topic, platform, content, image_url, status, published_at, publish_error, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error("Ngarkimi i postimeve dështoi.");
    const rows = (data ?? []) as SocialPost[];
    setPosts(rows);
    setPostsLoading(false);

    const withImages = rows.filter((p) => p.image_url && !p.image_url.startsWith("http"));
    if (withImages.length) {
      const { data: signed } = await supabase.storage
        .from("social-images")
        .createSignedUrls(withImages.map((p) => p.image_url as string), 3600);
      const map: Record<string, string> = {};
      (signed ?? []).forEach((s, i) => {
        if (s.signedUrl) map[withImages[i].id] = s.signedUrl;
      });
      setPreviews(map);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const generate = async () => {
    if (!topic.trim()) {
      toast.error("Shkruani temën e postimit.");
      return;
    }
    setLoading(true);
    setVariants([]);
    try {
      const payload = await invoke("social-posts", {
        topic, platform, tone, length, contact,
        schoolName: branding?.name ?? "Auto Shkolla Visi",
      });
      setVariants(payload.variants ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Gjenerimi dështoi.");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!topic.trim()) {
      toast.error("Shkruani temën për të gjeneruar foton.");
      return;
    }
    setImageLoading(true);
    try {
      const payload = await invoke("social-image", {
        prompt: topic,
        schoolName: branding?.name ?? "Auto Shkolla Visi",
        basePath: imagePath ?? undefined,
      });
      setImagePath(payload.path ?? null);
      setImagePreview(payload.url ?? null);
      toast.success(imagePath ? "Fotoja u kombinua!" : "Fotoja u gjenerua!");
    } catch (e: any) {
      toast.error(e?.message ?? "Gjenerimi i fotos dështoi.");
    } finally {
      setImageLoading(false);
    }
  };


  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Zgjidhni një skedar fotografie.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fotoja duhet të jetë nën 10MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: tenantId, error: tErr } = await supabase.rpc("get_user_tenant_id");
      if (tErr || !tenantId) throw new Error("Nuk u gjet autoshkolla.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("social-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: signed } = await supabase.storage
        .from("social-images")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      setImagePath(path);
      setImagePreview(signed?.signedUrl ?? null);
      toast.success("Fotoja u ngarkua!");
    } catch (e: any) {
      toast.error(e?.message ?? "Ngarkimi dështoi.");
    } finally {
      setUploading(false);
    }
  };

  const savePost = async (content: string) => {
    try {
      const { data: tenantId, error: tErr } = await supabase.rpc("get_user_tenant_id");
      if (tErr || !tenantId) throw new Error("Nuk u gjet autoshkolla.");
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await db.from("social_posts").insert({
        tenant_id: tenantId,
        topic,
        platform,
        tone,
        length,
        content,
        image_url: imagePath,
        status: "draft",
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
      toast.success("Postimi u ruajt si draft.");
      loadPosts();
    } catch (e: any) {
      toast.error(e?.message ?? "Ruajtja dështoi.");
    }
  };

  const publish = async (post: SocialPost) => {
    setBusyId(post.id);
    try {
      await invoke("social-publish", { postId: post.id });
      toast.success("Postimi u publikua!");
      loadPosts();
    } catch (e: any) {
      toast.error(e?.message ?? "Publikimi dështoi.");
      loadPosts();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    const { error } = await db.from("social_posts").delete().eq("id", id);
    if (error) toast.error("Fshirja dështoi.");
    else {
      toast.success("U fshi.");
      setPosts((p) => p.filter((x) => x.id !== id));
    }
    setBusyId(null);
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success("Fotoja u ruajt!");
    } catch {
      toast.error("Ruajtja e fotos dështoi.");
    }
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      toast.success("U kopjua!");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Kopjimi dështoi.");
    }
  };

  return (
    <Tabs defaultValue="generate" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="generate">Gjenero</TabsTrigger>
        <TabsTrigger value="library">Postimet ({posts.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-4">
        <Card className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Tema e postimit</Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="P.sh. Ofertë 10% zbritje për regjistrimet e kategorisë B gjatë gushtit"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Platforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Toni</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gjatësia</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Kontakti (opsional)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="044 241 200 · Rr. Zahir Pajaziti"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gjenero tekstin
            </Button>
            <Button variant="outline" onClick={generateImage} disabled={imageLoading}>
              {imageLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              {imagePath ? "Kombino me AI" : "Gjenero foton"}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Ngarko foto
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </div>

          {imagePreview && (
            <div className="space-y-2">
              <Label>Fotoja e gjeneruar</Label>
              <img
                src={imagePreview}
                alt="Foto e gjeneruar për postimin në rrjete sociale"
                className="max-h-64 w-full rounded-lg border border-border object-contain"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadImage(imagePreview, `postim-${Date.now()}.png`)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Ruaj foton
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setImagePath(null); setImagePreview(null); }}
                >
                  Hiq foton
                </Button>
              </div>
            </div>
          )}
        </Card>

        {variants.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {variants.map((v, i) => (
              <Card key={i} className="flex flex-col gap-3 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copy(v, i)}>
                    {copied === i ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    Kopjo
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => savePost(v)}>
                    <Save className="mr-2 h-4 w-4" />
                    Ruaj
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="library" className="space-y-3">
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={postsLoading}>
          {postsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Rifresko
        </Button>

        {!postsLoading && posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Ende nuk ka postime të ruajtura.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{post.platform}</Badge>
                <Badge variant={post.status === "published" ? "default" : "outline"}>
                  {statusLabel[post.status] ?? post.status}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString("sq-AL")}
                </span>
              </div>

              {previews[post.id] && (
                <img
                  src={previews[post.id]}
                  alt={`Foto e postimit për ${post.platform}`}
                  className="max-h-48 w-full rounded-lg border border-border object-cover"
                />
              )}

              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

              {post.publish_error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {post.publish_error}
                </p>
              )}

              <div className="mt-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(post.content, -1)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={busyId === post.id || post.status === "published"}
                  onClick={() => publish(post)}
                >
                  {busyId === post.id
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Send className="mr-2 h-4 w-4" />}
                  {post.status === "published" ? "I publikuar" : "Publiko"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === post.id}
                  onClick={() => remove(post.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SocialPosts;
