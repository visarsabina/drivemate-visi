import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Printer, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { escapeHtmlObject } from "@/lib/escapeHtml";

interface CandidateKontrataProps {
  candidates: Candidate[];
  preselectedId?: string;
}

const CandidateKontrata = ({ candidates, preselectedId }: CandidateKontrataProps) => {
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [open, setOpen] = useState(false);
  const candidate = candidates.find((c) => c.id === selectedId);

  const formatDate = (d: string) => {
    if (!d) return "___.___.______";
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handlePrint = () => {
    if (!candidate) return;
    const safe = escapeHtmlObject(candidate);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const bold = (text: string) => `<strong>${text}</strong>`;
    const underline = (width: string) => `<span style="border-bottom:1px solid #000; display:inline-block; min-width:${width}; padding-bottom:1px;"></span>`;

    const nameVal = safe.emri && safe.mbiemri ? bold(`${safe.emri} ${safe.mbiemri}`) : underline("220px");
    const birthVal = safe.dataLindjes ? bold(formatDate(safe.dataLindjes)) : underline("100px");
    const birthPlaceVal = safe.vendlindja ? bold(safe.vendlindja) : underline("140px");
    const personalVal = safe.numriPersonal ? bold(safe.numriPersonal) : underline("140px");
    const categoryVal = safe.kategoria ? bold(safe.kategoria) : underline("60px");
    const priceVal = safe.shumaMarreveshjes ? bold(safe.shumaMarreveshjes.toFixed(2)) : underline("80px");
    const regDateVal = safe.dataRegjistrimit ? bold(formatDate(safe.dataRegjistrimit)) : underline("100px");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Kontrata - ${safe.emri || ""} ${safe.mbiemri || ""}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 20mm 14mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; line-height: 1.55; }
  body { padding: 0; }
  .page { width: 100%; min-height: 261mm; display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .header-left { font-size: 11pt; font-weight: bold; }
  .header-center { font-size: 16pt; font-weight: bold; text-align: center; flex: 1; }
  .header-right { font-size: 16pt; font-weight: bold; }
  .subtitle { text-align: center; font-size: 12.5pt; font-weight: bold; text-decoration: underline; margin-bottom: 16px; }
  .intro { margin-bottom: 10px; }
  .party-line { margin-bottom: 6px; }
  .party-line2 { margin-bottom: 18px; }
  .neni { text-align: center; font-weight: bold; text-decoration: underline; margin-top: 10px; margin-bottom: 2px; }
  .paragraph { margin-bottom: 2px; text-align: justify; }
  .signatures { margin-top: auto; padding-top: 20px; }
  .sig-title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 12px; }
  .sig-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .sig-left { width: 42%; }
  .sig-right { width: 42%; text-align: right; }
  .sig-line { border-bottom: 1px solid #000; display: block; width: 100%; margin-top: 28px; }
  .page2 { page-break-before: always; padding-top: 0; }
  b, strong { font-weight: bold; }
</style></head><body>

<div class="page">

<div class="header">
  <div class="header-left">AUTO SHKOLLA</div>
  <div class="header-center">KONTRATË</div>
  <div class="header-right">VISI</div>
</div>

<div class="subtitle">PËR AFTËSIMIN E KANDIDATËVE PËR PATENT SHOFER</div>

<div class="intro">
  E lidhur në Podujevë në mes të palëve kontraktuese si vijon:
</div>

<div class="party-line">
  1. &nbsp;&nbsp;Auto shkolla &nbsp;<strong>"VISI"</strong>&nbsp; nga &nbsp;<strong>Podujeva</strong>&nbsp; me nr. të licencës &nbsp;<strong>R-369-01-B/2023</strong>&nbsp; në njëërën anë:
</div>

<div class="party-line">
  2. &nbsp;&nbsp;Kandidati/ja &nbsp;${nameVal}&nbsp; i/e lindur me: &nbsp;${birthVal}
</div>

<div style="margin-top:4px; margin-bottom:12px;">
  ${underline("60px")}
</div>

<div class="party-line2">
  Nga &nbsp;${birthPlaceVal}&nbsp; Komuna &nbsp;${underline("140px")}&nbsp; me Nr. Personal &nbsp;${personalVal}
</div>

<div class="neni">Neni 1.</div>
<div class="paragraph">Objekti i kësaj kontrate është : Aftësimi i Kandidatit/ës për marrjen e patentë-shoferit.</div>

<div class="neni">Neni 2.</div>
<div class="paragraph">Auto shkolla është e obliguar që kandidatin/ën të aftësoj sipas ligjit dhe udhëzimit administrative në fuqi.</div>

<div class="neni">Neni 3.</div>
<div class="paragraph">Ligjëruesi dhe shofer instruktori obligohen që të aftësojnë kandidatin/ën sipas ligjit dhe udhëzimit administrativ në fuqi .</div>

<div class="neni">Neni 4.</div>
<div class="paragraph">Kandidati/ja obligohet që të marrë pjesë në mësimet teorike dhe praktike sipas plan programit të paraparë në Auto shkollë.</div>

<div class="neni">Neni 5.</div>
<div class="paragraph">Auto shkolla obligohet që kandidatit/ës t'ia siguroj mjetin për provimin nga pjesa praktike vetëm nëse është e nevojshme .</div>

<div class="neni">Neni 6.</div>
<div class="paragraph">Çmimi për orët mësimore nga lëndët e caktuara për kategorinë &nbsp;${categoryVal}&nbsp; është &nbsp;${priceVal}&nbsp; euro.</div>

<div class="neni">Neni 7</div>
<div class="paragraph">Kohë zgjatja e Aftësimit përbëhet nga pjesa Teorike prej${underline("50px")}orëve dhe pjesa praktike prej${underline("50px")}orëve</div>

<div class="neni">Neni 8.</div>
<div class="paragraph">Pagesa për aftësimin e kandidatit/ës do të bëhet neper mjet gjiro llogarisë së Auto shkollës ose në kesh.</div>

<div class="neni">Neni 9.</div>
<div class="paragraph">Kandidati duhet ti përfundoj orët brenda një viti nga data e regjistrimit,</div>

<div class="neni">Neni 10.</div>
<div class="paragraph">Nëse ka kalua periudha prej një viti kandidati duhet të bëhet një marrëveshje tjetër me çmimin aktual të regjistrimit.</div>

<div class="neni">Neni 11.</div>
<div class="paragraph">Për mos përmbushjen e kushteve dhe obligimeve kontraktuese nga ana e ndonjërës prej palëve kontraktuese në këtë kontratë kompetente është Gjykata Komunale në &nbsp;<strong>PODUJEVË</strong>.</div>

<div class="signatures">
  <div class="sig-title">KONTRAKTUESIT :</div>
  <div class="sig-row">
    <div class="sig-left">
      Kandidati/ja<br/>
      <span class="sig-line"></span>
    </div>
    <div class="sig-right">
      Auto Shkolla " VISI "<br/>
      <span class="sig-line"></span>
    </div>
  </div>
</div>

</div>

<div class="page2">
  Data : &nbsp;${regDateVal}
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {candidate
                    ? `${candidate.emri} ${candidate.mbiemri} - ${candidate.numriRegjistrimit}`
                    : "Zgjedh kandidatin..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Shkruani emrin për të kërkuar..." />
                  <CommandList>
                    <CommandEmpty>Nuk u gjet asnjë kandidat.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.emri} ${c.mbiemri} ${c.numriRegjistrimit}`}
                          onSelect={() => {
                            setSelectedId(c.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.numriRegjistrimit} - {c.emri} {c.mbiemri}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {candidate && (
            <>
              <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
                <p><span className="text-muted-foreground">Emri:</span> <strong>{candidate.emri} {candidate.mbiemri}</strong></p>
                <p><span className="text-muted-foreground">Nr. Personal:</span> <strong>{candidate.numriPersonal}</strong></p>
                <p><span className="text-muted-foreground">Vendlindja:</span> <strong>{candidate.vendlindja}</strong></p>
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
