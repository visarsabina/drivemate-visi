import { useState, useRef } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Printer, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { escapeHtmlObject, escapeHtml as __esc } from "@/lib/escapeHtml";

interface CandidateBookletProps {
  candidates: Candidate[];
  preselectedId?: string;
}

const CandidateBooklet = ({ candidates, preselectedId }: CandidateBookletProps) => {
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const candidate = candidates.find((c) => c.id === selectedId);

  const handlePrint = () => {
    if (!candidate) return;
    const safe = escapeHtmlObject(candidate);

    const formatDate = (d: string) => {
      if (!d) return "";
      const parts = d.split("-");
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    const practiceRows = (count: number) =>
      Array.from({ length: count }, (_, i) => `
        <tr>
          <td style="text-align:center;height:28px;">${i + 1}.</td>
          <td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
      `).join("");

    const theoryRows = Array.from({ length: 12 }, (_, i) => `
      <tr>
        <td style="text-align:center;height:28px;">${i + 1}.</td>
        <td></td><td></td><td></td><td></td>
      </tr>
    `).join("");

    const html = `
      <html>
      <head>
        <title>Libreza - ${safe.emri} ${safe.mbiemri}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: "Times New Roman", serif; font-size: 13px; }
          .page { width: 100%; display: flex; gap: 20px; page-break-after: always; }
          .half { width: 48%; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #000; padding: 3px 6px; font-size: 11px; }
          .no-border { border: none; }
          .no-border td { border: none; padding: 4px 0; }
          h2 { font-size: 22px; text-align: center; margin: 10px 0; }
          h3 { font-size: 14px; text-align: center; margin: 8px 0; }
          .header { font-size: 14px; margin-bottom: 5px; }
          .field-label { width: 55%; }
          .field-value { font-weight: bold; text-decoration: underline; }
          .box { border: 1px solid #000; padding: 10px; margin-top: 10px; }
          .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin-left: 10px; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <!-- PAGE 1 -->
        <div class="page">
          <!-- Left: Practice A table -->
          <div class="half">
            <h3>Lënda: Te drejtuarit e mjetit me veprim motorik (pjesa praktike)</h3>
            <p class="center" style="margin-bottom:5px;">Aftësimi plotësues</p>
            <table>
              <thead>
                <tr>
                  <th style="width:35px;">Nr.</th>
                  <th style="width:70px;">Data</th>
                  <th>Koha e ngasjes Prej-deri</th>
                  <th>Targat e automjetit</th>
                  <th>Tema: Njesia mësimore</th>
                  <th>Nënshkrimi i shofer-Instruktorit</th>
                  <th>Nënshkrimi i kandidatit</th>
                </tr>
              </thead>
              <tbody>
                ${practiceRows(15)}
              </tbody>
            </table>
            <div class="box" style="margin-top:15px;">
              <p style="text-decoration:underline;">Mendimi i shofer-instruktorit:</p>
              <br/><br/>
              <p><u>Emri dhe mbiemri i Shofer-Instruktorit:</u> <span class="signature-line"></span></p>
              <p style="margin-top:5px;"><u>Nënshkrimi i Shofer-Instruktorit:</u> <span class="signature-line"></span></p>
            </div>
          </div>

          <!-- Right: Candidate info -->
          <div class="half">
            <div class="header">
              <p><b>Autoshkolla <i>Visi</i></b></p>
              <p>Regjioni: <b>Prishtinë</b></p>
              <p>Komuna: <b>Podujevë</b></p>
            </div>
            <h2>LIBREZË E KANDIDATIT</h2>
            <p style="text-align:center;margin-bottom:15px;">
              Për aftesimin e kandidatit për shoferë të kategorisë <b><i>"${safe.kategoria}"</i></b>
            </p>
            <table class="no-border" style="margin-bottom:10px;">
              <tr>
                <td class="field-label">Emri dhe mbiemri</td>
                <td class="field-value">${safe.emri} ${safe.mbiemri}</td>
              </tr>
              <tr>
                <td class="field-label">Data dhe viti i lindjes</td>
                <td class="field-value">${formatDate(safe.dataLindjes)}</td>
              </tr>
              <tr>
                <td class="field-label">Nr.personal i leternjoftimit</td>
                <td class="field-value">${safe.numriPersonal}</td>
              </tr>
              <tr>
                <td class="field-label">Adresa:</td>
                <td class="field-value">${safe.vendi}</td>
              </tr>
              <tr><td colspan="2" style="height:10px;"></td></tr>
              <tr>
                <td class="field-label">Nr. i regjistrit të kandidatit</td>
                <td class="field-value">${safe.numriRegjistrimit}</td>
              </tr>
              <tr><td colspan="2" style="height:10px;"></td></tr>
              <tr>
                <td class="field-label">Çertifikatë shëndetësore</td>
                <td class="field-value">${safe.certifikataShendetsore}</td>
              </tr>
              <tr><td colspan="2" style="height:10px;"></td></tr>
              <tr>
                <td class="field-label">Nënshkrimi i kandidatit:</td>
                <td><span class="signature-line"></span></td>
              </tr>
            </table>
            <div style="text-align:right;margin-top:20px;">
              <span class="signature-line"></span> Vendi
            </div>
            <div style="margin-top:15px;">
              <p>Data <span class="signature-line"></span></p>
              <p style="text-align:right;font-size:11px;">v.v</p>
            </div>
            <p style="margin-top:10px;">Nënshkrimi i personit të autorizuar</p>
            <span class="signature-line"></span>
          </div>
        </div>

        <!-- PAGE 2 -->
        <div class="page">
          <!-- Left: Theory table -->
          <div class="half">
            <h3>Lënda: Rregullat e komunikacionit dhe të sigurisë (pjesa teorike)</h3>
            <table>
              <thead>
                <tr>
                  <th style="width:35px;">Nr</th>
                  <th style="width:80px;">Data</th>
                  <th>Koha Prej-deri</th>
                  <th>Kapitujt mësimore</th>
                  <th>Nënshkrimi i Ligjëruesit</th>
                </tr>
              </thead>
              <tbody>
                ${theoryRows}
              </tbody>
            </table>
            <div class="box" style="margin-top:15px;">
              <p style="text-decoration:underline;">Mendimi i ligjëruesit:</p>
              <br/><br/><br/>
              <p><u>Emri dhe mbiemri i ligjëruesit:</u> <span class="signature-line"></span></p>
              <p style="margin-top:5px;"><u>Nënshkrimi i ligjëruesit:</u> <span class="signature-line"></span></p>
            </div>
          </div>

          <!-- Right: Practice B table -->
          <div class="half">
            <h3 style="font-weight:bold;font-style:italic;">${safe.kategoria}</h3>
            <h3>Lënda: Te drejtuarit e mjetit me veprim motorik (pjesa praktike)</h3>
            <table>
              <thead>
                <tr>
                  <th style="width:35px;">Nr.</th>
                  <th style="width:70px;">Data</th>
                  <th>Koha e ngasjes Prej-deri</th>
                  <th>Targat e automjetit</th>
                  <th>Tema: Njesia mësimore</th>
                  <th>Nënshkrimi i shofer-Instruktorit</th>
                  <th>Nënshkrimi i kandidatit</th>
                </tr>
              </thead>
              <tbody>
                ${practiceRows(20)}
              </tbody>
            </table>
            <div class="box" style="margin-top:15px;">
              <p style="text-decoration:underline;">Mendimi i shofer-instruktorit:</p>
              <br/>
              <p><u>Emri dhe mbiemri i Shofer-Instruktorit:</u> <span class="signature-line"></span></p>
              <p style="margin-top:5px;"><u>Nënshkrimi i Shofer-Instruktorit:</u> <span class="signature-line"></span></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Libreza e Kandidatit</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Zgjidhni kandidatin për të gjeneruar librezën me të dhënat e tij/saj.
        </p>
        <div className="space-y-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Zgjidhni kandidatin" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.emri} {c.mbiemri} - {c.numriRegjistrimit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {candidate && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <p className="text-sm"><span className="text-muted-foreground">Emri:</span> <strong>{candidate.emri} {candidate.mbiemri}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Nr. Personal:</span> <strong>{candidate.numriPersonal}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Kategoria:</span> <strong>{candidate.kategoria}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Nr. Regjistrimit:</span> <strong>{candidate.numriRegjistrimit}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Vendi:</span> <strong>{candidate.vendi}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Çertifikata:</span> <strong>{candidate.certifikataShendetsore}</strong></p>
            </div>
          )}

          <Button onClick={handlePrint} disabled={!candidate} className="w-full sm:w-auto">
            <Printer className="w-4 h-4 mr-2" />
            Shtyp Librezën
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidateBooklet;
