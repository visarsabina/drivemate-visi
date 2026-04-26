import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useIsSuperAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsSuperAdmin(false);
      setChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("super_admin check failed:", error);
        setIsSuperAdmin(false);
      } else {
        setIsSuperAdmin(!!data);
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isSuperAdmin, checked, loading: authLoading || !checked };
};
