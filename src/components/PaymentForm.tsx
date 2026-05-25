import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate, Payment } from "@/types/candidate";
import { toast } from "sonner";
import { Printer, Plus } from "lucide-react";
import { escapeHtmlObject } from "@/lib/escapeHtml";

interface PaymentFormProps {
  candidates: Candidate[];
  onPayment: (candidateId: string, payment: Payment) => void | Promise<boolean | void>;
  initialCandidateId?: string;
}

const PaymentForm = ({ candidates, onPayment, initialCandidateId }: PaymentFormProps) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId ?? "");
  const [shumaPaguar, setShumaPaguar] = useState("");
  const [dataPageses, setDataPageses] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (initialCandidateId) setSelectedCandidateId(initialCandidateId);
  }, [initialCandidateId]);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const totalPaguar = selectedCandidate
    ? selectedCandidate.payments.reduce((sum, p) => sum + p.shuma, 0)
    : 0;
  const borxhi = selectedCandidate
    ? (selectedCandidate.shumaMarreveshjes - totalPaguar).toFixed(2)
    : "0.00";

  const [submitting, setSubmitting] = useState(false);

  const handleAddPayment = async () => {
    if (!selectedCandidate) {
      toast.error("Ju lutem zgjidhni kandidatin");
      return;
    }
    const shuma = parseFloat(shumaPaguar);
    if (!shumaPaguar || !Number.isFinite(shuma) || shuma <= 0) {
      toast.error("Shkruani një shumë të vlefshme (më e madhe se 0)");
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      shuma,
      data: dataPageses,
    };

    setSubmitting(true);
    const result = await Promise.resolve(onPayment(selectedCandidateId, payment));
    setSubmitting(false);
    if (result === false) return; // hook already toasted the error
    toast.success("Pagesa u regjistrua me sukses!");
    setShumaPaguar("");
  };

  const handlePrint = () => {
    if (!selectedCandidate) {
      toast.error("Ju lutem zgjidhni kandidatin");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const safe = escapeHtmlObject(selectedCandidate);
    const transactionsHtml = safe.payments
      .map((p, i) => `<tr><td>${i + 1}</td><td>${p.data}</td><td>${selectedCandidate.payments[i].shuma.toFixed(2)} €</td></tr>`)
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fletëpagesë</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
          .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
          .header p { font-size: 13px; color: #666; }
          .title { text-align: center; font-size: 18px; font-weight: bold; margin: 24px 0; text-transform: uppercase; letter-spacing: 1px; }
          .details, .transactions { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details td, .transactions td, .transactions th { padding: 10px 14px; border: 1px solid #ddd; font-size: 14px; }
          .details td:first-child { font-weight: 600; background: #f5f7fa; width: 40%; }
          .transactions th { font-weight: 600; background: #f5f7fa; text-align: left; }
          .total { font-size: 16px; font-weight: bold; color: #2563eb; }
          .debt { color: #dc2626; }
          .footer { margin-top: 48px; display: flex; justify-content: space-between; font-size: 13px; color: #666; }
          .signature { border-top: 1px solid #333; padding-top: 8px; width: 200px; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Auto Shkolla VISI</h1>
          <p>Fletëpagesë</p>
        </div>
        <div class="title">Dëshmi Pagese</div>
        <table class="details">
          <tr><td>Emri</td><td>${safe.emri}</td></tr>
          <tr><td>Mbiemri</td><td>${safe.mbiemri}</td></tr>
          <tr><td>Numri Personal</td><td>${safe.numriPersonal}</td></tr>
          <tr><td>Shuma e Marrëveshjes</td><td class="total">${selectedCandidate.shumaMarreveshjes.toFixed(2)} €</td></tr>
          <tr><td>Totali i Paguar</td><td>${totalPaguar.toFixed(2)} €</td></tr>
          <tr><td>Borxhi</td><td class="debt">${borxhi} €</td></tr>
        </table>
        <h3 style="margin: 20px 0 10px;">Transaksionet</h3>
        <table class="transactions">
          <tr><th>#</th><th>Data</th><th>Shuma</th></tr>
          ${transactionsHtml}
        </table>
        <div class="footer">
          <div class="signature">Nënshkrimi i Kandidatit</div>
          <div class="signature">Nënshkrimi i Auto Shkollës</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Pagesa</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Zgjedh Kandidatin</Label>
          <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
            <SelectTrigger>
              <SelectValue placeholder="Zgjedh kandidatin..." />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.emri} {c.mbiemri} — {c.numriPersonal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCandidate && (
          <>
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <p><span className="font-medium">Emri:</span> {selectedCandidate.emri} {selectedCandidate.mbiemri}</p>
              <p><span className="font-medium">Nr. Personal:</span> {selectedCandidate.numriPersonal}</p>
              <p><span className="font-medium">Kategoria:</span> {selectedCandidate.kategoria}</p>
              <p><span className="font-medium">Shuma e Marrëveshjes:</span> {selectedCandidate.shumaMarreveshjes.toFixed(2)} €</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Totali i Paguar:</span>
                <span className="text-lg font-bold text-primary">{totalPaguar.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Borxhi:</span>
                <span className={`text-lg font-bold ${parseFloat(borxhi) > 0 ? "text-destructive" : "text-primary"}`}>
                  {borxhi} €
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shumaPaguar">Shuma për Pagesë (€)</Label>
                <Input
                  id="shumaPaguar"
                  type="number"
                  value={shumaPaguar}
                  onChange={(e) => setShumaPaguar(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPageses">Data e Pagesës</Label>
                <Input
                  id="dataPageses"
                  type="date"
                  value={dataPageses}
                  onChange={(e) => setDataPageses(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddPayment} className="gap-2">
                <Plus className="w-4 h-4" />
                Regjistro Pagesën
              </Button>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                Printo Fletëpagesën
              </Button>
            </div>

            {selectedCandidate.payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Transaksionet</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Shuma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCandidate.payments.map((p, i) => (
                      <TableRow key={p.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{p.data}</TableCell>
                        <TableCell>{p.shuma.toFixed(2)} €</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;
