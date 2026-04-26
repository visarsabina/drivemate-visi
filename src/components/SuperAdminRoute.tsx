import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Loader2 } from "lucide-react";

const SuperAdminRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useIsSuperAdmin();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default SuperAdminRoute;
