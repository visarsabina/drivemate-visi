import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Candidate } from "@/types/candidate";
import { toast } from "sonner";
import { Printer } from "lucide-react";

interface PaymentFormProps {
  candidates: Candidate[];
}

const PaymentForm = ({ candidates }: PaymentFormProps) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [shumaMarreveshjes, setShumaMarreveshjes] = useState("");
  const [shumaPaguar, setShumaPaguar] = useState("");
  const [dataPageses, setDataPageses] = useState(new Date().toISOString().split("T")[0]);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const borxhi = shumaMarreveshjes && shumaPaguar
    ? (parseFloat(shumaMarreveshjes) - parseFloat(shumaPaguar)).toFixed(2)
    : "0.00";

  const handlePrint = () => {
    if (!selectedCandidate || !shumaMarreveshjes) {
      toast.error("Ju lutem zgjidhni kandidatin dhe plotësoni shumën");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
          .details { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details td { padding: 10px 14px; border: 1px solid #ddd; font-size: 14px; }
          .details td:first-child { font-weight: 600; background: #f5f7fa; width: 40%; }
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
          <tr><td>Emri</td><td>${selectedCandidate.emri}</td></tr>
          <tr><td>Mbiemri</td><td>${selectedCandidate.mbiemri}</td></tr>
          <tr><td>Numri Personal</td><td>${selectedCandidate.numriPersonal}</td></tr>
          <tr><td>Shuma e Marrëveshjes</td><td class="total">${parseFloat(shumaMarreveshjes).toFixed(2)} €</td></tr>
          <tr><td>Shuma e Paguar</td><td>${parseFloat(shumaPaguar || "0").toFixed(2)} €</td></tr>
          <tr><td>Borxhi</td><td class="debt">${borxhi} €</td></tr>
          <tr><td>Data e Pagesës</td><td>${dataPageses}</td></tr>
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
          <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
            <p><span className="font-medium">Emri:</span> {selectedCandidate.emri} {selectedCandidate.mbiemri}</p>
            <p><span className="font-medium">Nr. Personal:</span> {selectedCandidate.numriPersonal}</p>
            <p><span className="font-medium">Kategoria:</span> {selectedCandidate.kategoria}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shumaMarreveshjes">Shuma e Marrëveshjes (€)</Label>
            <Input
              id="shumaMarreveshjes"
              type="number"
              value={shumaMarreveshjes}
              onChange={(e) => setShumaMarreveshjes(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shumaPaguar">Shuma e Paguar (€)</Label>
            <Input
              id="shumaPaguar"
              type="number"
              value={shumaPaguar}
              onChange={(e) => setShumaPaguar(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <div className="flex justify-between items-center">
            <span className="font-medium">Borxhi:</span>
            <span className={`text-lg font-bold ${parseFloat(borxhi) > 0 ? "text-destructive" : "text-primary"}`}>
              {borxhi} €
            </span>
          </div>
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

        <Button onClick={handlePrint} className="w-full sm:w-auto gap-2">
          <Printer className="w-4 h-4" />
          Printo Fletëpagesën
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;
