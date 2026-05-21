import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Candidate, CandidateStatus } from "@/types/candidate";
import { toast } from "sonner";
import { parsePersonalNumber } from "@/lib/personalNumber";

interface AddCandidateFormProps {
  onAdd: (candidate: Candidate) => void;
  candidateCount: number;
}

const generateRegNumber = (count: number) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = String(count + 1).padStart(2, "0");
  return `${num}/${year}`;
};

const AddCandidateForm = ({ onAdd, candidateCount }: AddCandidateFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultPriceFor = (kategoria: string) => (kategoria === "C" ? "250" : "");
  const [form, setForm] = useState({
    numriRegjistrimit: generateRegNumber(candidateCount),
    numriPersonal: "",
    emri: "",
    mbiemri: "",
    emriBabait: "",
    vendlindja: "",
    telefon: "",
    dataLindjes: "",
    kategoria: "B",
    certifikataShendetsore: "",
    vendi: "",
    dataRegjistrimit: new Date().toISOString().split("T")[0],
    shenimet: "",
    shumaMarreveshjes: "",
    totalLessons: "20",
  });

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      const dataRows = rows.filter((r, i) => {
        if (!r || r.length === 0) return false;
        if (i === 0) {
          const first = String(r[0] ?? "").toLowerCase();
          if (first.includes("nr") || first.includes("reg")) return false;
        }
        return r.some((c) => String(c ?? "").trim() !== "");
      });

      if (dataRows.length === 0) {
        toast.error("Fajlli është bosh ose pa të dhëna të vlefshme");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      let added = 0;
      let skipped = 0;

      dataRows.forEach((row, idx) => {
        const numriRegjistrimit = String(row[0] ?? "").trim();
        let kategoria = String(row[1] ?? "B").trim().toUpperCase() || "B";
        if (["BC1", "BC2", "BC3"].includes(kategoria)) kategoria = "C1";
        const emri = String(row[2] ?? "").trim();
        const emriBabait = String(row[3] ?? "").trim();
        const mbiemri = String(row[4] ?? "").trim();
        const dataRegjistrimit = today;

        if (!emri || !mbiemri) {
          skipped++;
          return;
        }

        const newCandidate: Candidate = {
          id: `${Date.now()}-${idx}`,
          numriRegjistrimit: numriRegjistrimit || generateRegNumber(candidateCount + added),
          numriPersonal: "",
          emri,
          mbiemri,
          emriBabait,
          vendlindja: "",
          telefon: "",
          dataLindjes: "",
          kategoria,
          certifikataShendetsore: "",
          vendi: "",
          statusi: "regjistuar" as CandidateStatus,
          dataRegjistrimit,
          shenimet: "Importuar nga Excel",
          shumaMarreveshjes: kategoria === "C" ? 250 : 0,
          payments: [],
        };

        onAdd(newCandidate);
        added++;
      });

      toast.success(`U importuan ${added} kandidatë${skipped > 0 ? ` (${skipped} u anashkaluan)` : ""}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast.error("Dështoi leximi i fajllit Excel");
    }
  };

  const personalNumberInfo = form.numriPersonal.length > 0 ? parsePersonalNumber(form.numriPersonal) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emri || !form.mbiemri || !form.telefon) {
      toast.error("Ju lutem plotësoni fushat e detyrueshme");
      return;
    }
    if (form.numriPersonal) {
      const info = parsePersonalNumber(form.numriPersonal);
      if (!info.valid) {
        toast.error(info.error || "Numri personal nuk është i vlefshëm");
        return;
      }
    }

    const normalizedKategoria = ["BC1", "BC2", "BC3"].includes(form.kategoria.toUpperCase())
      ? "C1"
      : form.kategoria;

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      ...form,
      kategoria: normalizedKategoria,
      statusi: "regjistuar" as CandidateStatus,
      shumaMarreveshjes: parseFloat(form.shumaMarreveshjes) || 0,
      totalLessons: parseInt(form.totalLessons, 10) || 20,
      payments: [],
    };

    onAdd(newCandidate);
    toast.success("Kandidati u shtua me sukses!");
    setForm({
      numriRegjistrimit: generateRegNumber(candidateCount + 1),
      numriPersonal: "",
      emri: "",
      mbiemri: "",
      emriBabait: "",
      vendlindja: "",
      telefon: "",
      dataLindjes: "",
      kategoria: "B",
      certifikataShendetsore: "",
      vendi: "",
      dataRegjistrimit: new Date().toISOString().split("T")[0],
      shenimet: "",
      shumaMarreveshjes: "",
      totalLessons: "20",
    });
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold">Shto Kandidat të Ri</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importo nga Excel
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Formati i Excel: <strong>Nr.Regj | Kategoria | Emri | Emri i Babait | Mbiemri</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numriRegjistrimit">Numri i Regjistrimit</Label>
            <Input id="numriRegjistrimit" value={form.numriRegjistrimit} readOnly className="bg-muted cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numriPersonal">Numri Personal * (10 shifra)</Label>
            <Input
              id="numriPersonal"
              value={form.numriPersonal}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm({ ...form, numriPersonal: digits });
              }}
              maxLength={10}
              inputMode="numeric"
              pattern="\d{10}"
              placeholder="10 shifra"
              className={
                personalNumberInfo && form.numriPersonal.length === 10
                  ? personalNumberInfo.valid
                    ? "border-green-500 focus-visible:ring-green-500"
                    : "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {personalNumberInfo && form.numriPersonal.length === 10 && (
              <p className={`text-xs flex items-center gap-1 ${personalNumberInfo.valid ? "text-green-600" : "text-destructive"}`}>
                {personalNumberInfo.valid ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Numri personal është i vlefshëm
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    {personalNumberInfo.error}
                  </>
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emri">Emri *</Label>
            <Input id="emri" value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} placeholder="Emri" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mbiemri">Mbiemri *</Label>
            <Input id="mbiemri" value={form.mbiemri} onChange={(e) => setForm({ ...form, mbiemri: e.target.value })} placeholder="Mbiemri" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emriBabait">Emri i Babait</Label>
            <Input id="emriBabait" value={form.emriBabait} onChange={(e) => setForm({ ...form, emriBabait: e.target.value })} placeholder="Emri i babait" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendlindja">Vendlindja</Label>
            <Input id="vendlindja" value={form.vendlindja} onChange={(e) => setForm({ ...form, vendlindja: e.target.value })} placeholder="Vendi i lindjes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon *</Label>
            <Input id="telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="+383 4X XXX XXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataLindjes">Data e Lindjes</Label>
            <Input id="dataLindjes" type="date" value={form.dataLindjes} onChange={(e) => setForm({ ...form, dataLindjes: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kategoria">Kategoria</Label>
            <Select value={form.kategoria} onValueChange={(v) => setForm({ ...form, kategoria: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B">B - Veturë</SelectItem>
                <SelectItem value="BE">BE - Veturë me rimorkio</SelectItem>
                <SelectItem value="C1">C1 - Kamion i vogël</SelectItem>
                <SelectItem value="C">C - Kamion</SelectItem>
                <SelectItem value="CE">CE - Kamion me rimorkio</SelectItem>
                <SelectItem value="D">D - Autobus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shumaMarreveshjes">Shuma e Marrëveshjes (€)</Label>
            <Input id="shumaMarreveshjes" type="number" value={form.shumaMarreveshjes} onChange={(e) => setForm({ ...form, shumaMarreveshjes: e.target.value })} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalLessons">Numri i Orëve të Vozitjes</Label>
            <Select value={form.totalLessons} onValueChange={(v) => setForm({ ...form, totalLessons: v })}>
              <SelectTrigger id="totalLessons">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 orë</SelectItem>
                <SelectItem value="5">5 orë</SelectItem>
                <SelectItem value="10">10 orë</SelectItem>
                <SelectItem value="15">15 orë</SelectItem>
                <SelectItem value="20">20 orë (default)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="certifikataShendetsore">Çertifikata Shëndetësore (Nr.Data)</Label>
            <Input id="certifikataShendetsore" value={form.certifikataShendetsore} onChange={(e) => setForm({ ...form, certifikataShendetsore: e.target.value })} placeholder="12345.15.03.2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendi">Vendi</Label>
            <Input id="vendi" value={form.vendi} onChange={(e) => setForm({ ...form, vendi: e.target.value })} placeholder="Prishtinë" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataRegjistrimit">Data e Regjistrimit</Label>
            <Input id="dataRegjistrimit" type="date" value={form.dataRegjistrimit} onChange={(e) => setForm({ ...form, dataRegjistrimit: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shenimet">Shënime</Label>
          <Textarea id="shenimet" value={form.shenimet} onChange={(e) => setForm({ ...form, shenimet: e.target.value })} placeholder="Shënime shtesë..." />
        </div>
        <Button type="submit" className="w-full sm:w-auto">Shto Kandidatin</Button>
      </form>
    </div>
  );
};

export default AddCandidateForm;
