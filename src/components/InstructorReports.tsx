import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarDays, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateDMY } from "@/lib/date";
import { toast } from "sonner";

type Period = "day" | "week" | "month";

interface LessonRow {
  id: string;
  data: string;
  hours: number;
  candidate_id: string;
  candidates: {
    emri: string;
    mbiemri: string;
    numri_regjistrimit: string;
  } | null;
}

const startOf = (period: Period): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "day") return d;
  if (period === "week") {
    const day = (d.getDay() + 6) % 7; // Monday=0
    d.setDate(d.getDate() - day);
    return d;
  }
  d.setDate(1);
  return d;
};

const toISO = (d: Date) => d.toISOString().split("T")[0];

const InstructorReports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("day");
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = toISO(startOf(period));
      const { data, error } = await supabase
        .from("candidate_lessons")
        .select("id, data, hours, candidate_id, candidates(emri, mbiemri, numri_regjistrimit)")
        .eq("created_by", user.id)
        .gte("data", from)
        .order("data", { ascending: false });
      if (!cancelled) {
        if (error) toast.error("Gabim: " + error.message);
        setRows(((data as any) ?? []) as LessonRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, period]);

  const totalHours = useMemo(() => rows.reduce((s, r) => s + Number(r.hours), 0), [rows]);
  const uniqueCandidates = useMemo(() => new Set(rows.map(r => r.candidate_id)).size, [rows]);

  // Group by candidate
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; nr: string; hours: number; sessions: number }>();
    rows.forEach(r => {
      const key = r.candidate_id;
      const name = r.candidates ? `${r.candidates.emri} ${r.candidates.mbiemri}` : "—";
      const nr = r.candidates?.numri_regjistrimit ?? "—";
      const cur = map.get(key) ?? { name, nr, hours: 0, sessions: 0 };
      cur.hours += Number(r.hours);
      cur.sessions += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [rows]);

  const periodLabel: Record<Period, string> = {
    day: "Sot",
    week: "Këtë javë",
    month: "Këtë muaj",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          Raporti i Orëve
        </h2>
        <p className="text-sm text-muted-foreground">
          Kandidatët që keni mbajtur orë sipas periudhës.
        </p>
      </div>

      <div className="flex gap-2">
        {(["day", "week", "month"] as Period[]).map(p => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabel[p]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Kandidatë</div>
          <div className="text-xl font-bold text-primary">{uniqueCandidates}</div>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Seanca</div>
          <div className="text-xl font-bold">{rows.length}</div>
        </div>
        <div className="glass-card rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground">Total orë</div>
          <div className="text-xl font-bold text-green-600">{totalHours}</div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <div className="px-4 py-2 text-sm font-medium border-b flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Përmbledhje sipas kandidatit
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr. Regj.</TableHead>
              <TableHead>Kandidati</TableHead>
              <TableHead className="text-right">Seanca</TableHead>
              <TableHead className="text-right">Orë</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></TableCell></TableRow>
            ) : grouped.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Asnjë orë nuk është mbajtur në këtë periudhë.</TableCell></TableRow>
            ) : (
              grouped.map((g, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{g.nr}</TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-right">{g.sessions}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{g.hours}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <div className="px-4 py-2 text-sm font-medium border-b">Detajet e seancave</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Kandidati</TableHead>
              <TableHead className="text-right">Orë</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">—</TableCell></TableRow>
            ) : (
              rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateDMY(r.data)}</TableCell>
                  <TableCell>{r.candidates ? `${r.candidates.emri} ${r.candidates.mbiemri}` : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{r.hours}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InstructorReports;
