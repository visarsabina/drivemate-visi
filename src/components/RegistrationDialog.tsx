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
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
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

const CouponBox = ({ code }: { code: string }) => {
  const { toast } = useToast();
  return (
    <div className="mt-4 rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-500/5 p-3 text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
        Kodi i zbritjes 20%
      </div>
      <div className="mt-1 text-2xl font-bold tracking-widest text-emerald-700">{code}</div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          navigator.clipboard?.writeText(code);
          toast({ title: "Kodi u kopjua!", description: code });
        }}
      >
        <Copy className="mr-2 h-3.5 w-3.5" /> Kopjo kodin
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Prezantoje këtë kod në autoshkollë për të përfituar zbritjen.
      </p>
    </div>
  );
};

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  /** Optional tenant id override (e.g. when on /school/:slug). */
  tenantId?: string | null;
  /** Optional school name to show in the dialog title. */
  schoolName?: string;
  /** Optional promo message shown above the form (e.g. discount after passing the demo test). */
  promoNote?: string;
  /** Optional discount coupon code generated after finishing the public test. */
  couponCode?: string;
}

const RegistrationDialog = ({ open, onOpenChange, defaultCategory = "", tenantId: tenantIdProp, schoolName, promoNote, couponCode }: RegistrationDialogProps) => {
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
      notes: couponCode ? `Kupon zbritjeje 20%: ${couponCode}` : null,
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

    // Notify the school by email (best-effort — never blocks the user).
    supabase.functions
      .invoke("notify-new-registration", {
        body: { tenant_id: tenantId, email: result.data.email },
      })
      .catch((e) => console.error("notify-new-registration failed", e));




    setSubmitting(false);
    setSubmitted(true);
    toast({
      title: "Regjistrimi u dërgua!",
      description: "Do t'ju kontaktojmë së shpejti.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[92dvh] p-0 gap-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[92dvh] p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <DialogTitle className="text-lg mb-2">Faleminderit, {form.fullName.split(" ")[0]}!</DialogTitle>
              <DialogDescription className="text-sm">
                Regjistrimi juaj për kategorinë <strong>{form.category}</strong> u dërgua me sukses.
                Stafi ynë do t'ju kontaktojë në {form.phone} brenda 24 orëve.
              </DialogDescription>
              {couponCode && <CouponBox code={couponCode} />}
              <Button className="mt-4 w-full" onClick={() => handleClose(false)}>
                Mbyll
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-3">
                <DialogTitle className="text-lg leading-tight">Regjistrohu në {schoolName ?? "Autoshkollën Visi"}</DialogTitle>
                <DialogDescription className="text-xs">
                  Plotëso formularin dhe ne do t'ju kontaktojmë së shpejti.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                {promoNote && (
                  <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                    {promoNote}
                  </div>
                )}
                {couponCode && <CouponBox code={couponCode} />}
                {form.category === "B" && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                    <div className="font-semibold text-primary mb-0.5">🎉 Ofertë: 6 këste pa interes</div>
                    <div className="text-muted-foreground">
                      Kategoria B – 300€ total, vetëm <strong className="text-foreground">50€/muaj</strong> për 6 muaj.
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-xs">Emri dhe mbiemri *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="P.sh. Arben Krasniqi"
                    maxLength={100}
                    className="h-9 text-sm"
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Emaili *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    maxLength={255}
                    className="h-9 text-sm"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Numri i telefonit *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="044 123 456"
                    maxLength={20}
                    className="h-9 text-sm"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs">Kategoria *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger id="category" className="h-9 text-sm">
                      <SelectValue placeholder="Zgjidh kategorinë" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-sm">
                          Kategoria {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                </div>

                <DialogFooter className="gap-2 sm:gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting} className="h-9 text-sm flex-1">
                    Anulo
                  </Button>
                  <Button type="submit" disabled={submitting} className="h-9 text-sm flex-1">
                    {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    {submitting ? "Duke dërguar..." : "Dërgo"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationDialog;
