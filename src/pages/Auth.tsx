import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "@/assets/logo.png";

const candidateEmail = (personal: string) => `c${personal}@candidate.local`;
const REMEMBER_KEY = "asv_remember_login";

type RememberedLogin = { mode: "admin" | "candidate"; email: string; personalNumber: string; password: string };

const loadRemembered = (): RememberedLogin | null => {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw)) as RememberedLogin;
  } catch {
    return null;
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const { toast } = useToast();
  const { session, isAdmin, isInstructor, isCandidate, roleChecked, loading: authLoading } = useAuth();
  const remembered = loadRemembered();
  const [mode, setMode] = useState<"admin" | "candidate">(remembered?.mode ?? "admin");
  const [email, setEmail] = useState(remembered?.email ?? "");
  const [personalNumber, setPersonalNumber] = useState(remembered?.personalNumber ?? "");
  const [password, setPassword] = useState(remembered?.password ?? "");
  const [remember, setRemember] = useState(Boolean(remembered));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);


  useEffect(() => {
    if (authLoading) return;
    if (!session) return;
    if (!roleChecked) return;

    let cancelled = false;
    (async () => {
      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
      if (cancelled) return;
      if (safeNext) {
        window.location.href = safeNext;
        return;
      }
      if (isSuperAdmin) { navigate("/super-admin", { replace: true }); return; }
      if (isAdmin || isInstructor) { navigate("/admin", { replace: true }); return; }
      if (isCandidate) { navigate("/candidate", { replace: true }); return; }

      if (hasAttemptedLogin) {
        toast({
          title: "Qasje e ndaluar",
          description: "Kjo llogari nuk ka rol të vlefshëm.",
          variant: "destructive",
        });
        supabase.auth.signOut();
        setHasAttemptedLogin(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session, isAdmin, isInstructor, isCandidate, roleChecked, authLoading, hasAttemptedLogin, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setHasAttemptedLogin(true);

    let loginEmail = email;
    if (mode === "candidate") {
      if (!/^\d{10}$/.test(personalNumber)) {
        toast({ title: "Numri personal", description: "Duhet të ketë 10 shifra.", variant: "destructive" });
        setSubmitting(false);
        setHasAttemptedLogin(false);
        return;
      }
      loginEmail = candidateEmail(personalNumber);
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

    if (error) {
      toast({ title: "Kyçje e dështuar", description: error.message, variant: "destructive" });
      setHasAttemptedLogin(false);
    } else {
      try {
        if (remember) {
          localStorage.setItem(
            REMEMBER_KEY,
            btoa(JSON.stringify({ mode, email, personalNumber, password } satisfies RememberedLogin)),
          );
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        /* ignore */
      }
    }
    setSubmitting(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="Auto Shkolla Visi" className="w-16 h-16 mx-auto" />
          <div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">Auto Shkolla Visi</h1>
            <CardDescription>Kyçja në sistem</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "admin" | "candidate")} className="mb-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="admin">Administrator</TabsTrigger>
              <TabsTrigger value="candidate">Kandidat</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="personal">Numri Personal (10 shifra)</Label>
                <Input
                  id="personal"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={personalNumber}
                  onChange={(e) => setPersonalNumber(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="username"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Fjalëkalimi</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Mbaj mend userin dhe fjalëkalimin
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kyçu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
