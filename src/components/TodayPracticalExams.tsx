import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { Clock, CalendarCheck, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Candidate } from "@/types/candidate";
import { Card } from "@/components/ui/card";

interface Props {
  candidates: Candidate[];
}

interface ExamRow {
  id: string;
  candidate_id: string;
  exam_time: string;
}

const TodayPracticalExams = ({ candidates }: Props) => {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTomorrow, setShowTomorrow] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tenantId) return;
      setLoading(true);
      const now = new Date();
      const useTomorrow = now.getHours() >= 16;
      setShowTomorrow(useTomorrow);
      const targetDate = useTomorrow ? addDays(now, 1) : now;
      const dateStr = format(targetDate, "yyyy-MM-dd");
      const { data } = await supabase
        .from("candidate_exams")
        .select("id, candidate_id, exam_time")
        .eq("tenant_id", tenantId)
        .eq("exam_date", dateStr)
        .eq("exam_type", "praktike")
        .order("exam_time", { ascending: true });
      const sorted = ((data ?? []) as ExamRow[]).slice().sort((a, b) => {
        const tA = a.exam_time ?? "";
        const tB = b.exam_time ?? "";
        return tA.localeCompare(tB);
      });
      setExams(sorted);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  const rows = exams.map((e) => {
    const c = candidates.find((c) => c.id === e.candidate_id);
    return {
      id: e.id,
      candidateId: e.candidate_id,
      time: e.exam_time?.slice(0, 5) ?? "",
      name: c ? `${c.emri} ${c.mbiemri}` : "—",
    };
  });

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Kandidatët për Provim Praktik – {showTomorrow ? "Nesër" : "Sot"}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
          <ArrowUp className="w-3 h-3" />
          Të renditur sipas orës
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Duke ngarkuar...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nuk ka kandidatë të planifikuar për {showTomorrow ? "nesër" : "sot"}.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="py-2.5">
              <button
                type="button"
                onClick={() => navigate(`/?view=libreza&id=${r.candidateId}`)}
                className="w-full flex items-center justify-between text-left hover:bg-muted/40 rounded-md px-2 -mx-2 py-1 transition-colors"
              >
                <span className="font-medium text-primary hover:underline">{r.name}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  {r.time}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default TodayPracticalExams;
