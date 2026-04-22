import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiringEmployee {
  id: string;
  full_name: string;
  license_expiry_date: string | null;
  health_certificate_expiry_date: string | null;
}

interface Props {
  onViewEmployees: () => void;
}

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const EmployeeAlerts = ({ onViewEmployees }: Props) => {
  const [expiring, setExpiring] = useState<ExpiringEmployee[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name, license_expiry_date, health_certificate_expiry_date");
      if (data) {
        const filtered = data.filter((e) => {
          const lic = daysUntil(e.license_expiry_date);
          const health = daysUntil(e.health_certificate_expiry_date);
          return (lic !== null && lic <= 30) || (health !== null && health <= 30);
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
            <UsersIcon className="w-4 h-4" />
            {expiring.length} punëtor(ë) me afat që po skadon
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            {expiring.map((e) => {
              const lic = daysUntil(e.license_expiry_date);
              const health = daysUntil(e.health_certificate_expiry_date);
              const issues: string[] = [];
              if (lic !== null && lic <= 30) {
                issues.push(
                  lic < 0
                    ? `patenta skadoi para ${Math.abs(lic)} ditë`
                    : `patenta në ${lic} ditë`
                );
              }
              if (health !== null && health <= 30) {
                issues.push(
                  health < 0
                    ? `çertifikata shëndetësore skadoi para ${Math.abs(health)} ditë`
                    : `çertifikata shëndetësore në ${health} ditë`
                );
              }
              return (
                <li key={e.id}>
                  <span className="font-medium text-foreground">{e.full_name}</span> — {issues.join(", ")}
                </li>
              );
            })}
          </ul>
          <Button size="sm" variant="outline" className="mt-3" onClick={onViewEmployees}>
            Shiko Punëtorët
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAlerts;
