import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeDMY } from "@/lib/date";
import { Loader2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type LogRow = {
  id: string;
  created_at: string;
  user_email: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  row_id: string | null;
  old_data: any;
  new_data: any;
};

const tableLabels: Record<string, string> = {
  candidates: "Kandidatët",
  candidate_payments: "Pagesat",
  candidate_lessons: "Orët",
  candidate_exams: "Provimet",
  vehicles: "Mjetet",
  vehicle_services: "Servisat",
  employees: "Punëtorët",
  staff: "Stafi",
  licenses: "Licencat",
};

const actionLabels: Record<string, string> = {
  INSERT: "Shtim",
  UPDATE: "Ndryshim",
  DELETE: "Fshirje",
};

const actionVariant = (a: string) =>
  a === "INSERT" ? "default" : a === "UPDATE" ? "secondary" : "destructive";

const describeRow = (r: LogRow) => {
  const d = r.new_data || r.old_data || {};
  if (r.table_name === "candidates") return `${d.emri ?? ""} ${d.mbiemri ?? ""}`.trim();
  if (r.table_name === "candidate_payments") return `Shuma: ${d.shuma ?? "—"}`;
  if (r.table_name === "candidate_lessons") return `Orë: ${d.hours ?? "—"}`;
  if (r.table_name === "candidate_exams") return `${d.exam_type ?? ""} - ${d.exam_date ?? ""}`;
  if (r.table_name === "vehicles") return `${d.name ?? ""} ${d.plate_number ?? ""}`.trim();
  if (r.table_name === "vehicle_services") return `${d.vehicle_name ?? ""} - ${d.service_type ?? ""}`;
  if (r.table_name === "employees") return d.full_name ?? "";
  if (r.table_name === "staff") return `${d.name ?? ""} (${d.role ?? ""})`;
  if (r.table_name === "licenses") return `${d.category ?? ""} - ${d.license_number ?? ""}`;
  return r.row_id ?? "";
};

const diffFields = (oldD: any, newD: any) => {
  if (!oldD || !newD) return [];
  const changes: { key: string; from: any; to: any }[] = [];
  const skip = new Set(["updated_at", "created_at"]);
  for (const k of Object.keys(newD)) {
    if (skip.has(k)) continue;
    if (JSON.stringify(oldD[k]) !== JSON.stringify(newD[k])) {
      changes.push({ key: k, from: oldD[k], to: newD[k] });
    }
  }
  return changes;
};

const ActivityLog = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (dateFilter) {
      const start = new Date(dateFilter + "T00:00:00").toISOString();
      const end = new Date(dateFilter + "T23:59:59.999").toISOString();
      q = q.gte("created_at", start).lte("created_at", end);
    }
    const { data, error } = await q;
    if (error) {
      toast.error("Gabim gjatë ngarkimit të historikut");
      setLogs([]);
    } else {
      setLogs((data as LogRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (tableFilter !== "all" && l.table_name !== tableFilter) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [
          l.user_email,
          l.table_name,
          describeRow(l),
          JSON.stringify(l.new_data || l.old_data || {}),
        ].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [logs, search, tableFilter, actionFilter]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>Historiku i Veprimeve</span>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Rifresko
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger><SelectValue placeholder="Tabela" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha tabelat</SelectItem>
                {Object.entries(tableLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger><SelectValue placeholder="Veprimi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha veprimet</SelectItem>
                <SelectItem value="INSERT">Shtim</SelectItem>
                <SelectItem value="UPDATE">Ndryshim</SelectItem>
                <SelectItem value="DELETE">Fshirje</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Kërko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Asnjë veprim për këto kritere.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((l) => {
                const isOpen = expanded.has(l.id);
                const changes = l.action === "UPDATE" ? diffFields(l.old_data, l.new_data) : [];
                return (
                  <div key={l.id} className="border border-border rounded-lg">
                    <button
                      onClick={() => toggle(l.id)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={actionVariant(l.action) as any}>{actionLabels[l.action]}</Badge>
                          <span className="font-medium">{tableLabels[l.table_name] ?? l.table_name}</span>
                          <span className="text-sm text-muted-foreground truncate">{describeRow(l)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTimeDMY(l.created_at)} · {l.user_email ?? "Sistemi"}
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 pt-1 border-t border-border bg-muted/20">
                        {l.action === "UPDATE" && changes.length > 0 && (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium mb-2">Ndryshimet:</div>
                            {changes.map((c) => (
                              <div key={c.key} className="grid grid-cols-3 gap-2 py-1 border-b border-border/50 last:border-0">
                                <span className="font-mono text-xs text-muted-foreground">{c.key}</span>
                                <span className="text-destructive line-through truncate">{String(c.from ?? "—")}</span>
                                <span className="text-primary truncate">{String(c.to ?? "—")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(l.action === "INSERT" || l.action === "DELETE") && (
                          <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
                            {JSON.stringify(l.new_data || l.old_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
