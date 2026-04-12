import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { BookOpen, FileCheck, FileText, FileSignature, ArrowLeft, Printer } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import CandidateBooklet from "@/components/CandidateBooklet";
import CandidateVertetimi from "@/components/CandidateVertetimi";

const printFletepagesa = (candidate: Candidate) => {
  const totalPaguar = candidate.payments.reduce((sum, p) => sum + p.shuma, 0);
  const borxhi = candidate.shumaMarreveshjes - totalPaguar;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Fletëpagesa</title>
    <style>body{font-family:Arial;padding:40px;font-size:14px}
    h2{text-align:center;margin-bottom:30px}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th,td{border:1px solid #333;padding:8px;text-align:left}
    th{background:#f0f0f0}
    .summary{margin-top:20px;font-size:15px}
    .summary div{margin:5px 0}
    @media print{body{padding:20px}}</style></head><body>
    <h2>FLETËPAGESA</h2>
    <table><tr><th>Emri</th><td>${candidate.emri}</td><th>Mbiemri</th><td>${candidate.mbiemri}</td></tr>
    <tr><th>Nr. Personal</th><td>${candidate.numriPersonal}</td><th>Nr. Regjistrimit</th><td>${candidate.numriRegjistrimit}</td></tr>
    <tr><th>Kategoria</th><td>${candidate.kategoria}</td><th>Data</th><td>${new Date().toLocaleDateString("sq-AL")}</td></tr></table>
    <div class="summary"><div><strong>Shuma e Marrëveshjes:</strong> ${candidate.shumaMarreveshjes.toFixed(2)} €</div>
    <div><strong>Totali i Paguar:</strong> ${totalPaguar.toFixed(2)} €</div>
    <div><strong>Borxhi:</strong> ${borxhi.toFixed(2)} €</div></div>
    ${candidate.payments.length > 0 ? `<h3>Historiku i Pagesave</h3><table><thead><tr><th>Nr.</th><th>Data</th><th>Shuma</th></tr></thead><tbody>${candidate.payments.map((p, i) => `<tr><td>${i + 1}</td><td>${p.data}</td><td>${p.shuma.toFixed(2)} €</td></tr>`).join("")}</tbody></table>` : ""}
    <script>window.print();<\/script></body></html>`);
  printWindow.document.close();
};

interface CandidateDetailProps {
  candidate: Candidate;
  onBack: () => void;
}

const CandidateDetail = ({ candidate, onBack }: CandidateDetailProps) => {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const totalPaguar = candidate.payments.reduce((sum, p) => sum + p.shuma, 0);
  const borxhi = candidate.shumaMarreveshjes - totalPaguar;

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const documents = [
    { id: "libreza", label: "Libreza e Kandidatit", icon: BookOpen },
    { id: "vertetimi", label: "Vërtetimi", icon: FileCheck },
    { id: "fletparaqitja", label: "Fletparaqitja", icon: FileText },
    { id: "kontrata", label: "Kontrata", icon: FileSignature },
  ];

  if (activeDoc === "libreza") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveDoc(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek paneli
        </Button>
        <CandidateBooklet candidates={[candidate]} preselectedId={candidate.id} />
      </div>
    );
  }

  if (activeDoc === "vertetimi") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveDoc(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek paneli
        </Button>
        <CandidateVertetimi candidates={[candidate]} preselectedId={candidate.id} />
      </div>
    );
  }

  if (activeDoc === "fletparaqitja" || activeDoc === "kontrata") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveDoc(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek paneli
        </Button>
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Kjo faqe është në zhvillim...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Kthehu tek lista
      </Button>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{candidate.emri} {candidate.mbiemri}</h2>
            <p className="text-muted-foreground">Nr. Regjistrimit: {candidate.numriRegjistrimit}</p>
          </div>
          <StatusBadge status={candidate.statusi} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Nr. Personal:</span> <strong>{candidate.numriPersonal}</strong></div>
          <div><span className="text-muted-foreground">Telefoni:</span> <strong>{candidate.telefon}</strong></div>
          <div><span className="text-muted-foreground">Data e Lindjes:</span> <strong>{formatDate(candidate.dataLindjes)}</strong></div>
          <div><span className="text-muted-foreground">Kategoria:</span> <strong>{candidate.kategoria}</strong></div>
          <div><span className="text-muted-foreground">Vendi:</span> <strong>{candidate.vendi}</strong></div>
          <div><span className="text-muted-foreground">Data Regjistrimit:</span> <strong>{candidate.dataRegjistrimit}</strong></div>
          <div><span className="text-muted-foreground">Çertifikata:</span> <strong>{candidate.certifikataShendetsore}</strong></div>
          <div><span className="text-muted-foreground">Shuma Marrëveshjes:</span> <strong>{candidate.shumaMarreveshjes.toFixed(2)} €</strong></div>
          <div><span className="text-muted-foreground">Paguar:</span> <strong className="text-primary">{totalPaguar.toFixed(2)} €</strong></div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Borxhi:</span>
            <strong className={borxhi > 0 ? "text-destructive" : "text-primary"}>{borxhi.toFixed(2)} €</strong>
            {borxhi > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={() => printFletepagesa(candidate)}>
                <Printer className="w-3.5 h-3.5" /> Printo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Dokumentet</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <Button
                key={doc.id}
                variant="outline"
                className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => setActiveDoc(doc.id)}
              >
                <Icon className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-center">{doc.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {candidate.payments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Historiku i Pagesave</h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nr.</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Shuma</th>
                </tr>
              </thead>
              <tbody>
                {candidate.payments.map((p, i) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{p.data}</td>
                    <td className="p-3 font-medium text-primary">{p.shuma.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetail;
