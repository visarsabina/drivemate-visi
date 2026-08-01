import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const TYPES = ["image", "video", "logo", "document"];

interface AssetRow {
  id: string;
  title: string;
  type: string;
  url: string;
  tags: string[] | null;
  created_at: string;
}

const emptyForm = { title: "", type: "image", url: "", tags: "" };

const AssetsManager = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all-f");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_assets")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Leximi dështoi", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as AssetRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (fType !== "all-f" && r.type !== fType) return false;
      if (!needle) return true;
      return (
        r.title.toLowerCase().includes(needle) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [rows, q, fType]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (r: AssetRow) => {
    setEditId(r.id);
    setForm({ title: r.title, type: r.type, url: r.url, tags: (r.tags ?? []).join(", ") });
    setOpen(true);
  };

  const save = async () => {
    if (!tenantId) return;
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: "Titulli dhe linku janë të detyrueshëm", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      title: form.title.trim(),
      type: form.type,
      url: form.url.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      created_by: user?.id ?? null,
    };
    const { error } = editId
      ? await supabase.from("marketing_assets").update(payload).eq("id", editId)
      : await supabase.from("marketing_assets").insert(payload);
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
    const { error } = await supabase.from("marketing_assets").delete().eq("id", id);
    if (error) {
      toast({ title: "Fshirja dështoi", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "U fshi" });
  };

  const upload = async (file: File) => {
    if (!tenantId) return;
    const path = `${tenantId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await supabase.storage.from("social-images").upload(path, file);
    if (error) {
      toast({ title: "Ngarkimi dështoi", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = await supabase.storage.from("social-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    setForm((f) => ({ ...f, url: data?.signedUrl ?? path, title: f.title || file.name }));
    toast({ title: "Foto u ngarkua" });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Kërko sipas titullit ose tag-ut…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={fType} onValueChange={setFType}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-f">Të gjitha llojet</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Shto</Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nuk ka materiale.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-3 space-y-2">
              {r.type === "image" ? (
                <img src={r.url} alt={r.title} loading="lazy" className="w-full h-32 object-cover rounded-lg" />
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <Badge variant="outline">{r.type}</Badge>
              </div>
              {r.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{formatDateDMY(r.created_at)}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" asChild>
                    <a href={r.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Ndrysho materialin" : "Material i re"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titulli</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Lloji</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Linku</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tag-et (ndaj me presje)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ofertë, kategoria b" />
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

export default AssetsManager;
