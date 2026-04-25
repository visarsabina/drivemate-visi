import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle, Printer } from "lucide-react";
import { buildLicensesPrintHTML } from "@/lib/printTemplates";

interface License {
  id: string;
  category: string;
  license_number: string;
  issue_date: string | null;
  expiry_date: string | null;
}

const CATEGORIES = ["A", "B", "C1", "C", "CE", "D"] as const;

const emptyForm = {
  category: "",
  license_number: "",
  issue_date: "",
  expiry_date: "",
};

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const expiryStatus = (date: string | null) => {
  const days = daysUntil(date);
  if (days === null) return { variant: "outline" as const, label: "—", urgent: false };
  if (days < 0) return { variant: "destructive" as const, label: `Skadoi (${Math.abs(days)} ditë)`, urgent: true };
  if (days <= 7) return { variant: "destructive" as const, label: `${days} ditë`, urgent: true };
  if (days <= 30) return { variant: "secondary" as const, label: `${days} ditë`, urgent: false };
  return { variant: "outline" as const, label: `${days} ditë`, urgent: false };
};

import { formatDateDMY as formatDate } from "@/lib/date";

const Licenses = () => {
  const { tenantId } = useTenant();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("category", { ascending: true });
    if (error) {
      toast.error("Gabim gjatë ngarkimit të licencave");
    } else {
      setLicenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (l: License) => {
    setEditingId(l.id);
    setForm({
      category: l.category,
      license_number: l.license_number,
      issue_date: l.issue_date || "",
      expiry_date: l.expiry_date || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.license_number) {
      toast.error("Kategoria dhe numri i licencës janë të detyrueshëm");
      return;
    }
    if (form.issue_date && form.expiry_date && form.expiry_date < form.issue_date) {
      toast.error("Skadenca nuk mund të jetë më e hershme se data e licencës");
      return;
    }
    setSaving(true);

    const payload = {
      category: form.category,
      license_number: form.license_number,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
    };

    if (!editingId && !tenantId) {
      toast.error("Tenant nuk u gjet");
      setSaving(false);
      return;
    }

    const { error } = editingId
      ? await supabase.from("licenses").update(payload).eq("id", editingId)
      : await supabase.from("licenses").insert({ ...payload, tenant_id: tenantId! });

    setSaving(false);
    if (error) {
      toast.error("Ruajtja dështoi: " + error.message);
      return;
    }
    toast.success(editingId ? "Licenca u përditësua" : "Licenca u shtua");
    setDialogOpen(false);
    fetchLicenses();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("licenses").delete().eq("id", deleteId);
    if (error) {
      toast.error("Fshirja dështoi");
    } else {
      toast.success("Licenca u fshi");
      fetchLicenses();
    }
    setDeleteId(null);
  };

  const expiringSoon = licenses.filter((l) => {
    const d = daysUntil(l.expiry_date);
    return d !== null && d <= 30;
  });

  const handlePrint = () => {
    const html = buildLicensesPrintHTML(licenses);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6">
      {expiringSoon.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">
              {expiringSoon.length} licencë(a) me afat që po skadon
            </p>
            <p className="text-sm text-muted-foreground">
              {expiringSoon.map((l) => `${l.category} (${l.license_number})`).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Gjithsej: {licenses.length} licenca
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={licenses.length === 0}>
            <Printer className="w-4 h-4" /> Printo Listën
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Shto Licencë
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategoria</TableHead>
              <TableHead>Numri i Licencës</TableHead>
              <TableHead>Data e Licencës</TableHead>
              <TableHead>Skadenca</TableHead>
              <TableHead className="text-right">Veprime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Duke ngarkuar...
                </TableCell>
              </TableRow>
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nuk ka licenca të regjistruara
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((l) => {
                const exp = expiryStatus(l.expiry_date);
                return (
                  <TableRow key={l.id} className={exp.urgent ? "bg-destructive/5" : ""}>
                    <TableCell className="font-semibold">{l.category}</TableCell>
                    <TableCell>{l.license_number}</TableCell>
                    <TableCell>{formatDate(l.issue_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatDate(l.expiry_date)}</span>
                        <Badge variant={exp.variant} className="w-fit">{exp.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(l.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Ndrysho Licencën" : "Shto Licencë të Re"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Zgjidh kategorinë" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="num">Numri i Licencës *</Label>
                <Input
                  id="num"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">Data e Licencës</Label>
                <Input
                  id="issue"
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Skadenca</Label>
                <Input
                  id="exp"
                  type="date"
                  value={form.expiry_date}
                  min={form.issue_date || undefined}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  aria-invalid={
                    !!(form.issue_date && form.expiry_date && form.expiry_date < form.issue_date)
                  }
                />
                {form.issue_date && form.expiry_date && form.expiry_date < form.issue_date && (
                  <p className="text-xs text-destructive">
                    Skadenca nuk mund të jetë më e hershme se data e licencës.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Anulo
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Duke ruajtur..." : editingId ? "Ruaj Ndryshimet" : "Shto Licencën"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A jeni i sigurt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ky veprim do të fshijë licencën përgjithmonë. Nuk mund të zhbëhet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Fshij</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Licenses;
