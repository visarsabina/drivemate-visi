import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Staff from "./pages/Staff.tsx";
import Install from "./pages/Install.tsx";
import SuperAdmin from "./pages/SuperAdmin.tsx";
import CandidatePortal from "./pages/CandidatePortal.tsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateRoute from "@/components/CandidateRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/school/:slug" element={<Home />} />
            <Route path="/stafi" element={<Staff />} />
            <Route path="/install" element={<Install />} />
            <Route path="/auth" element={<Auth />} />
            {/* Legacy login route -> redirect to secure auth */}
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <SuperAdminRoute>
                  <SuperAdmin />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/candidate"
              element={
                <CandidateRoute>
                  <CandidatePortal />
                </CandidateRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
