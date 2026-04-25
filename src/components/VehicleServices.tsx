import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";

const RRIP_THRESHOLD = 10000;
const VAJ_THRESHOLD = 1000;

type AlertLevel = "ok" | "warn" | "danger" | "expired";

const getAlertLevel = (
  current: number | null | undefined,
  next: number | null | undefined,
  threshold: number,
): AlertLevel => {
  if (current == null || next == null) return "ok";
  const remaining = next - current;
  if (remaining <= 0) return "expired";
  if (remaining <= threshold) return "danger";
  if (remaining <= threshold * 2) return "warn";
  return "ok";
};

const renderKmAlert = (
  current: number | null | undefined,
  next: number | null | undefined,
  threshold: number,
) => {
  if (current == null || next == null) return null;
  const remaining = next - current;
  const level = getAlertLevel(current, next, threshold);
  if (level === "expired")
    return (
      <Badge variant="destructive" className="ml-2">
        Skaduar {Math.abs(remaining).toLocaleString()} km
      </Badge>
    );
  if (level === "danger")
    return (
      <Badge variant="destructive" className="ml-2">
        Mbetur {remaining.toLocaleString()} km
      </Badge>
    );
  if (level === "warn")
    return (
      <Badge className="ml-2 bg-warning text-warning-foreground hover:bg-warning/90">
        Mbetur {remaining.toLocaleString()} km
      </Badge>
    );
  return (
    <Badge variant="secondary" className="ml-2">
      Mbetur {remaining.toLocaleString()} km
    </Badge>
  );
};

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
}

interface VehicleService {
  id: string;
  vehicle_name: string;
  service_type: string; // 'rrip_dhembezor' | 'vaj_motori'
  service_km: number | null;
  next_service_km: number | null;
  notes: string | null;
}

interface Row {
  vehicle_name: string;
  plate_number: string;
  rrip: VehicleService | null;
  vaj: VehicleService | null;
}

const emptyForm = {
  rrip_current: "",
  rrip_next: "",
  vaj_current: "",
  vaj_next: "",
  notes: "",
};

