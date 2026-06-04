import { useState } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, FileCheck, FileText, FileSignature, ArrowLeft, Printer, CreditCard, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import CandidateBooklet from "@/components/CandidateBooklet";
import CandidateVertetimi from "@/components/CandidateVertetimi";
import CandidateKontrata from "@/components/CandidateKontrata";
import CandidateFletparaqitja from "@/components/CandidateFletparaqitja";
import LessonsManager from "@/components/LessonsManager";
import CandidateAccountDialog from "@/components/CandidateAccountDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { parsePersonalNumber } from "@/lib/personalNumber";
import { z } from "zod";
import { escapeHtmlObject, escapeHtml as __esc } from "@/lib/escapeHtml";

const editCandidateSchema = z.object({
  emri: z.string().trim().min(1, "Emri është i detyrueshëm").max(100, "Emri max 100 karaktere"),
  mbiemri: z.string().trim().min(1, "Mbiemri është i detyrueshëm").max(100, "Mbiemri max 100 karaktere"),
  emriBabait: z.string().trim().max(100, "Max 100 karaktere").optional().or(z.literal("")),
  vendlindja: z.string().trim().max(100, "Max 100 karaktere").optional().or(z.literal("")),
  vendi: z.string().trim().max(100, "Max 100 karaktere").optional().or(z.literal("")),
  shenimet: z.string().trim().max(500, "Shënimet max 500 karaktere").optional().or(z.literal("")),
  certifikataShendetsore: z.string().trim().max(100, "Max 100 karaktere").optional().or(z.literal("")),
  numriRegjistrimit: z.string().trim().min(1, "Nr. regjistrimit i detyrueshëm").max(20, "Max 20 karaktere"),
  numriPersonal: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{10}$/.test(v), "Numri personal duhet të jetë saktësisht 10 shifra"),
  telefon: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9+\s-]{6,20}$/.test(v), "Telefoni duhet të përmbajë vetëm numra (6-20 shifra)"),
  dataLindjes: z.string().refine((v) => v === "" || !isNaN(Date.parse(v)), "Data e lindjes nuk është valide"),
  dataRegjistrimit: z.string().refine((v) => v === "" || !isNaN(Date.parse(v)), "Data e regjistrimit nuk është valide"),
  kategoria: z.string().min(1, "Kategoria është e detyrueshme"),
  shumaMarreveshjes: z
    .number({ invalid_type_error: "Shuma duhet të jetë numër" })
    .min(0, "Shuma nuk mund të jetë negative")
    .max(100000, "Shuma është shumë e madhe"),
});

const printFletepagesa = (candidateRaw: Candidate, numriPageses?: string) => {
  const candidate = escapeHtmlObject(candidateRaw);
  const totalPaguar = candidateRaw.payments.reduce((sum, p) => sum + p.shuma, 0);
  const borxhi = candidateRaw.shumaMarreveshjes - totalPaguar;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const copyHtml = `
    <div class="copy">
      <h2>FLETËPAGESA</h2>
      ${numriPageses ? `<p class="nr"><strong>Nr. Pagesës:</strong> ${__esc(numriPageses)}</p>` : ""}
      <table><tr><th>Emri</th><td>${candidate.emri}</td><th>Mbiemri</th><td>${candidate.mbiemri}</td></tr>
      <tr><th>Nr. Personal</th><td>${candidate.numriPersonal}</td><th>Nr. Regjistrimit</th><td>${candidate.numriRegjistrimit}</td></tr>
      <tr><th>Kategoria</th><td>${candidate.kategoria}</td><th>Data</th><td>${(() => { const n = new Date(); return `${String(n.getDate()).padStart(2,"0")}.${String(n.getMonth()+1).padStart(2,"0")}.${n.getFullYear()}`; })()}</td></tr></table>
      <div class="summary">
        <div><strong>Shuma e Marrëveshjes:</strong> ${candidateRaw.shumaMarreveshjes.toFixed(2)} €</div>
        <div><strong>Totali i Paguar:</strong> ${totalPaguar.toFixed(2)} €</div>
        <div><strong>Borxhi:</strong> ${borxhi.toFixed(2)} €</div>
      </div>
      ${candidate.payments.length > 0 ? `<h3>Historiku i Pagesave</h3><table><thead><tr><th>Nr.</th><th>Data</th><th>Shuma</th></tr></thead><tbody>${candidate.payments.map((p, i) => `<tr><td>${i + 1}</td><td>${p.data}</td><td>${candidateRaw.payments[i].shuma.toFixed(2)} €</td></tr>`).join("")}</tbody></table>` : ""}
    </div>`;

  printWindow.document.write(`<!DOCTYPE html><html><head><title>Fletëpagesa</title>
    <style>
      @page{size:A4 portrait;margin:0}
      *{box-sizing:border-box}
      body{font-family:Arial;margin:0;padding:0;font-size:12px}
      .page{width:210mm;height:297mm;display:flex;flex-direction:column;padding:8mm 12mm}
      .copy{flex:1;display:flex;flex-direction:column;padding:4mm 0;overflow:hidden}
      .copy + .copy{border-top:2px dashed #555;margin-top:2mm;padding-top:4mm}
      h2{text-align:center;margin:0 0 8px;font-size:16px}
      h3{margin:8px 0 4px;font-size:13px}
      .nr{text-align:right;font-size:11px;margin:0 0 6px}
      table{width:100%;border-collapse:collapse;margin:4px 0}
      th,td{border:1px solid #333;padding:4px 6px;text-align:left;font-size:11px}
      th{background:#f0f0f0}
      .summary{margin-top:6px;font-size:12px}
      .summary div{margin:2px 0}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="page">
      ${copyHtml}
      ${copyHtml}
    </div>
    <script>window.print();<\/script></body></html>`);
  printWindow.document.close();
};

