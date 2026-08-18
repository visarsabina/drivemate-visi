import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle2, AlertCircle } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setState("invalid");
        else if (data?.already_unsubscribed || data?.used) setState("already");
        else setState("valid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setBusy(false);
    setState(error ? "error" : "done");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        {state === "done" || state === "already" ? (
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
        ) : state === "invalid" || state === "error" ? (
          <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
        ) : (
          <MailX className="w-10 h-10 mx-auto text-primary" />
        )}

        <h1 className="text-xl font-semibold">
          {state === "loading" && "Duke verifikuar..."}
          {state === "valid" && "Ç'regjistrohu nga email-et"}
          {state === "already" && "Jeni ç'regjistruar më parë"}
          {state === "done" && "U ç'regjistruat me sukses"}
          {state === "invalid" && "Lidhja nuk është e vlefshme"}
          {state === "error" && "Ndodhi një gabim"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {state === "valid" && "Konfirmo për të ndaluar njoftimet me email."}
          {state === "done" && "Nuk do të pranoni më njoftime me email."}
          {state === "already" && "Adresa juaj është hequr më parë nga lista."}
          {state === "invalid" && "Kontrolloni lidhjen nga email-i dhe provoni përsëri."}
          {state === "error" && "Provoni përsëri pas disa minutash."}
        </p>

        {state === "valid" && (
          <Button onClick={confirm} disabled={busy} className="w-full">
            {busy ? "Duke përpunuar..." : "Konfirmo ç'regjistrimin"}
          </Button>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
