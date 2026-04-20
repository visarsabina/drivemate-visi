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
import { mockCandidates } from "@/data/mockCandidates";
import { Candidate, Payment } from "@/types/candidate";
import { Menu, X, BookOpen, FileCheck, FileText, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const handleAddCandidate = (candidate: Candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
    setActiveView("candidates");
  };

  const handlePayment = (candidateId: string, payment: Payment) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, payments: [...c.payments, payment] }
          : c
      )
    );
  };

  const handleVertetimiPrinted = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, vertetimiPrintuar: true } : c
      )
    );
  };

  const viewTitles: Record<string, string> = {
    dashboard: "Paneli Kryesor",
    candidates: "Lista e Kandidatëve",
    "candidate-detail": "Paneli i Kandidatit",
    add: "Shto Kandidat",
    payment: "Pagesa",
    finances: "Financat",
    registrations: "Regjistrimet nga Vizitorët",
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
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-xl font-semibold">{viewTitles[activeView]}</h2>
        </header>

        <div className="p-4 lg:p-8 space-y-6">
          {activeView === "dashboard" && (
            <>
              <StatsCards candidates={candidates} />

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

              <div>
                <h3 className="text-lg font-semibold mb-4">Kandidatët e Fundit</h3>
                <CandidateTable candidates={candidates} onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail"); }} />
              </div>
            </>
          )}

          {activeView === "candidates" && (
            <CandidateTable candidates={candidates} onSelectCandidate={(c) => { setSelectedCandidate(c); setActiveView("candidate-detail"); }} />
          )}

          {activeView === "candidate-detail" && selectedCandidate && (
            <CandidateDetail
              candidate={candidates.find(c => c.id === selectedCandidate.id) || selectedCandidate}
              onBack={() => { setSelectedCandidate(null); setActiveView("candidates"); }}
              onVertetimiPrinted={handleVertetimiPrinted}
            />
          )}

          {activeView === "add" && <AddCandidateForm onAdd={handleAddCandidate} candidateCount={candidates.length} />}

          {activeView === "payment" && <PaymentForm candidates={candidates} onPayment={handlePayment} />}

          {activeView === "finances" && <Finances candidates={candidates} />}

          {activeView === "registrations" && <Registrations />}

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
