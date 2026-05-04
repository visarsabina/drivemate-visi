import { useState } from "react";
import AppSidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import CandidateTable from "@/components/CandidateTable";
import AddCandidateForm from "@/components/AddCandidateForm";
import PaymentForm from "@/components/PaymentForm";
import CandidateBooklet from "@/components/CandidateBooklet";
import CandidateDetail from "@/components/CandidateDetail";
import CandidateVertetimi from "@/components/CandidateVertetimi";
import CandidateKontrata from "@/components/CandidateKontrata";
import CandidateFletparaqitja from "@/components/CandidateFletparaqitja";
import Finances from "@/components/Finances";
import Registrations from "@/components/Registrations";
import Vehicles from "@/components/Vehicles";
import VehicleServices from "@/components/VehicleServices";
import Employees from "@/components/Employees";
import Licenses from "@/components/Licenses";
import Users from "@/components/Users";
import VehicleAlerts from "@/components/VehicleAlerts";
import EmployeeAlerts from "@/components/EmployeeAlerts";
import CategoryYearStats from "@/components/CategoryYearStats";
import InstructorDashboard from "@/components/InstructorDashboard";
import { useAuth } from "@/context/AuthContext";
import { useCandidates } from "@/hooks/useCandidates";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Candidate, Payment } from "@/types/candidate";
import { Menu, X, BookOpen, FileCheck, FileText, FileSignature, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAdmin, isInstructor } = useAuth();
  const { branding } = useTenantBranding();
  const { isSuperAdmin } = useIsSuperAdmin();
  const defaultView = !isAdmin && isInstructor ? "instructor" : "dashboard";
  const [activeView, setActiveView] = useState(defaultView);
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addPayment,
    setVertetimiPrintuar,
    setDokumenteTerhequr,
  } = useCandidates();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const handleAddCandidate = async (candidate: Candidate) => {
    await addCandidate(candidate);
    setActiveView("candidates");
  };

  const handlePayment = (candidateId: string, payment: Payment) => {
    addPayment(candidateId, payment);
  };

  const handleVertetimiPrinted = (candidateId: string) => {
    setVertetimiPrintuar(candidateId);
  };

  const handleUpdateCandidate = (updated: Candidate) => {
    updateCandidate(updated);
    setSelectedCandidate(updated);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const ok = await deleteCandidate(candidateId);
    if (ok) {
      setSelectedCandidate(null);
      setActiveView("candidates");
    }
  };

  const handleToggleDocuments = (candidateId: string, value: boolean) => {
    setDokumenteTerhequr(candidateId, value);
  };

  const viewTitles: Record<string, string> = {
    dashboard: "Paneli Kryesor",
    instructor: "Kandidatët e Mi",
    candidates: "Lista e Kandidatëve",
    "candidate-detail": "Paneli i Kandidatit",
    add: "Shto Kandidat",
    payment: "Pagesa",
    finances: "Financat",
    registrations: "Regjistrimet nga Vizitorët",
    vehicles: "Mjetet e Auto-shkollës",
    "vehicle-services": "Servisat e Veturave",
    employees: "Punëtorët",
    licenses: "Licencat",
    users: "Përdoruesit",
    libreza: "Libreza e Kandidatit",
    vertetimi: "Vërtetimi",
    kontrata: "Kontrata",
    fletparaqitja: "Fletparaqitja",
  };

  const dashboardActions = [
    { id: "libreza", label: "Libreza e Kandidatit", icon: BookOpen, description: "Shiko librezën e kandidatit" },
    { id: "vertetimi", label: "Vërtetimi", icon: FileCheck, description: "Gjenero vërtetimin" },
    { id: "fletparaqitja", label: "Fletparaqitja", icon: FileText, description: "Gjenero fletparaqitjen" },
    { id: "kontrata", label: "Kontrata", icon: FileSignature, description: "Gjenero kontratën" },
  ];

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <AppSidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setSelectedCandidate(null); setSidebarOpen(false); }} />
      </div>

      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 py-4 flex items-center gap-4 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-xl font-semibold">{viewTitles[activeView]}</h2>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{branding?.name ?? "Auto Shkolla"}</span>
            {isSuperAdmin && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground ml-1">
                Super Admin
              </span>
            )}
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6">
          {activeView === "instructor" && <InstructorDashboard />}

          {activeView === "dashboard" && (
            <>
              <StatsCards candidates={candidates} />

              <div>
                <h3 className="text-lg font-semibold mb-4">Kandidatët e Fundit</h3>
                <CandidateTable candidates={candidates} onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail"); }} />
              </div>

              <CategoryYearStats candidates={candidates} />

              <VehicleAlerts onViewVehicles={() => setActiveView("vehicles")} />

              <EmployeeAlerts onViewEmployees={() => setActiveView("employees")} />

              <div>
                <h3 className="text-lg font-semibold mb-4">Dokumentet</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {dashboardActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => setActiveView(action.id)}
                      >
                        <Icon className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium text-center">{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeView === "candidates" && (
            <CandidateTable
              candidates={candidates}
              onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail"); }}
              onToggleDocuments={handleToggleDocuments}
            />
          )}

          {activeView === "candidate-detail" && selectedCandidate && (
            <CandidateDetail
              candidate={candidates.find(c => c.id === selectedCandidate.id) || selectedCandidate}
              onBack={() => { setSelectedCandidate(null); setActiveView("candidates"); }}
              onVertetimiPrinted={handleVertetimiPrinted}
              onUpdate={handleUpdateCandidate}
              onDelete={handleDeleteCandidate}
            />
          )}

          {activeView === "add" && <AddCandidateForm onAdd={handleAddCandidate} candidateCount={candidates.length} />}

          {activeView === "payment" && <PaymentForm candidates={candidates} onPayment={handlePayment} />}

          {activeView === "finances" && <Finances candidates={candidates} />}

          {activeView === "registrations" && <Registrations />}

          {activeView === "vehicles" && <Vehicles />}

          {activeView === "vehicle-services" && <VehicleServices />}

          {activeView === "employees" && <Employees />}

          {activeView === "licenses" && <Licenses />}

          {activeView === "users" && <Users />}

          {activeView === "libreza" && <CandidateBooklet candidates={candidates} />}

          {activeView === "vertetimi" && <CandidateVertetimi candidates={candidates} onPrinted={handleVertetimiPrinted} />}

          {activeView === "kontrata" && <CandidateKontrata candidates={candidates} />}

          {activeView === "fletparaqitja" && <CandidateFletparaqitja candidates={candidates} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
