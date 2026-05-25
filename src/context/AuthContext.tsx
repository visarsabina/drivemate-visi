import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isInstructor: boolean;
  isCandidate: boolean;
  roleChecked: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) setRoleChecked(false);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setTimeout(() => {
          checkRoles(newSession.user.id);
        }, 100);
      } else {
        setIsAdmin(false);
        setIsInstructor(false);
        setIsCandidate(false);
        setRoleChecked(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        checkRoles(existingSession.user.id).finally(() => setLoading(false));
      } else {
        setRoleChecked(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRoles = async (userId: string) => {
    try {
      const [adminResult, instructorResult, candidateResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("is_instructor"),
        supabase.rpc("is_candidate"),
      ]);

      setIsAdmin(Boolean(adminResult.data));
      setIsInstructor(Boolean(instructorResult.data));
      setIsCandidate(Boolean(candidateResult.data));
    } catch (err) {
      console.error("Role check failed:", err);
      setIsAdmin(false);
      setIsInstructor(false);
      setIsCandidate(false);
    } finally {
      setRoleChecked(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsInstructor(false);
    setIsCandidate(false);
    setRoleChecked(true);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isInstructor, isCandidate, roleChecked, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
