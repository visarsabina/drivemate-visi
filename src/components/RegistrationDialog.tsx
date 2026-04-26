import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantByDomain } from "@/hooks/useTenant";

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Emri duhet të ketë së paku 2 karaktere")
    .max(100, "Emri është shumë i gjatë"),
  email: z
    .string()
    .trim()
    .email("Email-i nuk është i vlefshëm")
    .max(255, "Email-i është shumë i gjatë"),
  phone: z
    .string()
    .trim()
    .min(6, "Numri duhet të ketë së paku 6 shifra")
    .max(20, "Numri është shumë i gjatë")
    .regex(/^[0-9+\s()-]+$/, "Numri i telefonit nuk është i vlefshëm"),
  category: z.string().min(1, "Zgjidhni një kategori"),
});

const CATEGORIES = ["B", "BE", "C1", "C", "CE", "D"];

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  /** Optional tenant id override (e.g. when on /school/:slug). */
  tenantId?: string | null;
  /** Optional school name to show in the dialog title. */
  schoolName?: string;
}

const RegistrationDialog = ({ open, onOpenChange, defaultCategory = "", tenantId: tenantIdProp, schoolName }: RegistrationDialogProps) => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: defaultCategory,
  });

  // Sync category when dialog opens with new default
  if (open && defaultCategory && form.category !== defaultCategory && !submitted && !form.fullName) {
    setForm((f) => ({ ...f, category: defaultCategory }));
  }

  const reset = () => {
    setForm({ fullName: "", email: "", phone: "", category: "" });
    setErrors({});
    setSubmitted(false);
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTimeout(reset, 200);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const tenantId = tenantIdProp ?? (await resolveTenantByDomain());
    if (!tenantId) {
      setSubmitting(false);
      toast({
        title: "Gabim",
        description: "Autoshkolla nuk u gjet për këtë domain.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("registrations").insert({
      full_name: result.data.fullName,
      email: result.data.email,
      phone: result.data.phone,
      category: result.data.category,
      tenant_id: tenantId,
    });

    if (error) {
      setSubmitting(false);
      toast({
        title: "Gabim",
        description: "Regjistrimi nuk u dërgua. Provoni përsëri.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    toast({
      title: "Regjistrimi u dërgua!",
      description: "Do t'ju kontaktojmë së shpejti.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Faleminderit, {form.fullName.split(" ")[0]}!</DialogTitle>
            <DialogDescription>
              Regjistrimi juaj për kategorinë <strong>{form.category}</strong> u dërgua me sukses.
              Stafi ynë do t'ju kontaktojë në {form.phone} brenda 24 orëve.
            </DialogDescription>
            <Button className="mt-6 w-full" onClick={() => handleClose(false)}>
              Mbyll
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Regjistrohu në Autoshkollën Visi</DialogTitle>
              <DialogDescription>
                Plotëso formularin dhe ne do t'ju kontaktojmë së shpejti.
              </DialogDescription>
            </DialogHeader>
            {form.category === "B" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="font-semibold text-primary mb-1">🎉 Ofertë: 6 këste pa interes</div>
                <div className="text-muted-foreground">
                  Kategoria B – 250€ total, vetëm <strong className="text-foreground">42€/muaj</strong> për 6 muaj.
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Emri dhe mbiemri *</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="P.sh. Arben Krasniqi"
                  maxLength={100}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Emaili *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  maxLength={255}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numri i telefonit *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="044 123 456"
                  maxLength={20}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategoria *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Zgjidh kategorinë" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        Kategoria {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
                  Anulo
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? "Duke dërguar..." : "Dërgo Regjistrimin"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationDialog;