interface CandidateDetailProps {
  candidate: Candidate;
  onBack: () => void;
  onVertetimiPrinted?: (candidateId: string) => void;
  onUpdate?: (candidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
  onGoToPayments?: (candidateId: string) => void;
  autoEdit?: boolean;
}

const CandidateDetail = ({ candidate, onBack, onVertetimiPrinted, onUpdate, onDelete, onGoToPayments, autoEdit }: CandidateDetailProps) => {
  const { isAdmin } = useAuth();
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [numriPageses, setNumriPageses] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<Candidate>(candidate);

  useEffect(() => {
    if (autoEdit) {
      setEditForm(candidate);
      setShowEditDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEdit, candidate.id]);

  const openEditDialog = () => {
    setEditForm(candidate);
    setShowEditDialog(true);
  };


  const handleSaveEdit = () => {
    const result = editCandidateSchema.safeParse({
      emri: editForm.emri,
      mbiemri: editForm.mbiemri,
      emriBabait: editForm.emriBabait ?? "",
      vendlindja: editForm.vendlindja ?? "",
      vendi: editForm.vendi ?? "",
      shenimet: editForm.shenimet ?? "",
      certifikataShendetsore: editForm.certifikataShendetsore ?? "",
      numriRegjistrimit: editForm.numriRegjistrimit,
      numriPersonal: editForm.numriPersonal ?? "",
      telefon: editForm.telefon ?? "",
      dataLindjes: editForm.dataLindjes ?? "",
      dataRegjistrimit: editForm.dataRegjistrimit ?? "",
      kategoria: editForm.kategoria,
      shumaMarreveshjes: editForm.shumaMarreveshjes,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({ title: "Validim i dështuar", description: firstError.message, variant: "destructive" });
      return;
    }

    // Extra check using existing personal-number helper for consistency
    if (editForm.numriPersonal) {
      const pn = parsePersonalNumber(editForm.numriPersonal);
      if (!pn.valid) {
        toast({ title: "Numri personal jo valid", description: pn.error ?? "I pavlefshëm", variant: "destructive" });
        return;
      }
    }

    onUpdate?.(editForm);
    setShowEditDialog(false);
    toast({ title: "U ruajt", description: "Të dhënat e kandidatit u përditësuan" });
  };
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
        <CandidateVertetimi candidates={[candidate]} preselectedId={candidate.id} onPrinted={onVertetimiPrinted} />
      </div>
    );
  }

  if (activeDoc === "kontrata") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveDoc(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek paneli
        </Button>
        <CandidateKontrata candidates={[candidate]} preselectedId={candidate.id} />
      </div>
    );
  }

