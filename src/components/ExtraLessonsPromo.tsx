import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Sparkles, Car, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantByDomain } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Emri duhet të ketë së paku 2 karaktere")
    .max(100, "Emri është shumë i gjatë"),
  phone: z
    .string()
    .trim()
    .min(6, "Numri duhet të ketë së paku 6 shifra")
    .max(20, "Numri është shumë i gjatë")
    .regex(/^[0-9+\s()-]+$/, "Numri i telefonit nuk është i vlefshëm"),
  vehicle: z.enum(["Manual", "Automatik"], {
    errorMap: () => ({ message: "Zgjidh llojin e veturës" }),
  }),
});

interface Props {
  tenantId?: string | null;
  schoolName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoOpen?: boolean;
}

const STORAGE_KEY = "extra-lessons-promo-seen";

const ExtraLessonsPromo = ({ tenantId: tenantIdProp, schoolName, open: openProp, onOpenChange, autoOpen = true }: Props) => {
  const { toast } = useToast();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setOpenInternal(v);
  };
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<{ fullName: string; phone: string; vehicle: "" | "Manual" | "Automatik" }>({
    fullName: "",
    phone: "",
    vehicle: "",
  });

  useEffect(() => {
    if (!autoOpen || openProp !== undefined) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => {
      setOpenInternal(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 1500);
    return () => clearTimeout(t);
  }, [autoOpen, openProp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (!fe[k]) fe[k] = i.message;
      });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const tenantId = tenantIdProp ?? (await resolveTenantByDomain());
    if (!tenantId) {
      setSubmitting(false);
      toast({ title: "Gabim", description: "Autoshkolla nuk u gjet.", variant: "destructive" });
      return;
    }

    const category = result.data.vehicle === "Manual" ? "OP-Manual" : "OP-Auto";
    const placeholderEmail = `ore-plotesuese+${Date.now()}@noemail.local`;

    const { error } = await supabase.from("registrations").insert({
      full_name: result.data.fullName,
      email: placeholderEmail,
      phone: result.data.phone,
      category,
      tenant_id: tenantId,
      notes: `Kërkesë për ORË PLOTËSUESE — Veturë: ${result.data.vehicle}`,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Gabim", description: "Kërkesa nuk u dërgua. Provoni përsëri.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Kërkesa u dërgua!", description: "Do t'ju kontaktojmë së shpejti." });
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setForm({ fullName: "", phone: "", vehicle: "" });
      setErrors({});
      setSubmitted(false);
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {submitted ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Faleminderit, {form.fullName.split(" ")[0]}!</DialogTitle>
            <DialogDescription>
              Kërkesa juaj për orë plotësuese ({form.vehicle}) u pranua. Stafi ynë do t'ju kontaktojë në {form.phone} së shpejti.
            </DialogDescription>
            <Button className="mt-6 w-full" onClick={close}>Mbyll</Button>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> OFERTË E RE
              </div>
              <h2 className="text-2xl font-bold leading-tight">Orë Plotësuese të Vozitjes</h2>
              <p className="text-sm text-primary-foreground/90 mt-2">
                Ke nevojë për më shumë orë praktike? Rezervo terminin tënd dhe zgjidh veturën që dëshiron.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ep-name">Emri dhe mbiemri *</Label>
                <Input
                  id="ep-name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="P.sh. Arben Krasniqi"
                  maxLength={100}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-phone">Numri i telefonit *</Label>
                <Input
                  id="ep-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="044 123 456"
                  maxLength={20}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label>Lloji i veturës *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Manual", "Automatik"] as const).map((v) => {
                    const active = form.vehicle === v;
                    const Icon = v === "Manual" ? Settings2 : Car;
                    return (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setForm({ ...form, vehicle: v })}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-lg border-2 py-3 text-sm font-medium transition-all",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {v}
                      </button>
                    );
                  })}
                </div>
                {errors.vehicle && <p className="text-sm text-destructive">{errors.vehicle}</p>}
              </div>
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={close} disabled={submitting}>
                  Më vonë
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? "Duke dërguar..." : "Rezervo terminin"}
                </Button>
              </DialogFooter>
              <p className="text-xs text-muted-foreground text-center">
                {schoolName ?? "Autoshkolla"} do t'ju kontaktojë brenda 24 orëve.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExtraLessonsPromo;
