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
  const [komuna, setKomuna] = useState("");

  const candidate = candidates.find((c) => c.id === selectedId);

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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Fletparaqitja</title>
<style>
  @page { size: A4 portrait; margin: 10mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .header-title { font-size: 13px; font-weight: bold; margin: 2px 0; }
  .header-sub { font-size: 10px; margin: 1px 0; }
  .section-title { font-size: 10px; font-weight: bold; background: #f0f0f0; padding: 3px 5px; border: 1px solid #000; border-bottom: none; }
  .form-row { display: flex; align-items: baseline; padding: 4px 10px; font-size: 12px; }
  .form-label { flex: 1; }
  .form-value { flex: 0.7; font-weight: bold; border-bottom: 1px solid #000; min-width: 200px; padding-left: 5px; font-size: 13px; }
  .top-bar { display: flex; justify-content: space-between; margin: 8px 0; font-size: 11px; }
  .cat-box { font-size: 22px; font-weight: bold; border: 2px solid #000; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; position: absolute; top: 15mm; right: 20mm; }
  .docs-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 5px; }
  .docs-table th, .docs-table td { border: 1px solid #000; padding: 3px 5px; }
  .docs-table th { background: #f0f0f0; }
  .sig-section { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px; }
  .sig-box { width: 48%; }
  .sig-box .sig-title { font-weight: bold; font-size: 9px; }
  .dashed-line { border-top: 1px dashed #000; margin: 15px 0; }
  .bottom-section { font-size: 10px; }
  .bottom-section .center { margin-bottom: 3px; }
  @media print { body { padding: 0; } }
</style></head><body>
<div style="position:relative;">
  <div class="cat-box">${candidate.kategoria}</div>

  <div class="center">
    <img src="" onerror="this.style.display='none'" style="height:40px;margin-bottom:3px;" />
    <div class="header-title">REPUBLIKA E KOSOVËS / REPUBLIKA KOSOVA / REPUBLIC OF KOSOVO</div>
    <div class="header-title">QEVERIA / VLADA / GOVERNMENT</div>
    <div class="header-sub">MINISTRIA E INFRASTRUKTURËS DHE TRANSPORTIT</div>
    <div class="header-sub">MINISTRSTVO ZA INFRASTRUKTURU I TRANSOPROTA</div>
    <div class="header-sub">MINISTRY OF INFRASTRUCTURE AND TRANSPORT</div>
    <div class="header-sub" style="margin-top:5px;">NJËSIA E TESTIMIT PËR PATENT SHOFER: PRISHTINE</div>
    <div style="margin-top:8px;font-size:11px;font-weight:bold;">FLETËPARAQITJE PËR PROVIM PËR SHOFERË / PRIJAVA ZA POLAGANJE VOZAČKOG DOZVOLE</div>
    <div style="font-size:10px;font-weight:bold;">DRIVING EXAM RESERVATION FORM</div>
  </div>

  <div class="top-bar">
    <div>FORMA A1 NJPSH / JVD / DLU: ______________</div>
    <div>Nr. regj./Br.Regj./Lbook.no. <strong style="border-bottom:1px solid #000;padding:0 10px;">${candidate.numriRegjistrimit}</strong></div>
  </div>

  <div class="section-title">TE DHENAT E PARAQITESIT / PODACI PODNOSIOCA / APLICANT'S DETAILS</div>

  <div style="border:1px solid #000; padding: 5px 0;">
    <div class="form-row">
      <span class="form-label">1. Mbiemri / Prezime / Family Name:</span>
      <span class="form-value">${candidate.mbiemri}</span>
    </div>
    <div class="form-row">
      <span class="form-label">2. Emri i babait / Očevo ime / Father's Name:</span>
      <span class="form-value">${emriBabait}</span>
    </div>
    <div class="form-row">
      <span class="form-label">3. Emri / Ime / First Name:</span>
      <span class="form-value">${candidate.emri}</span>
    </div>
    <div class="form-row">
      <span class="form-label">4. Data e lindjes / Datum rodjenja / Date of Birth:</span>
      <span class="form-value">${formatDate(candidate.dataLindjes)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">5. Vendi i lindjes / Mesto rodjenja / Place of birth:</span>
      <span class="form-value">${vendlindja}</span>
    </div>
    <div class="form-row">
      <span class="form-label">6. Komuna / Opština / Municipality:</span>
      <span class="form-value">${komuna || candidate.vendi}</span>
    </div>
    <div class="form-row" style="align-items:center;">
      <span class="form-label">7. Numri personal / Lični broj / Personal Number:</span>
      <table style="border-collapse:collapse;">${personalBoxes}${emptyBoxes}</table>
    </div>
  </div>

  <div style="margin-top:3px;font-size:9px;font-weight:bold;">KATEGORIT PËR PATENT SHOFER / I KATEGORIJE ZA VOZAČKU DOZVOLU / DRIVING LICENSE CATEGORIES</div>
  <table style="border-collapse:collapse;width:100%;margin-top:2px;">
    <tr>${catCells}</tr>
  </table>

  <div style="margin-top:8px;">
    <div class="section-title" style="border-bottom:1px solid #000;">DOKUMENTET E BASHKANGJITURA / PRILOŽENI DOKUMENTI / ATTACHED DOCUMENTS</div>
    <table class="docs-table">
      <tr>
        <th style="width:60%;">9.Dokumentet / Dokumentacija / documents</th>
        <th style="width:15%;">Po/Jes/Yes</th>
        <th>Vërejtje/Primedbe/Remarks</th>
      </tr>
      <tr>
        <td>Vërtetimi i Auto Shkollës/ Potvrda Auto Škole/ Driving school certificate</td>
        <td class="center">PO</td>
        <td rowspan="4" class="center bold" style="font-size:16px;vertical-align:middle;">Auto shkolla<br/>VISI</td>
      </tr>
      <tr>
        <td>Çertifikata mjeksore/ Lekarsko uverenje/ Medical certificate</td>
        <td class="center">PO</td>
      </tr>
      <tr>
        <td>Çertifikata e kryqit të kuq / Uverenje crvenog krsta / Red Cross certificate</td>
        <td class="center">PO</td>
      </tr>
      <tr>
        <td>Fotokopja e letërnjoftimit / Fotokopija lična karta/ Photocopy ID Card</td>
        <td class="center">PO</td>
      </tr>
    </table>
  </div>

  <div style="margin-top:5px;font-size:9px;font-weight:bold;">PARAQITJA / PRIJAVA / RESERVATION</div>
  <div class="sig-section" style="border:1px solid #000;padding:8px;">
    <div class="sig-box">
      <div class="sig-title">10. Nënshkrimi I paraqitësit / Data / Potpis podnosioca / Datum / Officer's Signature / Date</div>
      <div style="margin-top:15px;">→</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">11. Nënshkrimi I nënpunsit zyrtar / Data / Potpis službenog lica / Datum / Aplican't Signature / Date</div>
    </div>
  </div>

  <div class="dashed-line"></div>

  <div class="bottom-section">
    <div><strong>Tel:${candidate.telefon}</strong></div>
    <div style="margin-top:8px;" class="center">
      <div class="header-sub">Republika e Kosovës / Republika Kosova / Republika of Kosovo</div>
      <div class="header-sub">Qeveria e Kosovës/ Vlada Kosova / Government of Kosova</div>
      <div class="header-sub">MINISTRIA E INFRASTRUKTURËS DHE TRANSPORTIT</div>
      <div class="header-sub">MINISTRSTVO ZA INFRASTRUKTURU I TRANSOPROTA</div>
      <div class="header-sub">MINISTRY OF INFRASTRUCTURE AND TRANSPORT</div>
    </div>
    <div style="margin-top:5px;font-size:10px;">Fletëza për paraqitjen e provimit për shofer / Listička prijavljeni vozački ispit / Driving exam reservation slip</div>
    <div class="top-bar" style="margin-top:3px;">
      <div>NJPSH / JVD / DLU: ______________</div>
      <div>Nr. Regj./Br.Regj./Lbook.no. <strong style="border-bottom:1px solid #000;padding:0 10px;">${candidate.numriRegjistrimit}</strong></div>
    </div>
    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-title">Emri dhe mbiemri I kandidatit/ Ime i prezime kandidata</div>
        <div style="margin-top:5px;font-weight:bold;">${candidate.emri} ${candidate.mbiemri}</div>
        <div style="margin-top:10px;">→</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Nënshkrimi I nënëpunësit zyrtar/ Data / Potpis službenog lica</div>
      </div>
    </div>
  </div>
</div>
<script>window.print();<\/script>
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
