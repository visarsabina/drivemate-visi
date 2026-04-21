import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload, AlertTriangle, Printer } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  personal_number: string | null;
  license_number: string | null;
  license_date: string | null;
  license_expiry_date: string | null;
  health_certificate_date: string | null;
  health_certificate_expiry_date: string | null;
  photo_url: string | null;
}

const emptyForm = {
  full_name: "",
  personal_number: "",
  license_number: "",
  license_date: "",
  license_expiry_date: "",
  health_certificate_date: "",
  health_certificate_expiry_date: "",
  photo_url: "",
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

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("sq-AL");
};

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gabim gjatë ngarkimit të punëtorëve");
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    setForm({
      full_name: e.full_name,
      personal_number: e.personal_number || "",
      license_number: e.license_number || "",
      license_date: e.license_date || "",
      license_expiry_date: e.license_expiry_date || "",
      health_certificate_date: e.health_certificate_date || "",
      health_certificate_expiry_date: e.health_certificate_expiry_date || "",
      photo_url: e.photo_url || "",
    });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name) {
      toast.error("Emri dhe mbiemri janë të detyrueshëm");
      return;
    }
    if (form.personal_number && form.personal_number.length !== 10) {
      toast.error("Numri personal duhet të ketë 10 shifra");
      return;
    }
    setUploading(true);
    let photoUrl = form.photo_url;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("employee-photos")
        .upload(path, photoFile);
      if (upErr) {
        toast.error("Ngarkimi i fotos dështoi");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("employee-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    const payload = {
      full_name: form.full_name,
      personal_number: form.personal_number || null,
      license_number: form.license_number || null,
      license_date: form.license_date || null,
      license_expiry_date: form.license_expiry_date || null,
      health_certificate_date: form.health_certificate_date || null,
      health_certificate_expiry_date: form.health_certificate_expiry_date || null,
      photo_url: photoUrl || null,
    };

    const { error } = editingId
      ? await supabase.from("employees").update(payload).eq("id", editingId)
      : await supabase.from("employees").insert(payload);

    setUploading(false);
    if (error) {
      toast.error("Ruajtja dështoi: " + error.message);
      return;
    }
    toast.success(editingId ? "Punëtori u përditësua" : "Punëtori u shtua");
    setDialogOpen(false);
    fetchEmployees();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("employees").delete().eq("id", deleteId);
    if (error) {
      toast.error("Fshirja dështoi");
    } else {
      toast.success("Punëtori u fshi");
      fetchEmployees();
    }
    setDeleteId(null);
  };

  const expiringSoon = employees.filter((e) => {
    const lic = daysUntil(e.license_expiry_date);
    const health = daysUntil(e.health_certificate_expiry_date);
    return (lic !== null && lic <= 30) || (health !== null && health <= 30);
  });

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista e Punëtorëve</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111;}
      h1{margin:0 0 4px 0;font-size:20px;}
      .sub{color:#555;margin-bottom:16px;font-size:12px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top;}
      th{background:#f0f0f0;}
      .urgent{background:#ffe5e5;}
      @media print{button{display:none;}}
    </style></head><body>
    <h1>Auto Shkolla Visi — Lista e Punëtorëve</h1>
    <div class="sub">Data e printimit: ${new Date().toLocaleDateString("sq-AL")} • Gjithsej: ${employees.length} punëtorë</div>
    <table>
      <thead><tr>
        <th>#</th><th>Emri Mbiemri</th><th>Nr. Personal</th><th>Nr. Licencës</th>
        <th>Data e Licencës</th><th>Skadon Licenca</th>
        <th>Data Cert. Shëndet.</th><th>Skadon Cert.</th>
      </tr></thead>
      <tbody>
        ${employees.map((e, i) => {
          const lic = daysUntil(e.license_expiry_date);
          const health = daysUntil(e.health_certificate_expiry_date);
          const urgent = (lic !== null && lic <= 30) || (health !== null && health <= 30);
          return `<tr class="${urgent ? "urgent" : ""}">
            <td>${i + 1}</td>
            <td>${e.full_name}</td>
            <td>${e.personal_number || "—"}</td>
            <td>${e.license_number || "—"}</td>
            <td>${formatDate(e.license_date)}</td>
            <td>${formatDate(e.license_expiry_date)}</td>
            <td>${formatDate(e.health_certificate_date)}</td>
            <td>${formatDate(e.health_certificate_expiry_date)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;
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
              {expiringSoon.length} punëtor(ë) me afat që po skadon
            </p>
            <p className="text-sm text-muted-foreground">
              {expiringSoon.map((e) => e.full_name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Gjithsej: {employees.length} punëtorë
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={employees.length === 0}>
            <Printer className="w-4 h-4" /> Printo Listën
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Shto Punëtor
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri Mbiemri</TableHead>
              <TableHead>Nr. Personal</TableHead>
              <TableHead>Nr. Licencës</TableHead>
              <TableHead>Skadon Licenca</TableHead>
              <TableHead>Skadon Cert. Shëndet.</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead className="text-right">Veprime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Duke ngarkuar...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nuk ka punëtorë të regjistruar
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => {
                const lic = expiryStatus(e.license_expiry_date);
                const health = expiryStatus(e.health_certificate_expiry_date);
                const rowAlert = lic.urgent || health.urgent;
                return (
                  <TableRow key={e.id} className={rowAlert ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.personal_number || "—"}</TableCell>
                    <TableCell>{e.license_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatDate(e.license_expiry_date)}</span>
                        <Badge variant={lic.variant} className="w-fit">{lic.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatDate(e.health_certificate_expiry_date)}</span>
                        <Badge variant={health.variant} className="w-fit">{health.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {e.photo_url ? (
                        <button
                          onClick={() => setPreviewPhoto(e.photo_url)}
                          className="w-12 h-12 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                        >
                          <img src={e.photo_url} alt={e.full_name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(e.id)}>
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

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Ndrysho Punëtorin" : "Shto Punëtor të Ri"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Emri dhe Mbiemri *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Emri Mbiemri"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personal_number">Numri Personal (10 shifra)</Label>
                <Input
                  id="personal_number"
                  value={form.personal_number}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm({ ...form, personal_number: digits });
                  }}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number">Numri i Licencës</Label>
                <Input
                  id="license_number"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  placeholder="L-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_date">Data e Licencës</Label>
                <Input
                  id="license_date"
                  type="date"
                  value={form.license_date}
                  onChange={(e) => setForm({ ...form, license_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_expiry">Skadenca e Licencës</Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={form.license_expiry_date}
                  onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_date">Data e Cert. Shëndetësore</Label>
                <Input
                  id="health_date"
                  type="date"
                  value={form.health_certificate_date}
                  onChange={(e) => setForm({ ...form, health_certificate_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_expiry">Skadenca e Cert. Shëndetësore</Label>
                <Input
                  id="health_expiry"
                  type="date"
                  value={form.health_certificate_expiry_date}
                  onChange={(e) => setForm({ ...form, health_certificate_expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto e Punëtorit</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{photoFile ? photoFile.name : "Zgjidh foton"}</span>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
                {form.photo_url && !photoFile && (
                  <img src={form.photo_url} alt="" className="w-12 h-12 rounded object-cover border" />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Anulo
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Duke ruajtur..." : editingId ? "Ruaj Ndryshimet" : "Shto Punëtorin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo preview */}
      <Dialog open={!!previewPhoto} onOpenChange={(o) => !o && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto e Punëtorit</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img src={previewPhoto} alt="Punëtori" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A jeni i sigurt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ky veprim do të fshijë punëtorin përgjithmonë. Nuk mund të zhbëhet.
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

export default Employees;
