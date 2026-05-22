import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { sq } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Clock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDateDMY } from "@/lib/date";

interface ExamRow {
  id: string;
  candidate_id: string;
  exam_date: string;
  exam_time: string;
  exam_type: "teori" | "praktike";
  status: "planifikuar" | "kaluar" | "deshtur" | "anuluar";
  location: string | null;
  notes: string | null;
}

interface Props {
  candidates: Candidate[];
}

const statusColors: Record<string, string> = {
  planifikuar: "bg-primary/15 text-primary border-primary/30",
  kaluar: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  deshtur: "bg-destructive/15 text-destructive border-destructive/30",
  anuluar: "bg-muted text-muted-foreground border-border",
};

const ExamCalendar = ({ candidates }: Props) => {
  const { tenantId } = useTenant();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formCandidate, setFormCandidate] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());
  const [formTime, setFormTime] = useState("09:00");
  const [formType, setFormType] = useState<"teori" | "praktike">("teori");
  const [formNotes, setFormNotes] = useState("");

  const refresh = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("candidate_exams")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("exam_date", { ascending: true })
      .order("exam_time", { ascending: true });
    if (error) {
      toast.error("Gabim: " + error.message);
    } else {
      setExams((data ?? []) as ExamRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [tenantId]);

  const examsByDate = useMemo(() => {
    const map = new Map<string, ExamRow[]>();
    exams.forEach((e) => {
      const arr = map.get(e.exam_date) ?? [];
      arr.push(e);
      map.set(e.exam_date, arr);
    });
    return map;
  }, [exams]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const dayExams = examsByDate.get(selectedKey) ?? [];

  const candidateName = (id: string) => {
    const c = candidates.find((x) => x.id === id);
    return c ? `${c.emri} ${c.mbiemri}` : "—";
  };

  const openNewDialog = () => {
    setFormCandidate("");
    setFormDate(selectedDate);
    setFormTime("09:00");
    setFormType("teori");
    setFormNotes("");
    setDialogOpen(true);
  };

  const saveExam = async () => {
    if (!tenantId) return;
    if (!formCandidate || !formDate || !formTime) {
      toast.error("Plotëso kandidatin, datën dhe orën");
      return;
    }
    const { error } = await supabase.from("candidate_exams").insert({
      tenant_id: tenantId,
      candidate_id: formCandidate,
      exam_date: format(formDate, "yyyy-MM-dd"),
      exam_time: formTime,
      exam_type: formType,
      notes: formNotes || null,
    });
    if (error) {
      toast.error("Ruajtja dështoi: " + error.message);
      return;
    }
    toast.success("Provimi u regjistrua");
    setDialogOpen(false);
    refresh();
  };

  const updateStatus = async (id: string, status: ExamRow["status"]) => {
    const { error } = await supabase.from("candidate_exams").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Fshij këtë provim?")) return;
    const { error } = await supabase.from("candidate_exams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("U fshi");
    refresh();
  };

  const datesWithExams = useMemo(() => Array.from(examsByDate.keys()).map((d) => new Date(d)), [examsByDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg lg:text-xl font-semibold">Kalendari i Provimeve</h2>
          <p className="text-sm text-muted-foreground">Regjistro terminet e provimeve për kandidatët</p>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="w-4 h-4" /> Shto Provim
        </Button>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-4">
        <Card className="p-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            locale={sq}
            modifiers={{ hasExam: datesWithExams }}
            modifiersClassNames={{ hasExam: "bg-primary/20 font-bold text-primary rounded-md" }}
            className={cn("p-3 pointer-events-auto")}
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold capitalize">
              {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: sq })}
            </h3>
            <Badge variant="secondary" className="ml-auto">{dayExams.length} provime</Badge>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Duke u ngarkuar...</p>
          ) : dayExams.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Asnjë provim i caktuar për këtë ditë
            </div>
          ) : (
            <div className="space-y-2">
              {dayExams.map((exam) => (
                <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 sm:w-24 shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-mono font-semibold">{exam.exam_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{candidateName(exam.candidate_id)}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="capitalize">{exam.exam_type}</Badge>
                      <span className={cn("px-2 py-0.5 rounded-md text-xs border capitalize", statusColors[exam.status])}>
                        {exam.status}
                      </span>
                      {(() => {
                        const c = candidates.find((x) => x.id === exam.candidate_id);
                        return c?.kategoria ? (
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{c.kategoria}</span>
                        ) : null;
                      })()}
                    </div>
                    {exam.notes && <p className="text-xs text-muted-foreground mt-1">{exam.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={exam.status} onValueChange={(v) => updateStatus(exam.id, v as ExamRow["status"])}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planifikuar">Planifikuar</SelectItem>
                        <SelectItem value="kaluar">Kaluar</SelectItem>
                        <SelectItem value="deshtur">Dështuar</SelectItem>
                        <SelectItem value="anuluar">Anuluar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteExam(exam.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shto Provim</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kandidati</Label>
              <Select value={formCandidate} onValueChange={setFormCandidate}>
                <SelectTrigger><SelectValue placeholder="Zgjidh kandidatin" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emri} {c.mbiemri} {c.numriRegjistrimit ? `(${c.numriRegjistrimit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formDate ? formatDateDMY(formDate) : "Zgjidh"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formDate} onSelect={setFormDate} locale={sq} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Ora</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Lloji i provimit</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as "teori" | "praktike")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teori">Teori</SelectItem>
                  <SelectItem value="praktike">Praktikë</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vendi (opsional)</Label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="p.sh. Qendra e provimeve" />
            </div>

            <div>
              <Label>Shënime (opsional)</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
            <Button onClick={saveExam}>Ruaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamCalendar;
