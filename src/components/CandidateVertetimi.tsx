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
  onPrinted?: (candidateId: string) => void;
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

const CandidateVertetimi = ({ candidates, preselectedId, onPrinted }: CandidateVertetimiProps) => {
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
    onPrinted?.(candidate.id);

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Vërtetimi - ${candidate.emri} ${candidate.mbiemri}</title>
<style>
  @page { size: A4 landscape; margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; padding: 30px 40px; line-height: 1.8; }
  .header { text-align: center; margin-bottom: 10px; font-size: 13px; }
  .title { text-align: center; font-size: 22px; font-weight: bold; margin: 15px 0 20px; }
  .info-line { margin-bottom: 4px; }
  .nr-personal { display: inline; }
  .nr-personal span { display: inline-block; border: 1px solid #000; width: 22px; height: 22px; text-align: center; line-height: 22px; font-weight: bold; margin-right: 2px; }
  .section { margin: 10px 0; }
  .signatures { margin-top: 40px; }
  .sig-row { display: flex; justify-content: space-between; margin-bottom: 25px; }
  .sig-left { width: 45%; }
  .sig-right { width: 45%; }
  .sig-line { border-bottom: 1px solid #000; min-height: 30px; }
  .bottom-row { display: flex; justify-content: space-between; margin-top: 30px; }
  .vula { text-align: center; margin-top: 20px; font-style: italic; }
  .u { border-bottom: 1px solid #000; padding-bottom: 1px; display: inline-block; min-width: 80px; }
  .u-wide { border-bottom: 1px solid #000; padding-bottom: 1px; display: inline-block; min-width: 150px; }
  .mendimi-line { border-bottom: 1px solid #000; display: block; padding-bottom: 2px; margin-top: 10px; }
  @media print { body { padding: 15px 25px; } }
</style></head><body>

<div class="header">
  Auto Shkolla &nbsp;&nbsp;"<strong>VISI</strong>" &nbsp;me seli në &nbsp;<strong>Podujevë</strong>&nbsp; adresa: &nbsp;<strong>Rr. Zahir Pajaziti</strong>&nbsp; dhe me &nbsp;numër të licencës &nbsp;&nbsp;<strong>62-01-B/2019</strong>&nbsp; lëshon këtë:
</div>

<div class="title">VËRTETIM</div>

<div class="section">
  <div class="info-line">
    &nbsp;&nbsp;&nbsp;&nbsp;<span class="u"><strong>${candidate.emri}</strong></span>(<span class="u"><strong>${vendlindja || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</strong></span>)<span class="u"><strong>${candidate.mbiemri}</strong></span>
    &nbsp;&nbsp;e lindur më: &nbsp;<span class="u"><strong>${formatDate(candidate.dataLindjes)}</strong></span>
    &nbsp;&nbsp;në: &nbsp;<span class="u"><strong>${vendlindja || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</strong></span>
    &nbsp;&nbsp;Komuna: &nbsp;<span class="u"><strong>${komuna || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</strong></span>
  </div>
  
  <div class="info-line" style="margin-top:8px;">
    &nbsp;&nbsp;&nbsp;&nbsp;me vendbanim në &nbsp;<span class="u"><strong>${vendbanimi || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</strong></span>
    &nbsp;&nbsp;nr. personal &nbsp;
    <span class="nr-personal">${candidate.numriPersonal.split("").map(d => "<span>" + d + "</span>").join("")}</span>
    &nbsp;&nbsp;i regjistruar në auto shkollë më datën:
  </div>

  <div class="info-line" style="margin-top:8px;">
    &nbsp;&nbsp;&nbsp;&nbsp;<span class="u"><strong>${formatDate(candidate.dataRegjistrimit)}</strong></span>
    &nbsp;&nbsp;nr. Rendor &nbsp;<span class="u"><strong>${candidate.numriRegjistrimit}</strong></span>
    &nbsp;&nbsp;kreu aftësimin për dhenien e provimit për paten-shofer për kat. &nbsp;"<span class="u"><strong>${candidate.kategoria}</strong></span>", &nbsp;sipas planit
  </div>

  <div class="info-line" style="margin-top:4px;">
    &nbsp;&nbsp;&nbsp;&nbsp;programit të parapare nga lëndët mësimore:
  </div>
</div>

<div class="section" style="margin-top:15px;">
  <div class="info-line">
    Rregullat e komunikaciont dhe të sigurisë (pjesa teorike) prej &nbsp;<span class="u"><strong>${numriOreveTeori}</strong></span>&nbsp; orëve në kohën prej: &nbsp;<span class="u"><strong>${formatDate(dataFillimitTeori)}</strong></span>&nbsp; deri: &nbsp;<span class="u"><strong>${formatDate(dataMbarimitTeori)}</strong></span>
  </div>
  <div class="info-line">
    Të drejtuarit e mjetit me veprim motorik (pjesa praktike) prej &nbsp;<span class="u"><strong>${numriOrevePraktike}</strong></span>&nbsp; orëve në kohën prej: &nbsp;<span class="u"><strong>${formatDate(dataFillimitPraktike)}</strong></span>&nbsp; deri: &nbsp;<span class="u"><strong>${formatDate(dataMbarimitPraktike)}</strong></span>
  </div>
</div>

<div class="section" style="margin-top:15px;">
  <div class="info-line">&nbsp;&nbsp;&nbsp;&nbsp;Pas verifikimit të aftësive të kandiatit jepet mendimi:</div>
  <div class="mendimi-line" style="margin-top:10px;">
    &nbsp;&nbsp;&nbsp;&nbsp;Ligjëruesi: &nbsp;&nbsp;Është aftësuar nga pjesa teorike
  </div>
  <div class="mendimi-line" style="margin-top:10px;">
    &nbsp;&nbsp;&nbsp;&nbsp;Shofer instruktori: &nbsp;&nbsp;Është aftësuar nga pjesa praktike
  </div>
</div>

<div class="signatures">
  <div class="sig-row">
    <div class="sig-left">Emri dhe mbiemri i ligjëruesit &nbsp;&nbsp;&nbsp;<span class="u-wide"><strong>${ligjruesi}</strong></span></div>
    <div class="sig-right">Nënshkrimi i ligjëruesit _______________</div>
  </div>
  <div class="sig-row">
    <div class="sig-left">Emri dhe mbiemri i shofer instruktorit &nbsp;&nbsp;&nbsp;<span class="u-wide"><strong>${instruktori}</strong></span></div>
    <div class="sig-right">Nënshkrimi i shofer instruktorit _______________</div>
  </div>
</div>

<div class="bottom-row">
  <div>Data e lëshurjes së vërtetimit &nbsp;&nbsp;&nbsp;<span class="u"><strong>${formatDate(dataLeshimit)}</strong></span></div>
  <div>Drejtori: &nbsp;<strong>Fadil Jaha</strong></div>
</div>

<div class="vula" style="margin-top:15px;">v.v</div>
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
