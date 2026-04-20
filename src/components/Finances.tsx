import { useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { Wallet, TrendingUp, Calendar as CalIcon, Users, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

  const handlePrintDaily = () => {
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    const rows = todayPayments
      .map(
        (p) => `
        <tr>
          <td>${p.numriRegjistrimit}</td>
          <td>${p.emri}</td>
          <td>${p.mbiemri}</td>
          <td style="text-align:right">${p.shuma.toFixed(2)} €</td>
        </tr>`
      )
      .join("");
    const body = todayPayments.length
      ? rows
      : `<tr><td colspan="4" style="text-align:center;padding:24px;color:#666">Nuk ka pagesa sot</td></tr>`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Raporti ditor — ${today}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
        th { background: #f3f4f6; }
        .total { margin-top: 16px; text-align: right; font-size: 14px; font-weight: 600; }
        .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; }
      </style></head><body>
      <h1>Raporti ditor i pagesave</h1>
      <div class="sub">Auto Shkolla Visi — Data: ${today}</div>
      <table>
        <thead><tr><th>Nr. Regj.</th><th>Emri</th><th>Mbiemri</th><th style="text-align:right">Shuma</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="total">Total: ${totalSot.toFixed(2)} €</div>
      <div class="footer">Gjeneruar nga sistemi Auto Shkolla Visi</div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>`);
    w.document.close();
  };

  const stats = [
    { label: "Shuma e përgjithshme momentale", value: totalPaguar, icon: Wallet, color: "text-primary", hint: "Të gjitha arkëtimet deri sot" },
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
          <div className="flex items-center gap-3">
            <div className="text-sm">
              Total: <span className="font-semibold text-primary">{totalSot.toFixed(2)} €</span>
            </div>
            <Button size="sm" variant="outline" onClick={handlePrintDaily}>
              <Printer className="w-4 h-4 mr-2" />
              Printo
            </Button>
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
