import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users as UsersIcon, ArrowLeft, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateDMY } from "@/lib/date";
import { toast } from "sonner";
import LessonsManager from "@/components/LessonsManager";
import InstructorReports from "@/components/InstructorReports";

interface InstructorCandidate {
  id: string;
  numri_regjistrimit: string;
  emri: string;
  mbiemri: string;
  telefon: string | null;
  kategoria: string;
  statusi: string;
  data_regjistrimit: string;
  total_lessons: number;
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
  const [selected, setSelected] = useState<InstructorCandidate | null>(null);

  useEffect(() => {
    if (!user || tenantLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("candidates")
        .select(
          "id, numri_regjistrimit, emri, mbiemri, telefon, kategoria, statusi, data_regjistrimit, total_lessons",
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

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek lista
        </Button>
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-xl font-bold">{selected.emri} {selected.mbiemri}</h2>
          <p className="text-sm text-muted-foreground">
            Nr. Regj: {selected.numri_regjistrimit} · Kategoria: {selected.kategoria}
          </p>
        </div>
        <LessonsManager
          candidateId={selected.id}
          candidateName={`${selected.emri} ${selected.mbiemri}`}
          totalLessons={selected.total_lessons ?? 20}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-primary" />
          Kandidatët e Mi
        </h2>
        <p className="text-sm text-muted-foreground">
          Kliko mbi një kandidat për të menaxhuar orët e vozitjes.
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
              <TableHead className="text-right">Orë</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nuk keni kandidatë të caktuar ende.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
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
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
                      <Clock className="w-3.5 h-3.5" /> {c.total_lessons ?? 20}
                    </Button>
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
