import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { AlertTriangle, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiringVehicle {
  id: string;
  name: string;
  plate_number: string;
  inspection_expiry_date: string | null;
  registration_expiry_date: string | null;
}

interface Props {
  onViewVehicles: () => void;
}

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const VehicleAlerts = ({ onViewVehicles }: Props) => {
  const [expiring, setExpiring] = useState<ExpiringVehicle[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id, name, plate_number, inspection_expiry_date, registration_expiry_date");
      if (data) {
        const filtered = data.filter((v) => {
          const insp = daysUntil(v.inspection_expiry_date);
          const reg = daysUntil(v.registration_expiry_date);
          return (insp !== null && insp <= 30) || (reg !== null && reg <= 30);
        });
        setExpiring(filtered);
      }
    })();
  }, []);

  if (expiring.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-destructive flex items-center gap-2">
            <Car className="w-4 h-4" />
            {expiring.length} mjet(e) me afat që po skadon
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            {expiring.map((v) => {
              const insp = daysUntil(v.inspection_expiry_date);
              const reg = daysUntil(v.registration_expiry_date);
              const issues: string[] = [];
              if (reg !== null && reg <= 30) {
                issues.push(
                  reg < 0
                    ? `regjistrimi skadoi para ${Math.abs(reg)} ditë`
                    : `regjistrimi në ${reg} ditë`
                );
              }
              if (insp !== null && insp <= 30) {
                issues.push(
                  insp < 0
                    ? `kontrolla skadoi para ${Math.abs(insp)} ditë`
                    : `kontrolla në ${insp} ditë`
                );
              }
              return (
                <li key={v.id}>
                  <span className="font-medium text-foreground">{v.name}</span> ({v.plate_number}) — {issues.join(", ")}
                </li>
              );
            })}
          </ul>
          <Button size="sm" variant="outline" className="mt-3" onClick={onViewVehicles}>
            Shiko Mjetet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleAlerts;
