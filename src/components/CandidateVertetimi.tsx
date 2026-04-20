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
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 10mm; position: relative; }
  .frame { border: 2px solid #000; width: 100%; height: 100%; padding: 6mm 8mm; display: flex; flex-direction: column; }
  .header { text-align: center; line-height: 1.7; font-size: 12pt; padding: 2mm 4mm 4mm; }
  .title { text-align: center; font-size: 22pt; font-weight: bold; letter-spacing: 2px; margin: 4mm 0 6mm; }
  .row { display: flex; align-items: stretch; border-top: 1px solid #000; }
  .row:last-child { border-bottom: 1px solid #000; }
  .cell { padding: 2.5mm 3mm; border-right: 1px solid #000; display: flex; align-items: center; gap: 3mm; min-height: 9mm; }
  .cell:last-child { border-right: none; }
  .cell .label { white-space: nowrap; }
  .cell .val { font-weight: bold; flex: 1; text-align: center; }
  .nrp { display: flex; gap: 1px; }
  .nrp span { display: inline-block; border: 1px solid #000; width: 6mm; height: 6mm; text-align: center; line-height: 6mm; font-weight: bold; font-size: 11pt; }
  .full { flex: 1; }
  .mendimi { padding: 3mm 4mm; border-top: 1px solid #000; }
  .sig-cell { flex: 1; padding: 3mm 4mm; border-right: 1px solid #000; display: flex; align-items: center; gap: 3mm; }
  .sig-cell:last-child { border-right: none; }
  .sig-val { font-weight: bold; border-bottom: 1px solid #000; flex: 1; text-align: center; padding: 0 4mm; }
  .vula { text-align: center; font-style: italic; padding: 4mm 0 2mm; margin-top: auto; }
</style></head><body>

<div class="page"><div class="frame">

  <div class="header">
    Auto Shkolla &nbsp;"<strong>VISI</strong>" &nbsp;me seli në &nbsp;<strong>Podujevë</strong>&nbsp; adresa: &nbsp;<strong>Rr. Zahir Pajaziti</strong>&nbsp; dhe me &nbsp;numër të<br/>
    licencës &nbsp;<strong><u>R-369-01-B/2023</u></strong>&nbsp; lëshon këtë:
  </div>

  <div class="title">VËRTETIM</div>

  <div class="row">
    <div class="cell" style="flex:1.4;"><span class="val">${candidate.emri} (${vendlindja || "____"}) ${candidate.mbiemri}</span></div>
    <div class="cell" style="flex:1.2;"><span class="label">e lindur më:</span><span class="val">${formatDate(candidate.dataLindjes)}</span></div>
    <div class="cell" style="flex:0.9;"><span class="label">në:</span><span class="val">${vendlindja || "____"}</span></div>
    <div class="cell" style="flex:1;"><span class="label">Komuna:</span><span class="val">${komuna || "____"}</span></div>
  </div>

  <div class="row">
    <div class="cell" style="flex:1.3;"><span class="label">me vendbanim në</span><span class="val">${vendbanimi || "____"}</span></div>
    <div class="cell" style="flex:2;"><span class="label">nr. personal</span><div class="nrp">${candidate.numriPersonal.split("").map(d => "<span>" + d + "</span>").join("")}</div></div>
    <div class="cell" style="flex:1.5;"><span class="label">i regjistruar në auto shkollë më datën:</span></div>
  </div>

  <div class="row">
    <div class="cell full"><span class="val" style="flex:0;">${formatDate(candidate.dataRegjistrimit)}</span><span class="label">nr. Rendor</span><span class="val" style="flex:0;">${candidate.numriRegjistrimit}</span><span class="label">kreu aftësimin për dhënien e provimit për paten-shofer për kat.</span><span class="val" style="flex:0;">"${candidate.kategoria}"</span><span class="label">, sipas plan</span></div>
  </div>

  <div style="height:4mm;"></div>

  <div class="row">
    <div class="cell full"><span class="label">Rregullat e komunikaciont dhe të sigurisë (pjesa teorike) prej</span><span class="val" style="flex:0;">${numriOreveTeori}</span><span class="label">orëve në kohën prej:</span><span class="val" style="flex:0;">${formatDate(dataFillimitTeori)}</span><span class="label">deri:</span><span class="val" style="flex:0;">${formatDate(dataMbarimitTeori)}</span></div>
  </div>
  <div class="row">
    <div class="cell full"><span class="label">Të drejtuarit e mjetit me veprim motorik (pjesa praktike) prej</span><span class="val" style="flex:0;">${numriOrevePraktike}</span><span class="label">orëve në kohën prej:</span><span class="val" style="flex:0;">${formatDate(dataFillimitPraktike)}</span><span class="label">deri:</span><span class="val" style="flex:0;">${formatDate(dataMbarimitPraktike)}</span></div>
  </div>

  <div class="mendimi">Pas verifikimit të aftësive të kandidatit jepet mendimi:</div>

  <div class="row">
    <div class="cell" style="flex:0.5;"><span class="label">Ligjëruesi :</span></div>
    <div class="cell full"><span class="val">Është aftësuar nga pjesa teorike</span></div>
  </div>
  <div class="row">
    <div class="cell" style="flex:0.5;"><span class="label">Shofer insruktori:</span></div>
    <div class="cell full"><span class="val">Është aftësuar nga pjesa praktike</span></div>
  </div>

  <div style="height:4mm;"></div>

  <div class="row">
    <div class="sig-cell"><span class="label">Emri dhe mbiemri i ligjëruesit</span><span class="sig-val">${ligjruesi}</span></div>
    <div class="sig-cell"><span class="label">Nënshkrimi i ligjëruesit</span><span class="sig-val">&nbsp;</span></div>
  </div>
  <div class="row">
    <div class="sig-cell"><span class="label">Emri dhe mbiemri i shofer insruktorit</span><span class="sig-val">${instruktori}</span></div>
    <div class="sig-cell"><span class="label">Nënshkrimi i shofer insruktorit</span><span class="sig-val">&nbsp;</span></div>
  </div>

  <div style="height:4mm;"></div>

  <div class="row" style="border-bottom:none;">
    <div class="sig-cell"><span class="label">Data e lëshurjes së vërtetimit</span><span class="sig-val">${formatDate(dataLeshimit)}</span></div>
    <div class="sig-cell" style="justify-content:flex-end;"><span class="label">Drejtori:</span><span class="val" style="flex:0; font-weight:bold;">Fadil Jaha</span></div>
  </div>

  <div class="vula">v.v</div>

</div></div>

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
