import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
      const [g, m, t] = await Promise.all([
        supabase.rpc("super_admin_global_stats"),
        supabase.rpc("super_admin_monthly_series", { _months: 12 }),
        supabase.rpc("super_admin_tenant_stats"),
      ]);
      if (cancelled) return;
      if (g.error) toast.error("Statistikat: " + g.error.message);
      else setStats(g.data as unknown as GlobalStats);
      if (m.error) toast.error("Seritë mujore: " + m.error.message);
      else setMonthly(((m.data ?? []) as MonthlyRow[]).map((r) => ({ ...r, month: fmtMonth(r.month) })));
      if (t.error) toast.error("Sipas autoshkollave: " + t.error.message);
      else setByTenant((t.data ?? []) as TenantStat[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Të ardhura mujore (12 muaj)</CardTitle>
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
                      <TableRow key={t.tenant_id}>
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
    </div>
  );
};

export default SuperAdminStats;
