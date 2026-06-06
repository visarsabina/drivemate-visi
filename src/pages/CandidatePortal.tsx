import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { LogOut, CreditCard, GraduationCap, User as UserIcon, CalendarPlus, Loader2, Clock, ClipboardList } from "lucide-react";
import logo from "@/assets/logo.png";
import CandidateTests from "@/components/CandidateTests";

interface CandidateRow {
  id: string;
  tenant_id: string;
  emri: string;
  mbiemri: string;
  numri_regjistrimit: string;
  kategoria: string;
  shuma_marreveshjes: number;
  total_lessons: number;
  instructor_id: string | null;
}

interface PaymentRow { id: string; shuma: number; data: string }
interface LessonRow { id: string; data: string; hours: number }
interface ExamRow { id: string; exam_date: string; exam_time: string; exam_type: string; status: string }
interface RequestRow { id: string; requested_date: string; requested_time: string; exam_type: string; status: string; admin_response: string | null; created_at: string }

const statusLabel = (s: string) => s === "pending" ? "Në pritje" : s === "approved" ? "Aprovuar" : s === "rejected" ? "Refuzuar" : s;
const statusClass = (s: string) =>
  s === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
  s === "rejected" ? "bg-destructive/15 text-destructive" :
  "bg-amber-500/15 text-amber-700 dark:text-amber-300";

const CandidatePortal = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<CandidateRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [instructorEmail, setInstructorEmail] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");

  // Exam request dialog
  const [open, setOpen] = useState(false);
  const [reqDate, setReqDate] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqType, setReqType] = useState("praktike");
  const [reqNotes, setReqNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showTests, setShowTests] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: c } = await supabase
      .from("candidates")
      .select("id, tenant_id, emri, mbiemri, numri_regjistrimit, kategoria, shuma_marreveshjes, total_lessons, instructor_id")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (!c) { setLoading(false); return; }
    setCandidate(c as CandidateRow);

    const [pRes, lRes, eRes, rRes, tRes] = await Promise.all([
      supabase.from("candidate_payments").select("id, shuma, data").eq("candidate_id", c.id).order("data", { ascending: false }),
      supabase.from("candidate_lessons").select("id, data, hours").eq("candidate_id", c.id).order("data", { ascending: false }),
      supabase.from("candidate_exams").select("id, exam_date, exam_time, exam_type, status").eq("candidate_id", c.id).order("exam_date", { ascending: true }),
      supabase.from("exam_requests").select("id, requested_date, requested_time, exam_type, status, admin_response, created_at").eq("candidate_id", c.id).order("created_at", { ascending: false }),
      supabase.from("tenants").select("name").eq("id", c.tenant_id).maybeSingle(),
    ]);
    setPayments((pRes.data ?? []) as PaymentRow[]);
    setLessons((lRes.data ?? []) as LessonRow[]);
    setExams((eRes.data ?? []) as ExamRow[]);
    setRequests((rRes.data ?? []) as RequestRow[]);
    setTenantName(tRes.data?.name ?? "");

    if (c.instructor_id) {
      // We can't query auth.users from client; instructor name not exposed.
      // We just show a generic label "Instruktor: i caktuar" if needed.
      setInstructorEmail(null);
    }
    setLoading(false);
  };

  const totalPaid = payments.reduce((s, p) => s + Number(p.shuma), 0);
  const debt = (candidate?.shuma_marreveshjes ?? 0) - totalPaid;
  const totalHours = lessons.reduce((s, l) => s + Number(l.hours), 0);
  const totalLessons = candidate?.total_lessons ?? 20;
  const remaining = Math.max(totalLessons - totalHours, 0);

  const nextExam = exams.find((e) => new Date(`${e.exam_date}T${e.exam_time}`) >= new Date()) ?? exams[0];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const submitRequest = async () => {
    if (!candidate) return;
    if (!reqDate || !reqTime) {
      toast({ title: "Mungojnë të dhënat", description: "Zgjidh datën dhe orën.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("exam_requests").insert({
      tenant_id: candidate.tenant_id,
      candidate_id: candidate.id,
      requested_date: reqDate,
      requested_time: reqTime,
      exam_type: reqType,
      status: "pending",
      notes: reqNotes || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Dështoi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "U dërgua", description: "Kërkesa pret aprovimin e administratorit." });
    setOpen(false);
    setReqDate(""); setReqTime(""); setReqNotes(""); setReqType("praktike");
    load();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">Llogaria juaj nuk është e lidhur me një kartelë kandidati. Kontaktoni administratorin.</p>
        <Button onClick={handleLogout} variant="outline" className="gap-2"><LogOut className="w-4 h-4" /> Dilni</Button>
      </div>
    );
  }

  if (showTests) {
    return <CandidateTests candidateId={candidate.id} onClose={() => setShowTests(false)} />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <img src={logo} alt="" className="w-8 h-8" />
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate">{tenantName || "Auto Shkolla"}</h1>
          <p className="text-xs text-muted-foreground truncate">Portali i Kandidatit</p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Dilni
        </Button>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{candidate.emri} {candidate.mbiemri}</h2>
              <p className="text-xs text-muted-foreground">Nr. {candidate.numri_regjistrimit} · Kategoria {candidate.kategoria}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">Testi i autoshkollës</p>
            <p className="text-xs text-muted-foreground">10 teste për t'u përgatitur për provim</p>
          </div>
          <Button size="sm" onClick={() => setShowTests(true)}>Fillo</Button>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CreditCard className="w-4 h-4" /> Pagesat
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Shuma e marrëveshjes</span><span className="font-medium">{candidate.shuma_marreveshjes.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>E paguar</span><span className="font-medium text-emerald-600">{totalPaid.toFixed(2)} €</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Borxhi</span><span className={`font-bold ${debt > 0 ? "text-destructive" : "text-emerald-600"}`}>{debt.toFixed(2)} €</span></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <GraduationCap className="w-4 h-4" /> Orët praktike
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Të mbajtura</span><span className="font-medium">{totalHours}</span></div>
              <div className="flex justify-between"><span>Totali i planifikuar</span><span className="font-medium">{totalLessons}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Të mbetura</span><span className="font-bold text-primary">{remaining}</span></div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> Termini i ardhshëm
            </div>
          </div>
          {nextExam ? (
            <div className="text-sm">
              <p className="font-medium capitalize">{nextExam.exam_type === "teori" ? "Teori" : "Praktikë"}</p>
              <p className="text-muted-foreground">{nextExam.exam_date} · {nextExam.exam_time?.slice(0, 5)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nuk ke termine të planifikuara.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarPlus className="w-4 h-4" /> Kërkesat e mia për provim
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><CalendarPlus className="w-4 h-4" /> Trego terminin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Kërkesë e re për termin</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Lloji</Label>
                    <Select value={reqType} onValueChange={setReqType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="praktike">Praktikë</SelectItem>
                        <SelectItem value="teori">Teori</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Data</Label>
                      <Input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Ora</Label>
                      <Input type="time" value={reqTime} onChange={(e) => setReqTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Shënime (opcionale)</Label>
                    <Input value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} maxLength={300} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
                  <Button onClick={submitRequest} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Dërgo kërkesën
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nuk ke kërkesa.</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">{r.exam_type === "teori" ? "Teori" : "Praktikë"} · {r.requested_date} {r.requested_time?.slice(0, 5)}</p>
                    {r.admin_response && <p className="text-xs text-muted-foreground truncate">{r.admin_response}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${statusClass(r.status)}`}>{statusLabel(r.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
};

export default CandidatePortal;
