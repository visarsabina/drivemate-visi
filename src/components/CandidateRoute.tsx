import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const CandidateRoute = ({ children }: { children: ReactNode }) => {
  const { session, isCandidate, roleChecked, loading } = useAuth();

  if (loading || (session && !roleChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !isCandidate) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default CandidateRoute;
