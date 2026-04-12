import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

interface CandidateVertetimiProps {
  candidates: Candidate[];
  preselectedId?: string;
}

const ligjruesit = ["Afrim Jaha"];
const instruktoret = [
  "Remzie Jaha",
  "Fadil Jaha",
  "Nesibe Zeka",
  "Dafina Jaha Hodolli",
  "Sabina Krasniqi Jaha",
  "Fatmir Syla",
  "Visar Jaha",
];

const CandidateVertetimi = ({ candidates, preselectedId }: CandidateVertetimiProps) => {
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [vendlindja, setVendlindja] = useState("");
  const [komuna, setKomuna] = useState("");
  const [vendbanimi, setVendbanimi] = useState("");
  const [numriOreveTeori, setNumriOreveTeori] = useState("20");
  const [dataFillimitTeori, setDataFillimitTeori] = useState("");
  const [dataMbarimitTeori, setDataMbarimitTeori] = useState("");
  const [numriOrevePraktike, setNumriOrevePraktike] = useState("20");
  const [dataFillimitPraktike, setDataFillimitPraktike] = useState("");
  const [dataMbarimitPraktike, setDataMbarimitPraktike] = useState("");
  const [ligjruesi, setLigjruesi] = useState(ligjruesit[0]);
  const [instruktori, setInstruktori] = useState(instruktoret[0]);
  const [dataLeshimit, setDataLeshimit] = useState(new Date().toISOString().split("T")[0]);

  const candidate = candidates.find((c) => c.id === selectedId);

  const formatDate = (d: string) => {
    if (!d) return "___.___.______";
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handlePrint = () => {
    if (!candidate) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Vërtetimi - ${candidate.emri} ${candidate.mbiemri}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; padding: 40px; line-height: 1.6; }
  .header { text-align: center; margin-bottom: 30px; }
  .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
  .header h2 { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
  .header p { font-size: 12px; }
  .title { text-align: center; font-size: 20px; font-weight: bold; margin: 30px 0; text-decoration: underline; text-transform: uppercase; }
  .content { margin: 20px 0; }
  .row { display: flex; margin-bottom: 8px; }
  .row .label { min-width: 200px; font-weight: bold; }
  .row .value { flex: 1; border-bottom: 1px dotted #999; padding-left: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  table th, table td { border: 1px solid #333; padding: 6px 10px; text-align: left; font-size: 12px; }
  table th { background: #f0f0f0; font-weight: bold; }
  .section-title { font-weight: bold; font-size: 14px; margin: 20px 0 10px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
  .signature-box { text-align: center; width: 200px; }
  .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
  .stamp-area { text-align: center; margin-top: 40px; }
  @media print { body { padding: 0; } }
</style></head><body>

<div class="header">
  <h1>AUTO SHKOLLA "VISI"</h1>
  <p>Nr. i Licencës: ____________</p>
  <p>Adresa: ____________ | Tel: ____________</p>
</div>

<div class="title">VËRTETIM</div>

<div class="content">
  <table>
    <tr><th style="width:200px">Emri</th><td>${candidate.emri}</td></tr>
    <tr><th>Mbiemri</th><td>${candidate.mbiemri}</td></tr>
    <tr><th>Datëlindja</th><td>${formatDate(candidate.dataLindjes)}</td></tr>
    <tr><th>Vendi i Lindjes</th><td>${vendlindja || "_______________"}</td></tr>
    <tr><th>Komuna</th><td>${komuna || "_______________"}</td></tr>
    <tr><th>Vendbanimi</th><td>${vendbanimi || "_______________"}</td></tr>
    <tr><th>Numri Personal</th><td>${candidate.numriPersonal}</td></tr>
    <tr><th>Data e Regjistrimit</th><td>${formatDate(candidate.dataRegjistrimit)}</td></tr>
    <tr><th>Numri i Regjistrimit</th><td>${candidate.numriRegjistrimit}</td></tr>
    <tr><th>Kategoria</th><td>${candidate.kategoria}</td></tr>
  </table>

  <div class="section-title">Mësimi Teorik</div>
  <table>
    <tr><th style="width:200px">Numri i Orëve</th><td>${numriOreveTeori}</td></tr>
    <tr><th>Data e Fillimit</th><td>${formatDate(dataFillimitTeori)}</td></tr>
    <tr><th>Data e Mbarimit</th><td>${formatDate(dataMbarimitTeori)}</td></tr>
    <tr><th>Ligjëruesi</th><td>${ligjruesi}</td></tr>
  </table>

  <div class="section-title">Mësimi Praktik</div>
  <table>
    <tr><th style="width:200px">Numri i Orëve</th><td>${numriOrevePraktike}</td></tr>
    <tr><th>Data e Fillimit</th><td>${formatDate(dataFillimitPraktike)}</td></tr>
    <tr><th>Data e Mbarimit</th><td>${formatDate(dataMbarimitPraktike)}</td></tr>
    <tr><th>Instruktori</th><td>${instruktori}</td></tr>
  </table>

  <p style="margin-top:20px;"><strong>Data e lëshimit të vërtetimit:</strong> ${formatDate(dataLeshimit)}</p>
</div>

<div class="signatures">
  <div class="signature-box">
    <div class="signature-line">Ligjëruesi</div>
    <p style="margin-top:5px; font-size:12px;">${ligjruesi}</p>
  </div>
  <div class="signature-box">
    <div class="signature-line">Vula</div>
  </div>
  <div class="signature-box">
    <div class="signature-line">Instruktori</div>
    <p style="margin-top:5px; font-size:12px;">${instruktori}</p>
  </div>
</div>

<script>window.print();<\/script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-6">Vërtetimi i Kandidatit</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Zgjedh Kandidatin</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Zgjedh kandidatin..." />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.numriRegjistrimit} - {c.emri} {c.mbiemri}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {candidate && (
            <>
              <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><span className="text-muted-foreground">Emri:</span> <strong>{candidate.emri} {candidate.mbiemri}</strong></p>
                <p><span className="text-muted-foreground">Nr. Personal:</span> <strong>{candidate.numriPersonal}</strong></p>
                <p><span className="text-muted-foreground">Datëlindja:</span> <strong>{formatDate(candidate.dataLindjes)}</strong></p>
                <p><span className="text-muted-foreground">Kategoria:</span> <strong>{candidate.kategoria}</strong></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Vendi i Lindjes</Label>
                  <Input value={vendlindja} onChange={(e) => setVendlindja(e.target.value)} placeholder="Vendi i lindjes" />
                </div>
                <div className="space-y-2">
                  <Label>Komuna</Label>
                  <Input value={komuna} onChange={(e) => setKomuna(e.target.value)} placeholder="Komuna" />
                </div>
                <div className="space-y-2">
                  <Label>Vendbanimi</Label>
                  <Input value={vendbanimi} onChange={(e) => setVendbanimi(e.target.value)} placeholder="Vendbanimi" />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3">Mësimi Teorik</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Numri i Orëve</Label>
                    <Input type="number" value={numriOreveTeori} onChange={(e) => setNumriOreveTeori(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data e Fillimit</Label>
                    <Input type="date" value={dataFillimitTeori} onChange={(e) => setDataFillimitTeori(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data e Mbarimit</Label>
                    <Input type="date" value={dataMbarimitTeori} onChange={(e) => setDataMbarimitTeori(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Ligjëruesi</Label>
                  <Select value={ligjruesi} onValueChange={setLigjruesi}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ligjruesit.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3">Mësimi Praktik</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Numri i Orëve</Label>
                    <Input type="number" value={numriOrevePraktike} onChange={(e) => setNumriOrevePraktike(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data e Fillimit</Label>
                    <Input type="date" value={dataFillimitPraktike} onChange={(e) => setDataFillimitPraktike(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data e Mbarimit</Label>
                    <Input type="date" value={dataMbarimitPraktike} onChange={(e) => setDataMbarimitPraktike(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Instruktori</Label>
                  <Select value={instruktori} onValueChange={setInstruktori}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instruktoret.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="space-y-2 max-w-xs">
                  <Label>Data e Lëshimit</Label>
                  <Input type="date" value={dataLeshimit} onChange={(e) => setDataLeshimit(e.target.value)} />
                </div>
              </div>

              <Button onClick={handlePrint} className="gap-2 mt-4">
                <Printer className="w-4 h-4" /> Printo Vërtetimin
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateVertetimi;
