import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock, CalendarCheck } from "lucide-react";
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
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!tenantId) return;
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("candidate_exams")
        .select("id, candidate_id, exam_time")
        .eq("tenant_id", tenantId)
        .eq("exam_date", today)
        .eq("exam_type", "praktike")
        .order("exam_time", { ascending: true });
      setExams((data ?? []) as ExamRow[]);
      setLoading(false);
    };
    load();
  }, [tenantId]);

  const rows = exams.map((e) => {
    const c = candidates.find((c) => c.id === e.candidate_id);
    return {
      id: e.id,
      time: e.exam_time?.slice(0, 5) ?? "",
      name: c ? `${c.emri} ${c.mbiemri}` : "—",
    };
  });

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Kandidatët për Provim Praktik – Sot</h3>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Duke ngarkuar...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nuk ka kandidatë të planifikuar për sot.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  {r.time}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default TodayPracticalExams;
