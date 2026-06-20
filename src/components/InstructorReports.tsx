import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarDays, Clock, UserCog } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateDMY } from "@/lib/date";
import { toast } from "sonner";

type Period = "day" | "week" | "month";

interface LessonRow {
  id: string;
  data: string;
  hours: number;
  candidate_id: string;
  created_by: string | null;
  candidates: {
    emri: string;
    mbiemri: string;
    numri_regjistrimit: string;
  } | null;
}

interface InstructorInfo {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Props {
  /** If true, show all instructors' lessons (admin view). Otherwise only current user's. */
  adminMode?: boolean;
}

const startOf = (period: Period): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "day") return d;
  if (period === "week") {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d;
  }
  d.setDate(1);
  return d;
};

const toISO = (d: Date) => d.toISOString().split("T")[0];

const InstructorReports = ({ adminMode = false }: Props) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("day");
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<InstructorInfo[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");

  // Load instructors list (admin mode only)
  useEffect(() => {
    if (!adminMode) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("list_instructors_in_my_tenant");
      if (!cancelled) {
        if (error) toast.error("Gabim: " + error.message);
        else setInstructors((data as InstructorInfo[]) ?? []);
      }
    })();
    return () => { cancelled = true; };
  }, [adminMode]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = toISO(startOf(period));
      let query = supabase
        .from("candidate_lessons")
        .select("id, data, hours, candidate_id, created_by")
        .gte("data", from)
        .order("data", { ascending: false });

      if (!adminMode) {
        query = query.eq("created_by", user.id);
      } else if (selectedInstructor !== "all") {
        query = query.eq("created_by", selectedInstructor);
      }

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        toast.error("Gabim: " + error.message);
        setRows([]);
        setLoading(false);
        return;
      }
      const lessons = (data ?? []) as any[];
      const candidateIds = Array.from(new Set(lessons.map(l => l.candidate_id).filter(Boolean)));
      let candidatesMap = new Map<string, { emri: string; mbiemri: string; numri_regjistrimit: string }>();
      if (candidateIds.length > 0) {
        const { data: cands } = await supabase
          .from("candidates")
          .select("id, emri, mbiemri, numri_regjistrimit")
          .in("id", candidateIds);
        (cands ?? []).forEach((c: any) => candidatesMap.set(c.id, {
          emri: c.emri, mbiemri: c.mbiemri, numri_regjistrimit: c.numri_regjistrimit,
        }));
      }
      const merged: LessonRow[] = lessons.map(l => ({
        ...l,
        candidates: candidatesMap.get(l.candidate_id) ?? null,
      }));
      if (!cancelled) {
        setRows(merged);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, period, adminMode, selectedInstructor]);

  const instructorName = (id: string | null) => {
    if (!id) return "—";
    const i = instructors.find(x => x.user_id === id);
    if (!i) return "—";
    const full = `${i.first_name} ${i.last_name}`.trim();
    return full || i.email;
  };

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

  // Group by instructor (admin mode)
  const byInstructor = useMemo(() => {
    if (!adminMode) return [];
    const map = new Map<string, { name: string; hours: number; sessions: number; candidates: Set<string> }>();
    rows.forEach(r => {
      const key = r.created_by ?? "—";
      const cur = map.get(key) ?? { name: instructorName(r.created_by), hours: 0, sessions: 0, candidates: new Set<string>() };
      cur.hours += Number(r.hours);
      cur.sessions += 1;
      cur.candidates.add(r.candidate_id);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [rows, adminMode, instructors]);

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
          {adminMode
            ? "Orët e mbajtura nga të gjithë instruktorët sipas periudhës."
            : "Kandidatët që keni mbajtur orë sipas periudhës."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
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
        {adminMode && (
          <div className="ml-auto min-w-[200px]">
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="Instruktori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjithë instruktorët</SelectItem>
                {instructors.map(i => (
                  <SelectItem key={i.user_id} value={i.user_id}>
                    {`${i.first_name} ${i.last_name}`.trim() || i.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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

      {adminMode && (
        <div className="glass-card rounded-xl overflow-x-auto">
          <div className="px-4 py-2 text-sm font-medium border-b flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" /> Përmbledhje sipas instruktorit
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instruktori</TableHead>
                <TableHead className="text-right">Kandidatë</TableHead>
                <TableHead className="text-right">Seanca</TableHead>
                <TableHead className="text-right">Orë</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></TableCell></TableRow>
              ) : byInstructor.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Asnjë orë nuk është mbajtur në këtë periudhë.</TableCell></TableRow>
              ) : (
                byInstructor.map((g, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-right">{g.candidates.size}</TableCell>
                    <TableCell className="text-right">{g.sessions}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{g.hours}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
              {adminMode && <TableHead>Instruktori</TableHead>}
              <TableHead className="text-right">Orë</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={adminMode ? 4 : 3} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={adminMode ? 4 : 3} className="text-center py-8 text-muted-foreground text-sm">—</TableCell></TableRow>
            ) : (
              rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateDMY(r.data)}</TableCell>
                  <TableCell>{r.candidates ? `${r.candidates.emri} ${r.candidates.mbiemri}` : "—"}</TableCell>
                  {adminMode && <TableCell className="text-muted-foreground">{instructorName(r.created_by)}</TableCell>}
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
