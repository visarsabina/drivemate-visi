import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns whether the current authenticated user has the 'instructor' role.
 */
export const useIsInstructor = () => {
  const { user } = useAuth();
  const [isInstructor, setIsInstructor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsInstructor(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "instructor")
        .maybeSingle();
      if (!cancelled) {
        setIsInstructor(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isInstructor, loading };
};
