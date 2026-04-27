import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users as UsersIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateDMY } from "@/lib/date";
import { toast } from "sonner";

interface InstructorCandidate {
  id: string;
  full_name: string;
  personal_number: string | null;
  license_number: string | null;
  license_date: string | null;
  license_expiry_date: string | null;
  health_certificate_date: string | null;
  health_certificate_expiry_date: string | null;
  created_at: string;
}

const InstructorDashboard = () => {
  const { user } = useAuth();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [candidates, setCandidates] = useState<InstructorCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || tenantLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select(
          "id, full_name, personal_number, license_number, license_date, license_expiry_date, health_certificate_date, health_certificate_expiry_date, created_at",
        )
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          toast.error("Gabim gjatë ngarkimit: " + error.message);
        } else {
          setCandidates((data as InstructorCandidate[]) ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, tenantLoading, tenantId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-primary" />
          Kandidatët e Mi
        </h2>
        <p className="text-sm text-muted-foreground">
          Lista e kandidatëve të caktuar tek ju nga admini i autoshkollës.
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri i plotë</TableHead>
              <TableHead>Numri personal</TableHead>
              <TableHead>Patenta</TableHead>
              <TableHead>Skadon më</TableHead>
              <TableHead>Çert. shëndetësore</TableHead>
              <TableHead>Statusi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nuk keni kandidatë të caktuar ende.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((c) => {
                const expired =
                  c.license_expiry_date &&
                  new Date(c.license_expiry_date) < new Date();
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.personal_number || "—"}
                    </TableCell>
                    <TableCell>{c.license_number || "—"}</TableCell>
                    <TableCell>
                      {c.license_expiry_date ? formatDateDMY(c.license_expiry_date) : "—"}
                    </TableCell>
                    <TableCell>
                      {c.health_certificate_expiry_date
                        ? formatDateDMY(c.health_certificate_expiry_date)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="destructive">Skaduar</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                          Aktiv
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InstructorDashboard;
