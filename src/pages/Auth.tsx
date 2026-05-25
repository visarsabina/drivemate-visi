import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const candidateEmail = (personal: string) => `c${personal}@candidate.local`;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isAdmin, isInstructor, isCandidate, roleChecked, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"admin" | "candidate">("admin");
  const [email, setEmail] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
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
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
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
