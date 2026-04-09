import { useState } from "react";
import AppSidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import CandidateTable from "@/components/CandidateTable";
import AddCandidateForm from "@/components/AddCandidateForm";
import { mockCandidates } from "@/data/mockCandidates";
import { Candidate } from "@/types/candidate";
import { Menu, X } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddCandidate = (candidate: Candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
    setActiveView("candidates");
  };

  const viewTitles: Record<string, string> = {
    dashboard: "Paneli Kryesor",
    candidates: "Lista e Kandidatëve",
    add: "Shto Kandidat",
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <AppSidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setSidebarOpen(false); }} />
      </div>

      {/* Main */}
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
                <h3 className="text-lg font-semibold mb-4">Kandidatët e Fundit</h3>
                <CandidateTable candidates={candidates} />
              </div>
            </>
          )}

          {activeView === "candidates" && <CandidateTable candidates={candidates} />}

          {activeView === "add" && <AddCandidateForm onAdd={handleAddCandidate} candidateCount={candidates.length} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
