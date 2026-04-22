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

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  registration_date: string | null;
  registration_expiry_date: string | null;
  inspection_date: string | null;
  inspection_expiry_date: string | null;
  attestation_number: string | null;
  attestation_expiry_date: string | null;
  photo_url: string | null;
}

const emptyForm = {
  name: "",
  plate_number: "",
  registration_date: "",
  inspection_date: "",
  attestation_number: "",
  photo_url: "",
};

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Registration valid for 1 year
const calcRegExpiry = (regDate: string): string | null => {
  if (!regDate) return null;
  const d = new Date(regDate);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
};

// Inspection valid for 6 months
const calcInspExpiry = (inspDate: string): string | null => {
  if (!inspDate) return null;
  const d = new Date(inspDate);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split("T")[0];
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

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "expiring">("all");

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gabim gjatë ngarkimit të mjeteve");
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      plate_number: v.plate_number,
      registration_date: v.registration_date || "",
      inspection_date: v.inspection_date || "",
      attestation_number: v.attestation_number || "",
      photo_url: v.photo_url || "",
    });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.plate_number) {
      toast.error("Emri dhe numri i tabelave janë të detyrueshëm");
      return;
    }
    setUploading(true);
    let photoUrl = form.photo_url;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, photoFile);
      if (upErr) {
        toast.error("Ngarkimi i fotos dështoi");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    const payload = {
      name: form.name,
      plate_number: form.plate_number,
      registration_date: form.registration_date || null,
      registration_expiry_date: calcRegExpiry(form.registration_date),
      inspection_date: form.inspection_date || null,
      inspection_expiry_date: calcInspExpiry(form.inspection_date),
      attestation_number: form.attestation_number || null,
      photo_url: photoUrl || null,
    };

    const { error } = editingId
      ? await supabase.from("vehicles").update(payload).eq("id", editingId)
      : await supabase.from("vehicles").insert(payload);

    setUploading(false);
    if (error) {
      toast.error("Ruajtja dështoi: " + error.message);
      return;
    }
    toast.success(editingId ? "Mjeti u përditësua" : "Mjeti u shtua");
    setDialogOpen(false);
    fetchVehicles();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", deleteId);
    if (error) {
      toast.error("Fshirja dështoi");
    } else {
      toast.success("Mjeti u fshi");
      fetchVehicles();
    }
    setDeleteId(null);
  };

  const isExpiringSoon = (v: Vehicle) => {
    const insp = daysUntil(v.inspection_expiry_date);
    const reg = daysUntil(v.registration_expiry_date);
    return (insp !== null && insp <= 30) || (reg !== null && reg <= 30);
  };

  const expiringSoon = vehicles.filter(isExpiringSoon);
  const visibleVehicles = filter === "expiring" ? expiringSoon : vehicles;

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista e Mjeteve</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111;}
      h1{margin:0 0 4px 0;font-size:20px;}
      .sub{color:#555;margin-bottom:16px;font-size:12px;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top;}
      th{background:#f0f0f0;}
      .urgent{background:#ffe5e5;}
      @media print{button{display:none;}}
    </style></head><body>
    <h1>Auto Shkolla Visi — Lista e Mjeteve</h1>
    <div class="sub">Data e printimit: ${new Date().toLocaleDateString("sq-AL")} • Gjithsej: ${vehicles.length} mjete</div>
    <table>
      <thead><tr>
        <th>#</th><th>Emri i Veturës</th><th>Tabelat</th><th>Regjistrimi</th>
        <th>Kontrolla Periodike</th><th>Nr. Atestit</th>
      </tr></thead>
      <tbody>
        ${vehicles.map((v, i) => {
          const insp = daysUntil(v.inspection_expiry_date);
          const urgent = insp !== null && insp <= 7;
          return `<tr class="${urgent ? "urgent" : ""}">
            <td>${i + 1}</td>
            <td>${v.name}</td>
            <td>${v.plate_number}</td>
            <td>${formatDate(v.registration_date)}</td>
            <td>${formatDate(v.inspection_expiry_date)}</td>
            <td>${v.attestation_number || "—"}</td>
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
              {expiringSoon.length} mjet(e) me afat që po skadon
            </p>
            <p className="text-sm text-muted-foreground">
              {expiringSoon.map((v) => `${v.name} (${v.plate_number})`).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Të gjitha ({vehicles.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "expiring" ? "default" : "outline"}
            onClick={() => setFilter("expiring")}
          >
            Skadojnë në 30 ditë ({expiringSoon.length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={vehicles.length === 0}>
            <Printer className="w-4 h-4" /> Printo Listën
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Shto Mjet
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri i Veturës</TableHead>
              <TableHead>Tabelat</TableHead>
              <TableHead>Skadon Regjistrimi</TableHead>
              <TableHead>Skadon Kontrolla</TableHead>
              <TableHead>Nr. Atestit</TableHead>
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
            ) : visibleVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {filter === "expiring"
                    ? "Asnjë mjet me afat që skadon në 30 ditët e ardhshme"
                    : "Nuk ka mjete të regjistruara"}
                </TableCell>
              </TableRow>
            ) : (
              visibleVehicles.map((v) => {
                const insp = expiryStatus(v.inspection_expiry_date);
                const reg = expiryStatus(v.registration_expiry_date);
                const rowAlert = insp.urgent || reg.urgent;
                return (
                  <TableRow key={v.id} className={rowAlert ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.plate_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatDate(v.registration_expiry_date)}</span>
                        <Badge variant={reg.variant} className="w-fit">{reg.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatDate(v.inspection_expiry_date)}</span>
                        <Badge variant={insp.variant} className="w-fit">{insp.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{v.attestation_number || "—"}</TableCell>
                    <TableCell>
                      {v.photo_url ? (
                        <button
                          onClick={() => setPreviewPhoto(v.photo_url)}
                          className="w-12 h-12 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                        >
                          <img src={v.photo_url} alt={v.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(v)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(v.id)}>
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
            <DialogTitle>{editingId ? "Ndrysho Mjetin" : "Shto Mjet të Ri"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Emri i Veturës *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VW Golf"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Numri i Tabelave *</Label>
                <Input
                  id="plate"
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                  placeholder="01-AAA-123"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg">Data e Regjistrimit</Label>
                <Input
                  id="reg"
                  type="date"
                  value={form.registration_date}
                  onChange={(e) => setForm({ ...form, registration_date: e.target.value })}
                />
                {form.registration_date && (
                  <p className="text-xs text-muted-foreground">
                    Skadon: <span className="font-medium text-foreground">{formatDate(calcRegExpiry(form.registration_date))}</span> (1 vit)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="insp">Data e Kontrollës Periodike</Label>
                <Input
                  id="insp"
                  type="date"
                  value={form.inspection_date}
                  onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                />
                {form.inspection_date && (
                  <p className="text-xs text-muted-foreground">
                    Skadon: <span className="font-medium text-foreground">{formatDate(calcInspExpiry(form.inspection_date))}</span> (6 muaj)
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="att-num">Numri i Atestit</Label>
                <Input
                  id="att-num"
                  value={form.attestation_number}
                  onChange={(e) => setForm({ ...form, attestation_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto e Mjetit</Label>
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
                {uploading ? "Duke ruajtur..." : editingId ? "Ruaj Ndryshimet" : "Shto Mjetin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo preview */}
      <Dialog open={!!previewPhoto} onOpenChange={(o) => !o && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto e Mjetit</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <img src={previewPhoto} alt="Mjeti" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A jeni i sigurt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ky veprim do të fshijë mjetin përgjithmonë. Nuk mund të zhbëhet.
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

export default Vehicles;
