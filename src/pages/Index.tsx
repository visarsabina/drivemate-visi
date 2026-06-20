import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import ExamCalendar from "@/components/ExamCalendar";
import VehicleAlerts from "@/components/VehicleAlerts";
import EmployeeAlerts from "@/components/EmployeeAlerts";
import CategoryYearStats from "@/components/CategoryYearStats";
import InstructorDashboard from "@/components/InstructorDashboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TestGenerator from "@/components/TestGenerator";
import TodayPracticalExams from "@/components/TodayPracticalExams";
import ExamRequestsAdmin from "@/components/ExamRequestsAdmin";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import ActivityLog from "@/components/ActivityLog";
import { useAuth } from "@/context/AuthContext";
import { useCandidates } from "@/hooks/useCandidates";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Candidate, Payment } from "@/types/candidate";
import { Menu, X, BookOpen, FileCheck, FileText, FileSignature, Building2, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAdmin, isInstructor } = useAuth();
  const { branding } = useTenantBranding();
  const { isSuperAdmin } = useIsSuperAdmin();
  const defaultView = !isAdmin && isInstructor ? "instructor" : "dashboard";
  const [searchParams, setSearchParams] = useSearchParams();
  const urlView = searchParams.get("view") || defaultView;
  const urlCandidateId = searchParams.get("id") || undefined;
  const [activeView, setActiveViewState] = useState(urlView);
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addPayment,
    deletePayment,

    setVertetimiPrintuar,
    setDokumenteTerhequr,
  } = useCandidates();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [paymentInitialCandidateId, setPaymentInitialCandidateId] = useState<string | undefined>(urlCandidateId);

  // Helper: change view and sync URL
  const setActiveView = (view: string, opts?: { id?: string }) => {
    setActiveViewState(view);
    const params: Record<string, string> = {};
    if (view !== defaultView) params.view = view;
    if (opts?.id) params.id = opts.id;
    setSearchParams(params, { replace: false });
  };

  // Sync state when URL changes (back/forward navigation)
  useEffect(() => {
    const v = searchParams.get("view") || defaultView;
    const id = searchParams.get("id") || undefined;
    if (v !== activeView) setActiveViewState(v);
    if (v === "candidate-detail" && id) {
      const c = candidates.find(x => x.id === id);
      if (c && c.id !== selectedCandidate?.id) setSelectedCandidate(c);
    }
    if (v === "payment" && id !== paymentInitialCandidateId) {
      setPaymentInitialCandidateId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, candidates]);


  const handleAddCandidate = async (candidate: Candidate) => {
    await addCandidate(candidate);
    setActiveView("candidates");
  };

  const handlePayment = (candidateId: string, payment: Payment) => {
    return addPayment(candidateId, payment);
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
    exams: "Provimet",
    "exam-requests": "Kërkesat për Provim",
    finances: "Financat",
    registrations: "Regjistrimet nga Vizitorët",
    vehicles: "Mjetet e Auto-shkollës",
    "vehicle-services": "Servisat e Veturave",
    employees: "Punëtorët",
    licenses: "Licencat",
    users: "Përdoruesit",
    tests: "Gjenero Testin",
    activity: "Historiku i Veprimeve",
    "instructor-reports": "Raporti i Orëve",
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
        <AppSidebar activeView={activeView} onViewChange={(v) => { setSelectedCandidate(null); setActiveView(v); setSidebarOpen(false); }} />
      </div>

      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-3 lg:px-8 py-3 lg:py-4 flex items-center gap-2 lg:gap-4 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted shrink-0">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-base lg:text-xl font-semibold truncate min-w-0">{viewTitles[activeView]}</h2>
          <div className="ml-auto flex items-center gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-primary/10 border border-primary/20 max-w-[55%] lg:max-w-none">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs lg:text-sm font-medium text-primary truncate">{branding?.name ?? "Auto Shkolla"}</span>
            {isSuperAdmin && (
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground ml-1 shrink-0">
                Super Admin
              </span>
            )}
          </div>
        </header>

        <div className="p-3 lg:p-8 space-y-4 lg:space-y-6">
          <SubscriptionBanner />
          {activeView === "instructor" && <InstructorDashboard />}

          {activeView === "dashboard" && (
            <>
              <StatsCards candidates={candidates} onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail", { id: c.id }); }} />

              <div>
                <h3 className="text-base lg:text-lg font-semibold mb-3">Dokumentet</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-5">
                  {dashboardActions.map((action, idx) => {
                    const Icon = action.icon;
                    const gradients = [
                      "from-blue-500 to-indigo-600",
                      "from-emerald-500 to-teal-600",
                      "from-amber-500 to-orange-600",
                      "from-pink-500 to-rose-600",
                      "from-violet-500 to-purple-600",
                    ];
                    const grad = gradients[idx % gradients.length];
                    return (
                      <button
                        key={action.id}
                        onClick={() => setActiveView(action.id)}
                        className="group flex flex-col items-center gap-1 focus:outline-none"
                      >
                        <div
                          className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg shadow-black/10 transition-transform duration-200 group-active:scale-95 group-hover:scale-105`}
                        >
                          <Icon className="w-6 h-6 sm:w-9 sm:h-9 text-white" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-center leading-tight text-foreground/80 line-clamp-2 max-w-[72px]">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-auto">
                  <TabsTrigger value="stats" className="text-xs py-2">Statistika</TabsTrigger>
                  <TabsTrigger value="alerts" className="text-xs py-2">Alertet</TabsTrigger>
                  <TabsTrigger value="exams" className="text-xs py-2">Provimet</TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs py-2">Të fundit</TabsTrigger>
                </TabsList>
                <TabsContent value="stats" className="mt-3">
                  <CategoryYearStats candidates={candidates} />
                </TabsContent>
                <TabsContent value="alerts" className="mt-3 space-y-3">
                  <VehicleAlerts onViewVehicles={() => setActiveView("vehicles")} />
                  <EmployeeAlerts onViewEmployees={() => setActiveView("employees")} />
                </TabsContent>
                <TabsContent value="exams" className="mt-3">
                  <TodayPracticalExams candidates={candidates} />
                </TabsContent>
                <TabsContent value="recent" className="mt-3">
                  <div className="glass-card rounded-xl divide-y divide-border/50 overflow-hidden">
                    {[...candidates]
                      .sort((a, b) => (b.dataRegjistrimit || "").localeCompare(a.dataRegjistrimit || ""))
                      .slice(0, 10)
                      .map((c) => {
                        const paid = (c.payments || []).reduce((s, p) => s + (p.shuma || 0), 0);
                        const borxhi = Math.max(0, (c.shumaMarreveshjes || 0) - paid);
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCandidate(c); setActiveView("candidate-detail", { id: c.id }); }}
                            className="w-full text-left p-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground shrink-0">#{c.numriRegjistrimit}</span>
                              <span className="font-medium truncate">{c.emri} {c.mbiemri}</span>
                            </div>
                            <span className={`text-sm font-semibold shrink-0 ${borxhi > 0 ? "text-destructive" : "text-emerald-600"}`}>
                              {borxhi.toFixed(2)} €
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {activeView === "candidates" && (
            <CandidateTable
              candidates={candidates}
              onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail", { id: c.id }); }}
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
              onGoToPayments={(id) => { setPaymentInitialCandidateId(id); setActiveView("payment", { id }); }}
              autoEdit={searchParams.get("edit") === "1"}
            />
          )}

          {activeView === "add" && <AddCandidateForm onAdd={handleAddCandidate} candidates={candidates} />}

          {activeView === "payment" && <PaymentForm candidates={candidates} onPayment={handlePayment} onDeletePayment={deletePayment} initialCandidateId={paymentInitialCandidateId} />}

          {activeView === "exams" && <ExamCalendar candidates={candidates} />}

          {activeView === "exam-requests" && <ExamRequestsAdmin />}

          {activeView === "finances" && <Finances candidates={candidates} />}

          {activeView === "registrations" && <Registrations />}

          {activeView === "vehicles" && <Vehicles />}

          {activeView === "vehicle-services" && <VehicleServices />}

          {activeView === "employees" && <Employees />}

          {activeView === "licenses" && <Licenses />}

          {activeView === "users" && <Users />}

          {activeView === "libreza" && <CandidateBooklet candidates={candidates} preselectedId={urlCandidateId} />}

          {activeView === "vertetimi" && <CandidateVertetimi candidates={candidates} onPrinted={handleVertetimiPrinted} />}

          {activeView === "kontrata" && <CandidateKontrata candidates={candidates} />}

          {activeView === "fletparaqitja" && <CandidateFletparaqitja candidates={candidates} />}

          {activeView === "tests" && <TestGenerator candidates={candidates} initialCandidateId={selectedCandidate?.id ?? null} />}

          {activeView === "activity" && <ActivityLog />}
        </div>
      </main>
    </div>
  );
};

export default Index;
