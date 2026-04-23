import { useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CategoryYearStatsProps {
  candidates: Candidate[];
}

const CategoryYearStats = ({ candidates }: CategoryYearStatsProps) => {
  const [visible, setVisible] = useState(true);

  const years = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.dataRegjistrimit) set.add(c.dataRegjistrimit.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [candidates]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "all");

  const { categoryCounts, total } = useMemo(() => {
    const filtered = selectedYear === "all"
      ? candidates
      : candidates.filter((c) => c.dataRegjistrimit?.startsWith(selectedYear));

    const counts: Record<string, number> = {};
    filtered.forEach((c) => {
      const cat = c.kategoria || "—";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return {
      categoryCounts: Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
      total: filtered.length,
    };
  }, [candidates, selectedYear]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Kandidatët sipas kategorive</h3>
          {visible && (
            <p className="text-sm text-muted-foreground">Gjithsej: {total} kandidatë</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {visible && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Viti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha vitet</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Fsheh" : "Shfaq"}
          >
            {visible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {visible ? "Fshih" : "Shfaq"}
          </Button>
        </div>
      </div>

      {visible && (
        categoryCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nuk ka të dhëna për këtë vit</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoryCounts.map(([cat, count]) => (
              <div key={cat} className="rounded-lg border border-border/50 bg-muted/30 p-3 flex flex-col items-center justify-center text-center">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm mb-2">
                  {cat}
                </span>
                <span className="text-2xl font-bold">{count}</span>
                <span className="text-xs text-muted-foreground">kandidatë</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default CategoryYearStats;
