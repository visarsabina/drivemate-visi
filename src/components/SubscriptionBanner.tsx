import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sub {
  subscription_status: "trial" | "active" | "expired" | "cancelled";
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  monthly_fee: number;
  days_remaining: number | null;
  is_expired: boolean;
}

const SubscriptionBanner = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_my_tenant_subscription");
      if (data) setSub(data as unknown as Sub);
    })();
  }, [user]);

  if (!sub || dismissed) return null;

  const days = sub.days_remaining;
  const isTrial = sub.subscription_status === "trial";
  const isActive = sub.subscription_status === "active";
  const expired = sub.is_expired;

  // Hide if active and >7 days remaining
  if (isActive && !expired && (days === null || days > 7)) return null;
  if (isTrial && days !== null && days > 7 && !expired) return null;

  let tone: "amber" | "red" | "blue" = "blue";
  let Icon = Clock;
  let title = "";
  let message = "";

  if (expired) {
    tone = "red";
    Icon = AlertTriangle;
    title = "Abonimi ka skaduar";
    message = isTrial
      ? "Periudha e provës ka skaduar. Kontakto super-admin për të aktivizuar abonimin mujor."
      : "Abonimi yt ka skaduar. Kontakto super-admin për ta vazhduar.";
  } else if (isTrial) {
    tone = days !== null && days <= 3 ? "red" : "amber";
    Icon = Clock;
    title = `Periudha e provës — ${days} ditë të mbetura`;
    message = `Abonimi mujor është ${sub.monthly_fee}€. Kontakto super-admin për të vazhduar.`;
  } else if (isActive && days !== null && days <= 7) {
    tone = "amber";
    Icon = CheckCircle2;
    title = `Abonimi skadon për ${days} ditë`;
    message = `Kontakto super-admin për ta rinovuar abonimin (${sub.monthly_fee}€/muaj).`;
  }

  const toneCls = {
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
    red: "bg-destructive/10 border-destructive/30 text-destructive",
    blue: "bg-primary/10 border-primary/30 text-primary",
  }[tone];

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${toneCls}`}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-90 mt-0.5">{message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SubscriptionBanner;
