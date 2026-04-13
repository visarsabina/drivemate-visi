import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

interface CandidateKontrataProps {
  candidates: Candidate[];
  preselectedId?: string;
}

const CandidateKontrata = ({ candidates, preselectedId }: CandidateKontrataProps) => {
  const [selectedId, setSelectedId] = useState(preselectedId || "");
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Kontrata - ${candidate.emri} ${candidate.mbiemri}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 14px; color: #000; padding: 40px 50px; line-height: 1.9; }
  .title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 2px; }
  .subtitle { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 20px; }
  .u { border-bottom: 1px solid #000; display: inline-block; min-width: 100px; padding-bottom: 1px; }
  .u-long { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; padding-bottom: 1px; }
  .section-num { text-align: center; font-weight: bold; text-decoration: underline; margin: 12px 0 4px; }
  .paragraph { margin-bottom: 8px; text-align: justify; }
  .signatures { margin-top: 40px; }
  .sig-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .sig-left { width: 45%; }
  .sig-right { width: 45%; text-align: right; }
  .sig-line { border-bottom: 1px solid #000; display: inline-block; min-width: 180px; margin-top: 10px; }
  .center-text { text-align: center; margin-top: 10px; }
  .date-line { margin-top: 15px; }
  @media print { body { padding: 20px 30px; } }
</style></head><body>

<div class="title">KONTRATË:</div>
<div class="subtitle">PËR AFTËSIMIN E KANDIDATËVE PËR PATENT SHOFER</div>

<div class="paragraph">
  E lidhur ne <u>Podujevë</u> në mes të paleve kontraktuese si vijon:
</div>

<div class="paragraph">
  1. Auto.Shkolla'' &nbsp;<strong>"VISI"</strong>&nbsp; nga &nbsp;<strong><u>PODUJEVA</u></strong>&nbsp; në njërën anë:
</div>

<div class="paragraph">
  2. Kandidati/ja <span class="u-long"><strong>${candidate.emri} ${candidate.mbiemri}</strong></span> nga <span class="u"><strong>${candidate.vendi || ""}</strong></span> K.K <span class="u"><strong>${candidate.vendi || ""}</strong></span>.
</div>

<div class="section-num">1</div>
<div class="paragraph">
  Objekti I kesaj kontrate është : Aftesimi i Kandidatit/es për marrjen e patent Shoferit.
</div>

<div class="section-num">2</div>
<div class="paragraph">
  Autoshkolla është e obliguar që kandidatin/en te e aftësoj sipas ligjit dhe udhzimit administrative në fuqi .
</div>

<div class="section-num">3.</div>
<div class="paragraph">
  Ligjeruesi dhe Shofer Instuktori obligohen që ta aftesojne Kandidatin/en sipas ligjit dhe udhzimit administrative ne fuqi .
</div>

<div class="section-num">4.</div>
<div class="paragraph">
  Kandidati/ja Obligohet që te marrë pjese në mesimet teorike dhe praktike sipas planprogramit te parapar ne Autoshkolle.
</div>

<div class="section-num">5.</div>
<div class="paragraph">
  Autoshkolla Obligohet që Kandidatit/es tja siguroj mjetin per provimin nga pjesa praktike vetem nese është e nevojshme .
</div>

<div class="section-num">6.</div>
<div class="paragraph">
  Qmimi per Oret mesimore nga lendet e caktuara është <span class="u"><strong>${candidate.shumaMarreveshjes.toFixed(2)}</strong></span> euro.
</div>
<div class="paragraph">
  Kohë zgjatja e Aftesimit Për bëhet nga pjesa Teorike prej <span class="u"><strong>20</strong></span> oreve dhe pjesa praktike prej <span class="u"><strong>20</strong></span> oreve .
</div>
<div class="paragraph">
  Pagesa per aftesimin e kadidatit/es do të bëhet te në zyre të Autoshkolles " VISI " në
  <span class="u"><strong>${candidate.shumaMarreveshjes.toFixed(2)} €</strong></span> për mes arkes fiskale.
</div>
<div class="paragraph">
  Për mos përmbushjen e kushteue dhe obligimeve kontraktuese nga ana e ndonjeres prej paleve kontraktuese në kete kontrat kompetente eshte Gjykata Komunale në &nbsp;<strong><u>PODUJEVË</u></strong>.
</div>

<div class="center-text" style="margin-top:25px; text-decoration:underline; font-weight:bold;">KONTRAKTUESIT :</div>

<div class="signatures">
  <div class="sig-row">
    <div class="sig-left">
      Kandidati/ja<br/>
      <span class="sig-line"></span>
    </div>
    <div class="sig-right">
      Drejtori: &nbsp;<strong><u>Fadil Jaha</u></strong> .<br/>
      <span class="sig-line"></span>
    </div>
  </div>
  <div class="center-text">Auto Shkolla " VISI "</div>
  <div class="date-line">
    Më datën: <span class="u"><strong>${formatDate(candidate.dataRegjistrimit)}</strong></span>
  </div>
</div>

<script>window.print();<\/script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-6">Kontrata e Kandidatit</h2>

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
                <p><span className="text-muted-foreground">Vendbanimi:</span> <strong>{candidate.vendi}</strong></p>
                <p><span className="text-muted-foreground">Kategoria:</span> <strong>{candidate.kategoria}</strong></p>
                <p><span className="text-muted-foreground">Shuma Marrëveshjes:</span> <strong>{candidate.shumaMarreveshjes.toFixed(2)} €</strong></p>
                <p><span className="text-muted-foreground">Data Regjistrimit:</span> <strong>{candidate.dataRegjistrimit}</strong></p>
              </div>

              <Button onClick={handlePrint} className="gap-2 mt-4">
                <Printer className="w-4 h-4" /> Printo Kontratën
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateKontrata;
