import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";

interface CandidateFletparaqitjaProps {
  candidates: Candidate[];
  preselectedId?: string;
}

const CandidateFletparaqitja = ({ candidates, preselectedId }: CandidateFletparaqitjaProps) => {
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [emriBabait, setEmriBabait] = useState("");
  const [vendlindja, setVendlindja] = useState("");
  const [komuna, setKomuna] = useState("");

  const candidate = candidates.find((c) => c.id === selectedId);

  // Sync from candidate data
  const effectiveEmriBabait = emriBabait || candidate?.emriBabait || "";
  const effectiveVendlindja = vendlindja || candidate?.vendlindja || "";

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handlePrint = () => {
    if (!candidate) return;

    const nrPersonal = candidate.numriPersonal.split("");
    const personalBoxes = nrPersonal.map(d => `<td style="border:1px solid #000;width:28px;height:28px;text-align:center;font-weight:bold;font-size:14px;">${d}</td>`).join("");
    // Pad to 10 boxes
    const remaining = 10 - nrPersonal.length;
    const emptyBoxes = Array(Math.max(0, remaining)).fill('<td style="border:1px solid #000;width:28px;height:28px;"></td>').join("");

    const allCategories = ["A1","A","B1","B","C1","C","D1","D","BE","C1E","CE","D1E","DE","M","T"];
    const catCells = allCategories.map(cat => {
      const isSelected = candidate.kategoria === cat || candidate.kategoria === cat.replace("1","1");
      return `<td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:10px;font-weight:${isSelected ? 'bold' : 'normal'};background:${isSelected ? '#e0e0e0' : 'transparent'}">${cat}</td>`;
    }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Fletparaqitja - ${candidate.emri} ${candidate.mbiemri}</title>
<style>
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { position: relative; width: 100%; }
  .cat-box { position: absolute; top: 0; right: 0; border: 1.5px solid #000; width: 14mm; height: 14mm; display: flex; align-items: center; justify-content: center; font-size: 22pt; font-weight: bold; }
  .header { text-align: center; }
  .header img { height: 18mm; margin-bottom: 2mm; }
  .h-main { font-size: 14pt; font-weight: bold; line-height: 1.3; }
  .h-sub { font-size: 11pt; line-height: 1.4; }
  .h-small { font-size: 10pt; line-height: 1.4; }
  .form-title { font-size: 11pt; margin-top: 3mm; }
  .meta-row { display: flex; justify-content: space-between; margin-top: 3mm; font-size: 11pt; }
  .meta-row .u { border-bottom: 1px solid #000; min-width: 40mm; display: inline-block; padding: 0 4mm; text-align: center; font-weight: bold; }
  .sec-bar { border: 1px solid #000; padding: 2mm 4mm; font-weight: bold; font-size: 11pt; margin-top: 3mm; }
  .data-box { border: 1px solid #000; border-top: none; padding: 3mm 6mm; }
  .frow { display: flex; align-items: baseline; padding: 1.5mm 0; }
  .flbl { flex: 0 0 60%; font-size: 11pt; }
  .fval { flex: 1; font-weight: bold; border-bottom: 1px solid #000; padding: 0 4mm 1px; text-align: center; min-height: 5mm; font-size: 12pt; }
  .nr-row { display: flex; align-items: center; padding: 1.5mm 0; }
  .nr-row .flbl { flex: 0 0 60%; }
  .nrp { border-collapse: collapse; }
  .nrp td { border: 1px solid #000; width: 7mm; height: 7mm; text-align: center; font-weight: bold; font-size: 11pt; vertical-align: middle; }
  .cat-title { font-size: 9pt; font-weight: bold; margin-top: 3mm; padding-bottom: 1mm; border-bottom: 1px solid #000; }
  .cat-table { width: 100%; border-collapse: collapse; }
  .cat-table td { border: 1px solid #000; padding: 1.5mm 0; text-align: center; font-size: 11pt; }
  .cat-table td.sel { background: #c8c8c8; font-weight: bold; }
  .docs-row { display: flex; gap: 0; }
  .docs-table { flex: 1; border-collapse: collapse; font-size: 9.5pt; }
  .docs-table th, .docs-table td { border: 1px solid #000; padding: 1.5mm 2mm; }
  .docs-table th { font-weight: bold; text-align: center; }
  .docs-table td.po { text-align: center; width: 18mm; }
  .remarks-box { border: 1px solid #000; border-left: none; width: 38mm; padding: 2mm; text-align: center; display: flex; flex-direction: column; }
  .remarks-box .rh { font-size: 9pt; font-weight: bold; padding-bottom: 1mm; border-bottom: 1px solid #000; margin-bottom: 2mm; }
  .remarks-box .rb { font-weight: bold; font-size: 11pt; line-height: 1.3; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .remarks-box .rb .big { font-size: 18pt; }
  .sig-section { display: flex; gap: 0; margin-top: 0; }
  .sig-box { flex: 1; border: 1px solid #000; padding: 2mm 3mm; min-height: 18mm; }
  .sig-box + .sig-box { border-left: none; }
  .sig-title { font-size: 9pt; font-weight: bold; text-align: center; }
  .dashed { border-top: 1px dashed #000; margin: 5mm 0; }
  .tel { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #000; display: inline-block; padding: 0 6mm 1px; min-width: 60mm; }
  .small-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
  .small-table th, .small-table td { border: 1px solid #000; padding: 2mm; font-size: 10pt; }
  .small-table th { font-weight: bold; text-align: center; }
</style></head><body>
<div class="wrap">
  <div class="cat-box">${candidate.kategoria}</div>

  <div class="header">
    <img src="/kosovo-coat.jpg" alt="" />
    <div class="h-main">REPUBLIKA E KOSOVËS / REPUBLIKA KOSOVA / REPUBLIC OF KOSOVO</div>
    <div class="h-main">QEVERIA / VLADA / GOVERNMENT</div>
    <div class="h-sub" style="margin-top:2mm;">MINISTRIA E INFRASTRUKTURES DHE TRANSPORTIT</div>
    <div class="h-sub">MINISTRSTVO ZA INFRASTRUKTURE I TRANSOPRTA</div>
    <div class="h-sub">MINISTRY OF INFRASTRUCTURE AND TRANSPORT</div>
    <div class="h-small" style="margin-top:2mm;">NJËSIA E TESTIMIT PËR PATENT SHOFER: PRISHTINE</div>
    <div class="form-title">FLETËPARAQITJE PËR PROVIM PËR SHOFERË / PRIJAVA ZA POLAGANJE VOZAČKOG DOZVOLE</div>
    <div class="h-small">DRIVING EXAM RESERVATION FORM</div>
  </div>

  <div class="meta-row">
    <div>FORMA A1 NJPSH / JVD / DLU: <span class="u">&nbsp;</span></div>
    <div>Nr. regj./Br.Regj./Lbook.no. <span class="u">${candidate.numriRegjistrimit}</span></div>
  </div>

  <div class="sec-bar">TE DHENAT E PARAQITESIT / PODACI PODNOSIOCA / APLICANT'S DETAILS</div>
  <div class="data-box">
    <div class="frow"><span class="flbl">1.&nbsp;&nbsp;&nbsp;Mbiemri / Prezime / Family Name:</span><span class="fval">${candidate.mbiemri}</span></div>
    <div class="frow"><span class="flbl">2.&nbsp;&nbsp;&nbsp;Emri i babait / Očevo ime / Father's Name:</span><span class="fval">${effectiveEmriBabait || "&nbsp;"}</span></div>
    <div class="frow"><span class="flbl">3.&nbsp;&nbsp;&nbsp;Emri / Ime / First Name:</span><span class="fval">${candidate.emri}</span></div>
    <div class="frow"><span class="flbl">4.&nbsp;&nbsp;&nbsp;Data e lindjes / Datum rodjenja Date of Birth:</span><span class="fval">${formatDate(candidate.dataLindjes)}</span></div>
    <div class="frow"><span class="flbl">5.&nbsp;&nbsp;&nbsp;Vendi i lindjes / Mesto rodjenja / Place of birth:</span><span class="fval">${effectiveVendlindja || "&nbsp;"}</span></div>
    <div class="frow"><span class="flbl">6.&nbsp;&nbsp;&nbsp;Komuna / Opština / Municipality:</span><span class="fval">${komuna || candidate.vendi || "&nbsp;"}</span></div>
    <div class="nr-row"><span class="flbl">7.&nbsp;&nbsp;&nbsp;Numri personal / Lični broj / Personal Number:</span><table class="nrp"><tr>${personalBoxes}${emptyBoxes}</tr></table></div>
  </div>

  <div class="cat-title">KATEGORIT PËR PATENT SHOFER / I KATEGORIJE ZA VOZAČKU DOZVOLU / DRIVING LICENSE CATEGORIES</div>
  <table class="cat-table"><tr>${allCategories.map(cat => {
    const isSelected = candidate.kategoria === cat;
    return `<td class="${isSelected ? 'sel' : ''}">${cat}</td>`;
  }).join("")}</tr></table>

  <div class="sec-bar" style="margin-top:3mm;">DOKUMENTET E BASHKANGJITURA / PRILOŽENI DOKUMENTI / ATTACHED DOCUMENTS</div>
  <div class="docs-row">
    <table class="docs-table">
      <tr>
        <th>9.Dokumentet / Dokumentacija / documents</th>
        <th style="width:18mm;">Po/Jes/Yes</th>
      </tr>
      <tr><td>Vërtetimi I Auto Shkollës/ Potvrda Auto Škole/ Driving school certificate</td><td class="po">PO</td></tr>
      <tr><td>Çertifikata mjeksore/ Lekarsko uverenje / Medical certificate</td><td class="po">PO</td></tr>
      <tr><td>Çertifikata e kryqit të kuq / Uverenje crvenog krsta /Red Cross certificate</td><td class="po">PO</td></tr>
      <tr><td>Fotokopja e letërnjoftimit / Fotokopija lična karta/ Photocopy ID Card</td><td class="po">PO</td></tr>
    </table>
    <div class="remarks-box">
      <div class="rh">Vërejtje/Primedbe/Remarks</div>
      <div class="rb">Auto shkolla<br/><span class="big">VISI</span></div>
    </div>
  </div>

  <div class="sec-bar" style="margin-top:3mm;">PARAQITJA / PRIJAVA / RESERVATION</div>
  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-title">10. Nënshkrimi I paraqitësit / Data / Potpis<br/>podnosioca / Datum / Officer's Signature / Date</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">11. Nënshkrimi I nënpunsit zyrtar / Data /Potpis<br/>službenog lica / Datum / Aplican't Signature / Date</div>
    </div>
  </div>

  <div class="dashed"></div>

  <div>
    <div><span class="tel">Tel: ${candidate.telefon || ""}</span></div>
    <div class="header" style="margin-top:3mm;">
      <img src="/kosovo-coat.jpg" alt="" style="height:14mm;" />
      <div class="h-small">Republika e Kosovës / Republika Kosova / Republika of Kosovo</div>
      <div class="h-small">Qeveria e Kosovës/ Vlada Kosova / Government of Kosova</div>
      <div class="h-sub">MINISTRIA E INFRASTRUKTURES DHE TRANSPORTIT</div>
      <div class="h-sub">MINISTRSTVO ZA INFRASTRUKTURE I TRANSOPRTA</div>
      <div class="h-sub">MINISTRY OF INFRASTRUCTURE AND TRANSPORT</div>
      <div class="h-small" style="margin-top:1mm;">Fletëza për paraqitjen e provimit për shofer / Listič za prijavljeni vozački ispit / Driving exam reservation slip</div>
    </div>
    <div class="meta-row" style="margin-top:2mm;">
      <div>NJPSH / JVD / DLU: <span class="u">&nbsp;</span></div>
      <div>Nr. Regj./Br.Regj./Lbook.no. <span class="u">${candidate.numriRegjistrimit}</span></div>
    </div>
    <table class="small-table">
      <tr>
        <th style="width:50%;">Emri dhe mbiemri I kandidatit/<br/>Ime i prezime kandidata</th>
        <th>Nënshkrimi I nënëpunësit zyrtar/ Data / Potpis<br/>službenog lica</th>
      </tr>
      <tr>
        <td style="font-weight:bold; text-align:center; height:15mm;">${candidate.emri} ${candidate.mbiemri}</td>
        <td>&nbsp;</td>
      </tr>
    </table>
  </div>
</div>
<script>setTimeout(()=>window.print(),400);<\/script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Fletparaqitja për Provim</h2>

      <div className="space-y-4">
        {!preselectedId && (
          <div className="space-y-2">
            <Label>Zgjidh Kandidatin</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Zgjidh..." /></SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.emri} {c.mbiemri} - {c.numriRegjistrimit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {candidate && (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/50 rounded-lg">
              <div><span className="text-muted-foreground">Emri:</span> <strong>{candidate.emri} {candidate.mbiemri}</strong></div>
              <div><span className="text-muted-foreground">Nr. Personal:</span> <strong>{candidate.numriPersonal}</strong></div>
              <div><span className="text-muted-foreground">Kategoria:</span> <strong>{candidate.kategoria}</strong></div>
              <div><span className="text-muted-foreground">Telefoni:</span> <strong>{candidate.telefon}</strong></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emri i Babait</Label>
                <Input value={emriBabait} onChange={(e) => setEmriBabait(e.target.value)} placeholder="Emri i babait..." />
              </div>
              <div className="space-y-2">
                <Label>Vendlindja</Label>
                <Input value={vendlindja} onChange={(e) => setVendlindja(e.target.value)} placeholder="Vendi i lindjes..." />
              </div>
              <div className="space-y-2">
                <Label>Komuna</Label>
                <Input value={komuna} onChange={(e) => setKomuna(e.target.value)} placeholder={candidate.vendi || "Komuna..."} />
              </div>
            </div>

            <Button className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Printo Fletparaqitjen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateFletparaqitja;
