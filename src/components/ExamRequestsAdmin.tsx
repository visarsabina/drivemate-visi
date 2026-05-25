import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, CalendarClock } from "lucide-react";

interface Row {
  id: string;
  candidate_id: string;
  requested_date: string;
  requested_time: string;
  exam_type: string;
  status: string;
  notes: string | null;
  admin_response: string | null;
  created_at: string;
  candidate?: { emri: string; mbiemri: string; numri_regjistrimit: string };
}

const statusClass = (s: string) =>
  s === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
  s === "rejected" ? "bg-destructive/15 text-destructive" :
  "bg-amber-500/15 text-amber-700 dark:text-amber-300";

const ExamRequestsAdmin = () => {
  const { tenantId } = useTenant();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data: reqs } = await supabase
      .from("exam_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    const list = (reqs ?? []) as Row[];
    const ids = list.map((r) => r.candidate_id);
    if (ids.length > 0) {
      const { data: cands } = await supabase
        .from("candidates")
        .select("id, emri, mbiemri, numri_regjistrimit")
        .in("id", ids);
      const map = new Map((cands ?? []).map((c: any) => [c.id, c]));
      list.forEach((r) => { r.candidate = map.get(r.candidate_id); });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenantId]);

  const decide = async (row: Row, status: "approved" | "rejected") => {
    setBusyId(row.id);
    const adminResponse = response[row.id]?.trim() || null;
    const { error: updErr } = await supabase
      .from("exam_requests")
      .update({ status, admin_response: adminResponse })
      .eq("id", row.id);
    if (updErr) {
      toast({ title: "Dështoi", description: updErr.message, variant: "destructive" });
      setBusyId(null);
      return;
    }
    if (status === "approved") {
      const { error: insErr } = await supabase.from("candidate_exams").insert({
        tenant_id: row.candidate ? tenantId : tenantId,
        candidate_id: row.candidate_id,
        exam_date: row.requested_date,
        exam_time: row.requested_time,
        exam_type: row.exam_type,
      });
      if (insErr) {
        toast({ title: "U aprovua, por kalendari dështoi", description: insErr.message, variant: "destructive" });
      } else {
        toast({ title: "U aprovua", description: "Termini u shtua në kalendar." });
      }
    } else {
      toast({ title: "Kërkesa u refuzua" });
    }
    setBusyId(null);
    load();
  };

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Kërkesat për Termin nga Kandidatët</h3>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Duke ngarkuar...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nuk ka kërkesa.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {r.candidate ? `${r.candidate.emri} ${r.candidate.mbiemri}` : "—"}
                    {r.candidate && <span className="text-xs text-muted-foreground ml-1">({r.candidate.numri_regjistrimit})</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.exam_type === "teori" ? "Teori" : "Praktikë"} · {r.requested_date} {r.requested_time?.slice(0,5)}
                  </p>
                  {r.notes && <p className="text-xs text-muted-foreground mt-1">"{r.notes}"</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md shrink-0 ${statusClass(r.status)}`}>
                  {r.status === "pending" ? "Në pritje" : r.status === "approved" ? "Aprovuar" : "Refuzuar"}
                </span>
              </div>
              {r.status === "pending" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor={`resp-${r.id}`} className="text-xs">Përgjigja (opcionale)</Label>
                    <Input
                      id={`resp-${r.id}`}
                      value={response[r.id] ?? ""}
                      onChange={(e) => setResponse({ ...response, [r.id]: e.target.value })}
                      maxLength={300}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="gap-2 text-destructive hover:text-destructive" disabled={busyId === r.id} onClick={() => decide(r, "rejected")}>
                      <XCircle className="w-4 h-4" /> Refuzo
                    </Button>
                    <Button size="sm" className="gap-2" disabled={busyId === r.id} onClick={() => decide(r, "approved")}>
                      {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Aprovo
                    </Button>
                  </div>
                </div>
              )}
              {r.status !== "pending" && r.admin_response && (
                <p className="text-xs text-muted-foreground mt-2">Përgjigja: {r.admin_response}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default ExamRequestsAdmin;
