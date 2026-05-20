import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Candidate } from "@/types/candidate";

interface StatsCardsProps {
  candidates: Candidate[];
  onSelectCandidate?: (c: Candidate) => void;
}

const StatsCards = ({ candidates, onSelectCandidate }: StatsCardsProps) => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((c) =>
        c.emri.toLowerCase().includes(q) ||
        c.mbiemri.toLowerCase().includes(q) ||
        `${c.emri} ${c.mbiemri}`.toLowerCase().includes(q) ||
        c.numriRegjistrimit.toLowerCase().includes(q) ||
        (c.numriPersonal ?? "").toLowerCase().includes(q) ||
        (c.telefon ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [candidates, query]);

  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-sm text-muted-foreground mb-3">Kërko kandidatin</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kërko me emër, numër personal, numër regjistrimi ose telefon..."
          className="pl-10"
        />
      </div>

      {query && (
        <div className="mt-3 border border-border/60 rounded-lg divide-y divide-border/50 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nuk u gjet asnjë kandidat
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCandidate?.(c)}
                className="w-full text-left p-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {c.emri} {c.mbiemri}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Nr. {c.numriRegjistrimit}
                    {c.numriPersonal ? ` • ${c.numriPersonal}` : ""}
                    {c.telefon ? ` • ${c.telefon}` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-xs shrink-0">
                  {c.kategoria}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCards;
