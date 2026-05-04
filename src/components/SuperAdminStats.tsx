import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Users,
  GraduationCap,
  Wallet,
  Inbox,
  Car,
  UserCheck,
  Loader2,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { toast } from "sonner";

interface GlobalStats {
  tenants_total: number;
  tenants_active: number;
  candidates_total: number;
  candidates_in_progress: number;
  candidates_passed: number;
  candidates_failed: number;
  revenue_total: number;
  revenue_this_month: number;
  registrations_open: number;
  vehicles_total: number;
  employees_total: number;
}

interface MonthlyRow {
  month: string;
  revenue: number;
  new_candidates: number;
  new_registrations: number;
}

interface TenantStat {
  tenant_id: string;
  tenant_name: string;
  candidates_total: number;
  candidates_active: number;
  revenue_total: number;
  revenue_this_month: number;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("sq-AL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const fmtMonth = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("sq-AL", { month: "short", year: "2-digit" });
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "green" | "amber" | "red" | "muted";
}) => {
  const toneCls: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    green: "text-green-600 bg-green-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    red: "text-destructive bg-destructive/10",
    muted: "text-muted-foreground bg-muted",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneCls[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TenantDetails {
  tenant_id: string;
  tenant_name: string;
  slug: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  candidates_total: number;
  candidates_regjistuar: number;
  candidates_ne_proces: number;
  candidates_kaluar: number;
  candidates_deshtur: number;
  registrations_open: number;
  registrations_total: number;
  revenue_total: number;
  revenue_this_month: number;
  vehicles_total: number;
  employees_total: number;
}

const SuperAdminStats = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [byTenant, setByTenant] = useState<TenantStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [months, setMonths] = useState<number>(12);
  const [selected, setSelected] = useState<TenantDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openDetails = async (tenantId: string) => {
    setDetailsLoading(true);
    setSelected({ tenant_id: tenantId } as TenantDetails);
    const { data, error } = await supabase.rpc("super_admin_tenant_details", { _tenant_id: tenantId });
    if (error) {
      toast.error("Detajet: " + error.message);
      setSelected(null);
    } else {
      setSelected(data as unknown as TenantDetails);
    }
    setDetailsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [g, t] = await Promise.all([
        supabase.rpc("super_admin_global_stats"),
        supabase.rpc("super_admin_tenant_stats"),
      ]);
      if (cancelled) return;
      if (g.error) toast.error("Statistikat: " + g.error.message);
      else setStats(g.data as unknown as GlobalStats);
      if (t.error) toast.error("Sipas autoshkollave: " + t.error.message);
      else setByTenant((t.data ?? []) as TenantStat[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSeriesLoading(true);
      const { data, error } = await supabase.rpc("super_admin_monthly_series", { _months: months });
      if (cancelled) return;
      if (error) toast.error("Seritë mujore: " + error.message);
      else setMonthly(((data ?? []) as MonthlyRow[]).map((r) => ({ ...r, month: fmtMonth(r.month) })));
      setSeriesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [months]);

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTenants = () => {
    downloadCSV(`autoshkolla-renditja-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Autoshkolla", "Kandidatë", "Aktivë", "Të ardhura këtë muaj (€)", "Të ardhura gjithsej (€)"],
      ...byTenant.map((t) => [
        t.tenant_name,
        t.candidates_total,
        t.candidates_active,
        Number(t.revenue_this_month),
        Number(t.revenue_total),
      ]),
    ]);
  };

  const exportMonthly = () => {
    downloadCSV(`seri-mujore-${months}m-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Muaji", "Të ardhura (€)", "Kandidatë të rinj", "Regjistrime online"],
      ...monthly.map((r) => [r.month, Number(r.revenue), r.new_candidates, r.new_registrations]),
    ]);
  };

  const exportTenantDetails = () => {
    if (!selected || !("candidates_total" in selected)) return;
    const s = selected;
    downloadCSV(`autoshkolla-${s.slug || s.tenant_id}-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Fusha", "Vlera"],
      ["Autoshkolla", s.tenant_name],
      ["Slug", s.slug ?? ""],
      ["Telefon", s.phone ?? ""],
      ["Email", s.email ?? ""],
      ["Adresa", s.address ?? ""],
      ["Aktive", s.is_active ? "Po" : "Jo"],
      ["Kandidatë gjithsej", s.candidates_total],
      ["Të regjistruar", s.candidates_regjistuar],
      ["Në proces", s.candidates_ne_proces],
      ["Kaluar", s.candidates_kaluar],
      ["Dështuar", s.candidates_deshtur],
      ["Regjistrime të hapura", s.registrations_open],
      ["Regjistrime gjithsej", s.registrations_total],
      ["Të ardhura këtë muaj (€)", Number(s.revenue_this_month)],
      ["Të ardhura gjithsej (€)", Number(s.revenue_total)],
      ["Mjete", s.vehicles_total],
      ["Punëtorë", s.employees_total],
    ]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Autoshkolla"
          value={stats.tenants_total}
          hint={`${stats.tenants_active} aktive`}
        />
        <StatCard
          icon={GraduationCap}
          label="Kandidatë"
          value={stats.candidates_total}
          hint={`${stats.candidates_in_progress} në proces`}
          tone="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Kaluar"
          value={stats.candidates_passed}
          tone="green"
        />
        <StatCard
          icon={Users}
          label="Dështuar"
          value={stats.candidates_failed}
          tone="red"
        />
        <StatCard
          icon={Wallet}
          label="Të ardhura gjithsej"
          value={fmtCurrency(stats.revenue_total)}
          tone="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Ky muaj"
          value={fmtCurrency(stats.revenue_this_month)}
          tone="primary"
        />
        <StatCard
          icon={Inbox}
          label="Regjistrime online"
          value={stats.registrations_open}
          hint="Të papërpunuara"
          tone="amber"
        />
        <StatCard
          icon={Car}
          label="Mjete & Punëtorë"
          value={`${stats.vehicles_total} / ${stats.employees_total}`}
          tone="muted"
        />
      </div>

      {/* Period filter + export */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Periudha:</span>
            <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 muaj të fundit</SelectItem>
                <SelectItem value="6">6 muaj të fundit</SelectItem>
                <SelectItem value="12">12 muaj të fundit</SelectItem>
                <SelectItem value="24">24 muaj të fundit</SelectItem>
              </SelectContent>
            </Select>
            {seriesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <Button variant="outline" size="sm" onClick={exportMonthly} disabled={monthly.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Eksporto serinë mujore (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Të ardhura mujore ({months} muaj)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtCurrency(v)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kandidatë & regjistrime të reja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="new_candidates" name="Kandidatë" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="new_registrations" name="Regjistrime online" fill="hsl(var(--accent-foreground) / 0.6)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performanca sipas autoshkollës</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autoshkolla</TableHead>
                  <TableHead className="text-center">Kandidatë</TableHead>
                  <TableHead className="text-center">Aktivë</TableHead>
                  <TableHead className="text-right">Ky muaj</TableHead>
                  <TableHead className="text-right">Gjithsej</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTenant.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Asnjë të dhënë
                      </TableCell>
                    </TableRow>
                  )
                  : (
                    byTenant.map((t) => (
                      <TableRow
                        key={t.tenant_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetails(t.tenant_id)}
                      >
                        <TableCell className="font-medium">{t.tenant_name}</TableCell>
                        <TableCell className="text-center">{t.candidates_total}</TableCell>
                        <TableCell className="text-center">{t.candidates_active}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(Number(t.revenue_this_month))}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtCurrency(Number(t.revenue_total))}</TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.tenant_name || "Detajet e autoshkollës"}</DialogTitle>
            <DialogDescription>
              {selected?.slug && <span>/{selected.slug}</span>}
              {selected?.is_active === false && (
                <Badge variant="destructive" className="ml-2">Joaktive</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading || !selected || !("candidates_total" in selected) ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {(selected.phone || selected.email || selected.address) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {selected.phone && <p>📞 {selected.phone}</p>}
                  {selected.email && <p>✉️ {selected.email}</p>}
                  {selected.address && <p>📍 {selected.address}</p>}
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Kandidatët sipas statusit</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={GraduationCap} label="Gjithsej" value={selected.candidates_total} />
                  <StatCard icon={Users} label="Të regjistruar" value={selected.candidates_regjistuar} tone="amber" />
                  <StatCard icon={Users} label="Në proces" value={selected.candidates_ne_proces} tone="primary" />
                  <StatCard icon={UserCheck} label="Kaluar" value={selected.candidates_kaluar} tone="green" />
                  <StatCard icon={Users} label="Dështuar" value={selected.candidates_deshtur} tone="red" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Regjistrimet online</h4>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Inbox} label="Të hapura" value={selected.registrations_open} tone="amber" />
                  <StatCard icon={Inbox} label="Gjithsej" value={selected.registrations_total} tone="muted" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Të ardhurat</h4>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={TrendingUp} label="Ky muaj" value={fmtCurrency(Number(selected.revenue_this_month))} tone="primary" />
                  <StatCard icon={Wallet} label="Gjithsej" value={fmtCurrency(Number(selected.revenue_total))} tone="green" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Asetet</h4>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Car} label="Mjete" value={selected.vehicles_total} tone="muted" />
                  <StatCard icon={Users} label="Punëtorë" value={selected.employees_total} tone="muted" />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminStats;
