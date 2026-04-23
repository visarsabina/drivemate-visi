import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { formatDateDMY } from "@/lib/date";

interface VehicleService {
  id: string;
  vehicle_name: string;
  service_type: string;
  service_date: string | null;
  service_km: number | null;
  next_service_date: string | null;
  next_service_km: number | null;
  notes: string | null;
}

const SERVICE_TYPES = [
  { value: "rrip_dhembezor", label: "Rripi dhëmbëzor" },
  { value: "vaj_motori", label: "Vaji i motorit" },
];

const serviceTypeLabel = (t: string) =>
  SERVICE_TYPES.find((s) => s.value === t)?.label || t;

const emptyForm = {
  vehicle_name: "",
  service_type: "vaj_motori",
  service_date: "",
  service_km: "",
  next_service_date: "",
  next_service_km: "",
  notes: "",
};

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const VehicleServices = () => {
  const [services, setServices] = useState<VehicleService[]>([]);
  const [vehicleNames, setVehicleNames] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleService | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: svc }, { data: veh }] = await Promise.all([
      supabase
        .from("vehicle_services")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("vehicles").select("name").order("name"),
    ]);
    if (svc) setServices(svc);
    if (veh) setVehicleNames(veh.map((v) => v.name));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: VehicleService) => {
    setEditing(s);
    setForm({
      vehicle_name: s.vehicle_name,
      service_type: s.service_type,
      service_date: s.service_date || "",
      service_km: s.service_km?.toString() || "",
      next_service_date: s.next_service_date || "",
      next_service_km: s.next_service_km?.toString() || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_name.trim() || !form.service_type) {
      toast.error("Plotësoni emrin e veturës dhe llojin e servisit");
      return;
    }
    setLoading(true);
    const payload = {
      vehicle_name: form.vehicle_name.trim(),
      service_type: form.service_type,
      service_date: form.service_date || null,
      service_km: form.service_km ? parseInt(form.service_km) : null,
      next_service_date: form.next_service_date || null,
      next_service_km: form.next_service_km ? parseInt(form.next_service_km) : null,
      notes: form.notes.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("vehicle_services").update(payload).eq("id", editing.id)
      : await supabase.from("vehicle_services").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Gabim: " + error.message);
      return;
    }
    toast.success(editing ? "U përditësua" : "U shtua");
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("vehicle_services").delete().eq("id", deleteId);
    if (error) {
      toast.error("Gabim: " + error.message);
      return;
    }
    toast.success("U fshi");
    setDeleteId(null);
    fetchData();
  };

  const renderNextBadge = (s: VehicleService) => {
    const d = daysUntil(s.next_service_date);
    if (d === null) return null;
    if (d < 0)
      return <Badge variant="destructive">Skaduar para {Math.abs(d)} ditë</Badge>;
    if (d <= 14)
      return <Badge variant="destructive">Pas {d} ditë</Badge>;
    if (d <= 30)
      return <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Pas {d} ditë</Badge>;
    return <Badge variant="secondary">Pas {d} ditë</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Servisat e Veturave</h3>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Shto Servis
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Vetura</th>
              <th className="p-3 font-medium">Lloji</th>
              <th className="p-3 font-medium">Data e ndërrimit</th>
              <th className="p-3 font-medium">KM</th>
              <th className="p-3 font-medium">Ndërrimi i ardhshëm</th>
              <th className="p-3 font-medium">KM e ardhshme</th>
              <th className="p-3 font-medium">Shënime</th>
              <th className="p-3 font-medium text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  Nuk ka servisa të regjistruar
                </td>
              </tr>
            )}
            {services.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.vehicle_name}</td>
                <td className="p-3">{serviceTypeLabel(s.service_type)}</td>
                <td className="p-3">{formatDateDMY(s.service_date)}</td>
                <td className="p-3">{s.service_km?.toLocaleString() || "-"}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <span>{formatDateDMY(s.next_service_date)}</span>
                    {renderNextBadge(s)}
                  </div>
                </td>
                <td className="p-3">{s.next_service_km?.toLocaleString() || "-"}</td>
                <td className="p-3 max-w-[200px] truncate" title={s.notes || ""}>
                  {s.notes || "-"}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(s.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifiko Servisin" : "Shto Servis"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Emri i Veturës *</Label>
              {vehicleNames.length > 0 ? (
                <Select
                  value={form.vehicle_name}
                  onValueChange={(v) => setForm({ ...form, vehicle_name: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidh veturën" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleNames.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.vehicle_name}
                  onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })}
                  placeholder="p.sh. Golf 7"
                />
              )}
            </div>

            <div>
              <Label>Lloji i Servisit *</Label>
              <Select
                value={form.service_type}
                onValueChange={(v) => setForm({ ...form, service_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data e ndërrimit</Label>
                <Input
                  type="date"
                  value={form.service_date}
                  onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                />
              </div>
              <div>
                <Label>KM në ndërrim</Label>
                <Input
                  type="number"
                  value={form.service_km}
                  onChange={(e) => setForm({ ...form, service_km: e.target.value })}
                  placeholder="p.sh. 120000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data e ndërrimit të ardhshëm</Label>
                <Input
                  type="date"
                  value={form.next_service_date}
                  onChange={(e) => setForm({ ...form, next_service_date: e.target.value })}
                />
              </div>
              <div>
                <Label>KM e ndërrimit të ardhshëm</Label>
                <Input
                  type="number"
                  value={form.next_service_km}
                  onChange={(e) => setForm({ ...form, next_service_km: e.target.value })}
                  placeholder="p.sh. 130000"
                />
              </div>
            </div>

            <div>
              <Label>Shënime</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Shënime opsionale"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Anulo
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Duke ruajtur..." : "Ruaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fshi këtë servis?</AlertDialogTitle>
            <AlertDialogDescription>
              Ky veprim nuk mund të zhbëhet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Fshi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleServices;
