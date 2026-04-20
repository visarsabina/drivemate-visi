import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

const RequireLogin = ({ children }: { children: ReactNode }) => {
  const ok = typeof window !== "undefined" && localStorage.getItem("visi_auth") === "1";
  if (!ok) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default RequireLogin;
