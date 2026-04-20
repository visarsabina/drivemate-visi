import { useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { Wallet, TrendingUp, Calendar as CalIcon, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FinancesProps {
  candidates: Candidate[];
}

const monthNames = [
  "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
  "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
];

const Finances = ({ candidates }: FinancesProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  // Flatten all payments with candidate info
  const allPayments = useMemo(
    () =>
      candidates.flatMap((c) =>
        c.payments.map((p) => ({
          ...p,
          candidateId: c.id,
          emri: c.emri,
          mbiemri: c.mbiemri,
          numriRegjistrimit: c.numriRegjistrimit,
        }))
      ),
    [candidates]
  );

  const totalPaguar = allPayments.reduce((s, p) => s + p.shuma, 0);
  const totalMarreveshje = candidates.reduce((s, c) => s + c.shumaMarreveshjes, 0);
  const totalBorxh = totalMarreveshje - totalPaguar;
  const balanci = totalPaguar - totalBorxh;

  const todayPayments = allPayments.filter((p) => p.data === today);
  const totalSot = todayPayments.reduce((s, p) => s + p.shuma, 0);

  const currentMonthTotal = allPayments
    .filter((p) => {
      const d = new Date(p.data);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((s, p) => s + p.shuma, 0);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allPayments.forEach((p) => years.add(new Date(p.data).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [allPayments, currentYear]);

  const yearlyByMonth = useMemo(() => {
    const yr = parseInt(selectedYear, 10);
    const arr = new Array(12).fill(0);
    allPayments.forEach((p) => {
      const d = new Date(p.data);
      if (d.getFullYear() === yr) arr[d.getMonth()] += p.shuma;
    });
    return arr;
  }, [allPayments, selectedYear]);

  const yearTotal = yearlyByMonth.reduce((s, v) => s + v, 0);

  const stats = [
    { label: "Balanci momental", value: balanci, icon: Wallet, color: "text-primary", hint: "Të arkëtuara − borxhe" },
    { label: "Arkëtimet sot", value: totalSot, icon: CalIcon, color: "text-success", hint: today },
    { label: "Arkëtimet këtë muaj", value: currentMonthTotal, icon: TrendingUp, color: "text-warning", hint: monthNames[currentMonth] },
    { label: "Borxhi total", value: totalBorxh, icon: Users, color: "text-destructive", hint: `${candidates.length} kandidatë` },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value.toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily report - today's payers */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border/50 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold">Raporti ditor</h3>
            <p className="text-xs text-muted-foreground">Pagesat e bëra sot ({today})</p>
          </div>
          <div className="text-sm">
            Total: <span className="font-semibold text-primary">{totalSot.toFixed(2)} €</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Regj.</TableHead>
                <TableHead>Emri</TableHead>
                <TableHead>Mbiemri</TableHead>
                <TableHead className="text-right">Shuma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nuk ka pagesa sot
                  </TableCell>
                </TableRow>
              ) : (
                todayPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.numriRegjistrimit}</TableCell>
                    <TableCell>{p.emri}</TableCell>
                    <TableCell>{p.mbiemri}</TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {p.shuma.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Monthly summary (current year) */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-semibold">Raporti mujor — {currentYear}</h3>
          <p className="text-xs text-muted-foreground">Përmbledhje sipas muajve për vitin aktual</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Muaji</TableHead>
                <TableHead className="text-right">Totali</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthNames.map((m, idx) => {
                const total = allPayments
                  .filter((p) => {
                    const d = new Date(p.data);
                    return d.getFullYear() === currentYear && d.getMonth() === idx;
                  })
                  .reduce((s, p) => s + p.shuma, 0);
                return (
                  <TableRow key={m} className={idx === currentMonth ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">{m}</TableCell>
                    <TableCell className="text-right">{total.toFixed(2)} €</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Yearly report with year selector */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border/50 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold">Raporti vjetor</h3>
            <p className="text-xs text-muted-foreground">Përmbledhje sipas muajve për vitin e zgjedhur</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm">
              Total: <span className="font-semibold text-primary">{yearTotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Muaji</TableHead>
                <TableHead className="text-right">Totali</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthNames.map((m, idx) => (
                <TableRow key={m}>
                  <TableCell className="font-medium">{m}</TableCell>
                  <TableCell className="text-right">{yearlyByMonth[idx].toFixed(2)} €</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Finances;
