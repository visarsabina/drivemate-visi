import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { formatDateDMY } from "@/lib/date";

const PLATFORMS = ["all", "facebook", "instagram", "tiktok"];
const CONTENT_TYPES = [
  "offer",
  "driving_tip",
  "traffic_rules",
  "student_success",
  "quiz",
  "promotion",
  "announcement",
];
const CATEGORIES = ["B", "BE", "C1", "C", "D"];
const STATUSES = ["draft", "scheduled", "published"];

interface PostRow {
  id: string;
  title: string | null;
  platform: string;
  category: string | null;
  content_type: string;
  caption: string | null;
  hashtags: string | null;
  cta: string | null;
  image_url: string | null;
  status: string;
  publish_date: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  platform: "all",
  category: "B",
  content_type: "offer",
  caption: "",
  hashtags: "",
  cta: "",
  image_url: "",
  status: "draft",
  publish_date: "",
};

const PostsManager = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fPlatform, setFPlatform] = useState("all-f");
  const [fStatus, setFStatus] = useState("all-f");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_posts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Leximi dështoi", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as PostRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (fPlatform !== "all-f" && r.platform !== fPlatform) return false;
      if (fStatus !== "all-f" && r.status !== fStatus) return false;
      if (!needle) return true;
      return [r.title, r.caption, r.hashtags, r.cta, r.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, fPlatform, fStatus]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (r: PostRow) => {
    setEditId(r.id);
    setForm({
      title: r.title ?? "",
      platform: r.platform,
      category: r.category ?? "B",
      content_type: r.content_type,
      caption: r.caption ?? "",
      hashtags: r.hashtags ?? "",
      cta: r.cta ?? "",
      image_url: r.image_url ?? "",
      status: r.status,
      publish_date: r.publish_date ? r.publish_date.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!tenantId) return;
    if (!form.title.trim()) {
      toast({ title: "Titulli është i detyrueshëm", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      title: form.title.trim(),
      platform: form.platform,
      category: form.category,
      driving_category: form.category,
      content_type: form.content_type,
      tone: "professional",
      caption: form.caption || null,
      hashtags: form.hashtags || null,
      cta: form.cta || null,
      image_url: form.image_url || null,
      status: form.status,
      publish_date: form.publish_date ? new Date(form.publish_date).toISOString() : null,
      created_by: user?.id ?? null,
    };
    const { error } = editId
      ? await supabase.from("marketing_posts").update(payload).eq("id", editId)
      : await supabase.from("marketing_posts").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Ruajtja dështoi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editId ? "U përditësua" : "U shtua" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("marketing_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Fshirja dështoi", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "U fshi" });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Kërko postime…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={fPlatform} onValueChange={setFPlatform}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-f">Të gjitha platformat</SelectItem>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-f">Të gjitha statuset</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Shto</Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nuk ka postime.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.title || "(pa titull)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.platform} · {r.content_type} · {r.category ?? "—"}
                  </p>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              {r.caption ? (
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{r.caption}</p>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {r.publish_date ? `Publikim: ${formatDateDMY(r.publish_date)}` : formatDateDMY(r.created_at)}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Ndrysho postimin" : "Postim i re"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titulli</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kategoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lloji</Label>
                <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statusi</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teksti</Label>
              <Textarea rows={5} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Hashtag-et</Label>
              <Textarea rows={2} value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>CTA</Label>
              <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Foto (URL)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data e publikimit</Label>
                <Input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Ruaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostsManager;
