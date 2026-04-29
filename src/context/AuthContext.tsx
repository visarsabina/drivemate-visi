import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isInstructor: boolean;
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
  const [roleChecked, setRoleChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) setRoleChecked(false);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer role check so the SDK can attach the new access token to subsequent requests
        setTimeout(() => {
          checkAdminRole(newSession.user.id, newSession.access_token);
        }, 100);
      } else {
        setIsAdmin(false);
        setIsInstructor(false);
        setRoleChecked(true);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        checkAdminRole(existingSession.user.id, existingSession.access_token).finally(() => setLoading(false));
      } else {
        setRoleChecked(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string, accessToken?: string) => {
    try {
      const [adminResult, instructorResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("is_instructor"),
      ]);

      if (adminResult.error) throw adminResult.error;
      if (instructorResult.error) throw instructorResult.error;

      setIsAdmin(Boolean(adminResult.data));
      setIsInstructor(Boolean(instructorResult.data));
    } catch (err) {
      console.error("Role check failed:", err);
      setIsAdmin(false);
      setIsInstructor(false);
    } finally {
      setRoleChecked(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsInstructor(false);
    setRoleChecked(true);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isInstructor, roleChecked, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
