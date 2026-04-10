import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Candidate, CandidateStatus } from "@/types/candidate";
import { toast } from "sonner";

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
  const [form, setForm] = useState({
    numriRegjistrimit: generateRegNumber(candidateCount),
    numriPersonal: "",
    emri: "",
    mbiemri: "",
    telefon: "",
    dataLindjes: "",
    kategoria: "B",
    certifikataShendetsore: "",
    vendi: "",
    dataRegjistrimit: new Date().toISOString().split("T")[0],
    shenimet: "",
    shumaMarreveshjes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emri || !form.mbiemri || !form.telefon) {
      toast.error("Ju lutem plotësoni fushat e detyrueshme");
      return;
    }

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      ...form,
      statusi: "regjistuar" as CandidateStatus,
      shumaMarreveshjes: parseFloat(form.shumaMarreveshjes) || 0,
      payments: [],
    };

    onAdd(newCandidate);
    toast.success("Kandidati u shtua me sukses!");
    setForm({
      numriRegjistrimit: generateRegNumber(candidateCount + 1),
      numriPersonal: "",
      emri: "",
      mbiemri: "",
      telefon: "",
      dataLindjes: "",
      kategoria: "B",
      certifikataShendetsore: "",
      vendi: "",
      dataRegjistrimit: new Date().toISOString().split("T")[0],
      shenimet: "",
      shumaMarreveshjes: "",
    });
  };

  return (
    <div className="glass-card rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Shto Kandidat të Ri</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numriRegjistrimit">Numri i Regjistrimit</Label>
            <Input id="numriRegjistrimit" value={form.numriRegjistrimit} readOnly className="bg-muted cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numriPersonal">Numri Personal *</Label>
            <Input id="numriPersonal" value={form.numriPersonal} onChange={(e) => setForm({ ...form, numriPersonal: e.target.value })} placeholder="Numri personal" />
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
                <SelectItem value="A">A - Motoçikletë</SelectItem>
                <SelectItem value="B">B - Veturë</SelectItem>
                <SelectItem value="C">C - Kamion</SelectItem>
                <SelectItem value="D">D - Autobus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shumaMarreveshjes">Shuma e Marrëveshjes (€)</Label>
            <Input id="shumaMarreveshjes" type="number" value={form.shumaMarreveshjes} onChange={(e) => setForm({ ...form, shumaMarreveshjes: e.target.value })} placeholder="0.00" />
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