  if (activeDoc === "fletparaqitja") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveDoc(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek paneli
        </Button>
        <CandidateFletparaqitja candidates={[candidate]} preselectedId={candidate.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu tek lista
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditDialog} className="gap-2">
            <Pencil className="w-4 h-4" /> Modifiko
          </Button>
          {isAdmin && <CandidateAccountDialog candidate={candidate} />}
          {isAdmin && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" /> Fshij
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Fshij kandidatin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Je i sigurt që dëshiron të fshish <strong>{candidate.emri} {candidate.mbiemri}</strong>? Ky veprim do të fshijë edhe të gjitha pagesat e kandidatit dhe nuk mund të kthehet mbrapa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulo</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(candidate.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Fshij
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{candidate.emri} {candidate.mbiemri}</h2>
            <p className="text-muted-foreground">Nr. Regjistrimit: {candidate.numriRegjistrimit}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${candidate.vertetimiPrintuar ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {candidate.vertetimiPrintuar ? "Vërtetim ✓" : "Vërtetim ✗"}
            </span>
            <StatusBadge status={candidate.statusi} />
          </div>
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
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={() => setShowPaymentDialog(true)}>
                <Printer className="w-3.5 h-3.5" /> Printo
              </Button>
            )}
          </div>
          <div><span className="text-muted-foreground">Orë vozitjeje:</span> <strong>{candidate.totalLessons ?? 20}</strong></div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Orët e Vozitjes</h3>
        <LessonsManager
          candidateId={candidate.id}
          candidateName={`${candidate.emri} ${candidate.mbiemri}`}
          totalLessons={candidate.totalLessons ?? 20}
        />
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Historiku i Pagesave</h3>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onGoToPayments?.(candidate.id)}>
            <CreditCard className="w-4 h-4" /> Pagesa
          </Button>
        </div>
        {candidate.payments.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">
            Nuk ka pagesa të regjistruara. Kliko butonin "Pagesa" për të shtuar një pagesë.
          </div>
        ) : (<>

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
        </>)}
      </div>


      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Printo Fletëpagesën</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Numri i Pagesës</Label>
              <Input
                value={numriPageses}
                onChange={(e) => setNumriPageses(e.target.value)}
                placeholder="Shkruaj numrin e pagesës..."
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Kandidati: <strong>{candidate.emri} {candidate.mbiemri}</strong></p>
              <p>Borxhi: <strong className={borxhi > 0 ? "text-destructive" : "text-primary"}>{borxhi.toFixed(2)} €</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Anulo</Button>
            <Button className="gap-2" onClick={() => {
              printFletepagesa(candidate, numriPageses);
              setShowPaymentDialog(false);
              setNumriPageses("");
            }}>
              <Printer className="w-4 h-4" /> Printo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifiko Kandidatin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Nr. Regjistrimit</Label>
              <Input value={editForm.numriRegjistrimit} onChange={(e) => setEditForm({ ...editForm, numriRegjistrimit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nr. Personal</Label>
              <Input value={editForm.numriPersonal} onChange={(e) => setEditForm({ ...editForm, numriPersonal: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} inputMode="numeric" placeholder="10 shifra" />
            </div>
            <div className="space-y-2">
              <Label>Emri *</Label>
              <Input value={editForm.emri} onChange={(e) => setEditForm({ ...editForm, emri: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mbiemri *</Label>
              <Input value={editForm.mbiemri} onChange={(e) => setEditForm({ ...editForm, mbiemri: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Emri i Babait</Label>
              <Input value={editForm.emriBabait} onChange={(e) => setEditForm({ ...editForm, emriBabait: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vendlindja</Label>
              <Input value={editForm.vendlindja} onChange={(e) => setEditForm({ ...editForm, vendlindja: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefoni</Label>
              <Input value={editForm.telefon} onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20) })} inputMode="tel" maxLength={20} placeholder="Vetëm numra" />
            </div>
            <div className="space-y-2">
              <Label>Data e Lindjes</Label>
              <Input type="date" value={editForm.dataLindjes} onChange={(e) => setEditForm({ ...editForm, dataLindjes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={editForm.kategoria} onValueChange={(v) => setEditForm({ ...editForm, kategoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="D1">D1</SelectItem>
                  <SelectItem value="BE">BE</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Çertifikata Shëndetësore</Label>
              <Input value={editForm.certifikataShendetsore} onChange={(e) => setEditForm({ ...editForm, certifikataShendetsore: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Vendi</Label>
              <Input value={editForm.vendi} onChange={(e) => setEditForm({ ...editForm, vendi: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data Regjistrimit</Label>
              <Input type="date" value={editForm.dataRegjistrimit} onChange={(e) => setEditForm({ ...editForm, dataRegjistrimit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Shuma e Marrëveshjes (€)</Label>
              <Input type="number" step="0.01" min={0} max={100000} value={editForm.shumaMarreveshjes} onChange={(e) => { const v = parseFloat(e.target.value); setEditForm({ ...editForm, shumaMarreveshjes: isNaN(v) ? 0 : Math.max(0, v) }); }} />
            </div>
            <div className="space-y-2">
              <Label>Numri i Orëve të Vozitjes</Label>
              <Select
                value={String(editForm.totalLessons ?? 20)}
                onValueChange={(v) => setEditForm({ ...editForm, totalLessons: parseInt(v, 10) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 orë</SelectItem>
                  <SelectItem value="5">5 orë</SelectItem>
                  <SelectItem value="10">10 orë</SelectItem>
                  <SelectItem value="15">15 orë</SelectItem>
                  <SelectItem value="20">20 orë</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Shënime</Label>
              <Input value={editForm.shenimet} onChange={(e) => setEditForm({ ...editForm, shenimet: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Anulo</Button>
            <Button onClick={handleSaveEdit}>Ruaj Ndryshimet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateDetail;