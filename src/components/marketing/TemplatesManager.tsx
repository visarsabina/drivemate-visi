import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, Copy } from "lucide-react";
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

interface TemplateRow {
  id: string;
  name: string;
  platform: string;
  content: string;
  created_at: string;
}

const emptyForm = { name: "", platform: "all", content: "" };

const TemplatesManager = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fPlatform, setFPlatform] = useState("all-f");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Leximi dështoi", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as TemplateRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (fPlatform !== "all-f" && r.platform !== fPlatform) return false;
      if (!needle) return true;
      return r.name.toLowerCase().includes(needle) || r.content.toLowerCase().includes(needle);
    });
  }, [rows, q, fPlatform]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (r: TemplateRow) => {
    setEditId(r.id);
    setForm({ name: r.name, platform: r.platform, content: r.content });
    setOpen(true);
  };

  const save = async () => {
    if (!tenantId) return;
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: "Emri dhe përmbajtja janë të detyrueshme", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      platform: form.platform,
      content: form.content,
      created_by: user?.id ?? null,
    };
    const { error } = editId
      ? await supabase.from("marketing_templates").update(payload).eq("id", editId)
      : await supabase.from("marketing_templates").insert(payload);
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
    const { error } = await supabase.from("marketing_templates").delete().eq("id", id);
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
          <Input className="pl-8" placeholder="Kërko shabllone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={fPlatform} onValueChange={setFPlatform}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-f">Të gjitha platformat</SelectItem>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Shto</Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nuk ka shabllone.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm truncate">{r.name}</p>
                <Badge variant="outline">{r.platform}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">{r.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{formatDateDMY(r.created_at)}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(r.content);
                      toast({ title: "U kopjua" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
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
            <DialogTitle>{editId ? "Ndrysho shabllonin" : "Shabllon i re"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Emri</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Platforma</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Përmbajtja</Label>
              <Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
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

export default TemplatesManager;
