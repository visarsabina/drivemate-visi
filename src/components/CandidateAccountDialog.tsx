import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Candidate } from "@/types/candidate";

const CandidateAccountDialog = ({ candidate }: { candidate: Candidate }) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 6) {
      toast({ title: "Fjalëkalim i shkurtër", description: "Min 6 karaktere.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(candidate.numriPersonal || "")) {
      toast({ title: "Numri personal mungon", description: "Kandidati duhet të ketë numër personal 10-shifror.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-create-candidate-account", {
      body: { candidate_id: candidate.id, password },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Dështoi", description: (error?.message || (data as any)?.error) ?? "Gabim", variant: "destructive" });
      return;
    }
    toast({ title: "Llogaria u krijua", description: `Kandidati hyn me numrin personal ${candidate.numriPersonal}.` });
    setOpen(false);
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><KeyRound className="w-4 h-4" /> Llogaria e Kandidatit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Krijo / Rivendos Llogarinë</DialogTitle>
          <DialogDescription>
            Kandidati do të kyçet me <strong>numrin personal</strong> ({candidate.numriPersonal || "—"}) dhe fjalëkalimin e dhënë.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cpw">Fjalëkalimi (min 6)</Label>
          <Input id="cpw" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="P.sh. 123456" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ruaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateAccountDialog;
