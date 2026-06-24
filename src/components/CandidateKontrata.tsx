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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Kontrata - ${safe.emri} ${safe.mbiemri}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; line-height: 1.7; }
  body { padding: 0; }
  .page { width: 100%; min-height: 261mm; display: flex; flex-direction: column; }
  .title { text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 18px; }
  .u { border-bottom: 1px solid #000; display: inline-block; min-width: 90px; padding-bottom: 1px; }
  .u-long { border-bottom: 1px solid #000; display: inline-block; min-width: 190px; padding-bottom: 1px; }
  .section-num { text-align: center; font-weight: bold; text-decoration: underline; margin: 10px 0 4px; }
  .paragraph { margin-bottom: 6px; text-align: justify; }
  .signatures { margin-top: auto; padding-top: 30px; }
  .sig-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .sig-left { width: 45%; }
  .sig-right { width: 45%; text-align: right; }
  .sig-line { border-bottom: 1px solid #000; display: inline-block; min-width: 180px; margin-top: 28px; }
  .center-text { text-align: center; margin-top: 10px; }
  .date-line { margin-top: 16px; }
  b, strong { font-weight: bold; }
</style></head><body>
<div class="page">

<div class="title">KONTRATË:</div>
<div class="subtitle">PËR AFTËSIMIN E KANDIDATËVE PËR PATENT SHOFER</div>

<div class="paragraph">
  E lidhur në <strong>Podujevë</strong> në mes të palëve kontraktuese si vijon:
</div>

<div class="paragraph">
  1. Autoshkolla &nbsp;<strong>"VISI"</strong>&nbsp; nga &nbsp;<strong><u>PODUJEVA</u></strong>&nbsp; në njërën anë;
</div>

<div class="paragraph">
  2. Kandidati/ja <span class="u-long"><strong>${safe.emri} ${safe.mbiemri}</strong></span> nga <span class="u"><strong>${safe.vendi || ""}</strong></span> K.K <span class="u"><strong>${safe.vendi || ""}</strong></span>.
</div>

<div class="section-num">1.</div>
<div class="paragraph">Objekti i kësaj kontrate është: Aftësimi i kandidatit/es për marrjen e patent shoferit.</div>

<div class="section-num">2.</div>
<div class="paragraph">Autoshkolla është e obliguar që kandidatin/en ta aftësojë sipas ligjit dhe udhëzimit administrativ në fuqi.</div>

<div class="section-num">3.</div>
<div class="paragraph">Ligjëruesi dhe shofer-instruktori obligohen që ta aftësojnë kandidatin/en sipas ligjit dhe udhëzimit administrativ në fuqi.</div>

<div class="section-num">4.</div>
<div class="paragraph">Kandidati/ja obligohet që të marrë pjesë në mësimet teorike dhe praktike sipas planprogramit të paraparë në Autoshkollë.</div>

<div class="section-num">5.</div>
<div class="paragraph">Autoshkolla obligohet që kandidatit/es t'ia sigurojë mjetin për provimin nga pjesa praktike vetëm nëse është e nevojshme.</div>

<div class="section-num">6.</div>
<div class="paragraph">Çmimi për orët mësimore nga lëndët e caktuara është <span class="u"><strong>${safe.shumaMarreveshjes.toFixed(2)}</strong></span> euro.</div>
<div class="paragraph">Kohëzgjatja e aftësimit përbëhet nga pjesa teorike prej <strong>20</strong> orëve dhe pjesa praktike prej <strong>20</strong> orëve.</div>
<div class="paragraph">Pagesa për aftësimin e kandidatit/es do të bëhet në zyrën e Autoshkollës "VISI" në shumën <span class="u"><strong>${safe.shumaMarreveshjes.toFixed(2)} €</strong></span> përmes arkës fiskale.</div>
<div class="paragraph">Për mospërmbushjen e kushteve dhe obligimeve kontraktuese nga ana e ndonjërës prej palëve kontraktuese në këtë kontratë, kompetente është Gjykata Komunale në &nbsp;<strong><u>PODUJEVË</u></strong>.</div>

<div class="signatures">
  <div class="center-text" style="text-decoration:underline; font-weight:bold; margin-bottom: 14px;">KONTRAKTUESIT:</div>
  <div class="sig-row">
    <div class="sig-left">
      Kandidati/ja<br/>
      <span class="sig-line"></span>
    </div>
    <div class="sig-right">
      Drejtori: &nbsp;<strong><u>Fadil Jaha</u></strong><br/>
      <span class="sig-line"></span>
    </div>
  </div>
  <div class="center-text">Auto Shkolla "VISI"</div>
  <div class="date-line">
    Më datën: <span class="u"><strong>${formatDate(safe.dataRegjistrimit)}</strong></span>
  </div>
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
