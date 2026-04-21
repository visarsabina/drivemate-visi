import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);

  useEffect(() => {
    // Only react after the user has actually tried to log in (or already had a session on mount)
    if (authLoading) return;
    if (!session) return;

    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    // Session exists but no admin role — only sign out if the user just tried to log in.
    // This avoids racing with the async role check on initial mount.
    if (hasAttemptedLogin) {
      toast({
        title: "Qasje e ndaluar",
        description: "Kjo llogari nuk ka rolin e administratorit.",
        variant: "destructive",
      });
      supabase.auth.signOut();
      setHasAttemptedLogin(false);
    }
  }, [session, isAdmin, authLoading, hasAttemptedLogin, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setHasAttemptedLogin(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: "Kyçje e dështuar",
        description: error.message,
        variant: "destructive",
      });
      setHasAttemptedLogin(false);
    }
    setSubmitting(false);
    // Success handled by useEffect once isAdmin is verified
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="Auto Shkolla Visi" className="w-16 h-16 mx-auto" />
          <div>
            <CardTitle className="text-2xl">Auto Shkolla Visi</CardTitle>
            <CardDescription>Kyçja për administrator</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Fjalëkalimi</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
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
