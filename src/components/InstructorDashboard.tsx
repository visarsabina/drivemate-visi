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
  numri_regjistrimit: string;
  emri: string;
  mbiemri: string;
  telefon: string | null;
  kategoria: string;
  statusi: string;
  data_regjistrimit: string;
}

const statusLabel: Record<string, string> = {
  regjistuar: "Regjistruar",
  ne_proces: "Në proces",
  kaluar: "Kaluar",
  deshtur: "Dështuar",
};

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
        .from("candidates")
        .select(
          "id, numri_regjistrimit, emri, mbiemri, telefon, kategoria, statusi, data_regjistrimit",
        )
        .order("data_regjistrimit", { ascending: false });

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
              <TableHead>Nr. Regj.</TableHead>
              <TableHead>Emri Mbiemri</TableHead>
              <TableHead>Telefoni</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead>Data e Regjistrimit</TableHead>
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
              candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.numri_regjistrimit}</TableCell>
                  <TableCell className="font-medium">
                    {c.emri} {c.mbiemri}
                  </TableCell>
                  <TableCell>{c.telefon || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.kategoria}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.statusi === "kaluar"
                          ? "bg-green-500/10 text-green-700 border-green-500/30"
                          : c.statusi === "deshtur"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-primary/10 text-primary border-primary/20"
                      }
                    >
                      {statusLabel[c.statusi] || c.statusi}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateDMY(c.data_regjistrimit)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InstructorDashboard;