const formatKm = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString()} km` : "-";

const VehicleServices = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<VehicleService[]>([]);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: veh }, { data: svc }] = await Promise.all([
      supabase.from("vehicles").select("id,name,plate_number").order("name"),
      supabase.from("vehicle_services").select("*"),
    ]);
    if (veh) setVehicles(veh);
    if (svc) setServices(svc);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rows: Row[] = vehicles.map((v) => {
    const svcs = services.filter((s) => s.vehicle_name === v.name);
    return {
      vehicle_name: v.name,
      plate_number: v.plate_number,
      rrip: svcs.find((s) => s.service_type === "rrip_dhembezor") || null,
      vaj: svcs.find((s) => s.service_type === "vaj_motori") || null,
    };
  });

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    const svcs = services.filter((s) => s.vehicle_name === v.name);
    const rrip = svcs.find((s) => s.service_type === "rrip_dhembezor");
    const vaj = svcs.find((s) => s.service_type === "vaj_motori");
    setForm({
      rrip_current: rrip?.service_km?.toString() || "",
      rrip_next: rrip?.next_service_km?.toString() || "",
      vaj_current: vaj?.service_km?.toString() || "",
      vaj_next: vaj?.next_service_km?.toString() || "",
      notes: rrip?.notes || vaj?.notes || "",
    });
  };

  const upsertService = async (
    vehicleName: string,
    type: "rrip_dhembezor" | "vaj_motori",
    currentKm: string,
    nextKm: string,
    notes: string,
    existing: VehicleService | null,
  ) => {
    const hasData = currentKm.trim() !== "" || nextKm.trim() !== "";
    if (!hasData && !existing) return null;

    const payload = {
      vehicle_name: vehicleName,
      service_type: type,
      service_km: currentKm ? parseInt(currentKm) : null,
      next_service_km: nextKm ? parseInt(nextKm) : null,
      notes: notes.trim() || null,
    };

    if (existing) {
      return supabase.from("vehicle_services").update(payload).eq("id", existing.id);
    }
    if (!tenantId) {
      toast.error("Tenant nuk u gjet");
      return null;
    }
    return supabase.from("vehicle_services").insert({ ...payload, tenant_id: tenantId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);

    const existingSvcs = services.filter((s) => s.vehicle_name === editing.name);
    const rrip = existingSvcs.find((s) => s.service_type === "rrip_dhembezor") || null;
    const vaj = existingSvcs.find((s) => s.service_type === "vaj_motori") || null;

    const results = await Promise.all([
      upsertService(editing.name, "rrip_dhembezor", form.rrip_current, form.rrip_next, form.notes, rrip),
      upsertService(editing.name, "vaj_motori", form.vaj_current, form.vaj_next, form.notes, vaj),
    ]);

    setLoading(false);
    const err = results.find((r) => r && r.error);
    if (err && err.error) {
      toast.error("Gabim: " + err.error.message);
      return;
    }
    toast.success("U ruajt");
    setEditing(null);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Servisat e Veturave</h3>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Emri i Veturës</th>
              <th className="p-3 font-medium">Rripi aktual</th>
              <th className="p-3 font-medium">Rripi i ardhshëm</th>
              <th className="p-3 font-medium">Vaj aktual</th>
              <th className="p-3 font-medium">Vaj i ardhshëm</th>
              <th className="p-3 font-medium text-right">Veprime</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nuk ka mjete të regjistruara. Shtoji nga menuja "Mjetet".
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const v = vehicles.find((x) => x.name === r.vehicle_name)!;
              const rripLevel = getAlertLevel(
                r.rrip?.service_km,
                r.rrip?.next_service_km,
                RRIP_THRESHOLD,
              );
              const vajLevel = getAlertLevel(
                r.vaj?.service_km,
                r.vaj?.next_service_km,
                VAJ_THRESHOLD,
              );
              const urgent =
                rripLevel === "danger" ||
                rripLevel === "expired" ||
                vajLevel === "danger" ||
                vajLevel === "expired";
              return (
                <tr
                  key={r.vehicle_name}
                  className={`border-t ${urgent ? "bg-destructive/5" : ""}`}
                >
                  <td className="p-3">
                    <div className="font-medium">{r.vehicle_name}</div>
                    <div className="text-xs text-muted-foreground">{r.plate_number}</div>
                  </td>
                  <td className="p-3">{formatKm(r.rrip?.service_km ?? null)}</td>
                  <td className="p-3">
                    <div className="flex items-center flex-wrap">
                      <span>{formatKm(r.rrip?.next_service_km ?? null)}</span>
                      {renderKmAlert(r.rrip?.service_km, r.rrip?.next_service_km, RRIP_THRESHOLD)}
                    </div>
                  </td>
                  <td className="p-3">{formatKm(r.vaj?.service_km ?? null)}</td>
                  <td className="p-3">
                    <div className="flex items-center flex-wrap">
                      <span>{formatKm(r.vaj?.next_service_km ?? null)}</span>
                      {renderKmAlert(r.vaj?.service_km, r.vaj?.next_service_km, VAJ_THRESHOLD)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                      <Pencil className="w-4 h-4 mr-1" /> Modifiko
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Servisi - {editing?.name} ({editing?.plate_number})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Rripi dhëmbëzor</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>KM aktuale</Label>
                  <Input
                    type="number"
                    value={form.rrip_current}
                    onChange={(e) => setForm({ ...form, rrip_current: e.target.value })}
                    placeholder="p.sh. 120000"
                  />
                </div>
                <div>
                  <Label>KM i ardhshëm</Label>
                  <Input
                    type="number"
                    value={form.rrip_next}
                    onChange={(e) => setForm({ ...form, rrip_next: e.target.value })}
                    placeholder="p.sh. 180000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Vaji i motorit</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>KM aktuale</Label>
                  <Input
                    type="number"
                    value={form.vaj_current}
                    onChange={(e) => setForm({ ...form, vaj_current: e.target.value })}
                    placeholder="p.sh. 120000"
                  />
                </div>
                <div>
                  <Label>KM i ardhshëm</Label>
                  <Input
                    type="number"
                    value={form.vaj_next}
                    onChange={(e) => setForm({ ...form, vaj_next: e.target.value })}
                    placeholder="p.sh. 130000"
                  />
                </div>
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
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Anulo
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Duke ruajtur..." : "Ruaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleServices;
