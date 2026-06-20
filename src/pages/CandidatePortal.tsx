import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { LogOut, CreditCard, GraduationCap, User as UserIcon, CalendarPlus, Loader2, Clock, ClipboardList, Building2 } from "lucide-react";
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

  const quickActions = [
    { id: "test", label: "Testi", icon: ClipboardList, grad: "from-blue-500 to-indigo-600", onClick: () => setShowTests(true) },
    { id: "termin", label: "Trego termin", icon: CalendarPlus, grad: "from-emerald-500 to-teal-600", onClick: () => setOpen(true) },
  ];

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-3 py-2.5 flex items-center gap-2">
        <h2 className="text-base font-semibold truncate min-w-0">Portali i Kandidatit</h2>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 max-w-[55%]">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-primary truncate">{tenantName || "Auto Shkolla"}</span>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleLogout} aria-label="Dilni">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-3 space-y-3 max-w-3xl w-full mx-auto">
        {/* Profile */}
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">{candidate.emri} {candidate.mbiemri}</h2>
              <p className="text-[11px] text-muted-foreground truncate">Nr. {candidate.numri_regjistrimit} · Kategoria {candidate.kategoria}</p>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.id} onClick={a.onClick} className="group flex flex-col items-center gap-1 focus:outline-none">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-lg shadow-black/10 transition-transform duration-200 group-active:scale-95`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight text-foreground/80 line-clamp-2 max-w-[72px]">{a.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pagesat" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="pagesat" className="text-xs py-2">Pagesat</TabsTrigger>
            <TabsTrigger value="oret" className="text-xs py-2">Orët</TabsTrigger>
            <TabsTrigger value="termini" className="text-xs py-2">Termini</TabsTrigger>
            <TabsTrigger value="kerkesat" className="text-xs py-2">Kërkesat</TabsTrigger>
          </TabsList>

          <TabsContent value="pagesat" className="mt-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <CreditCard className="w-4 h-4" /> Pagesat
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Marrëveshja</span><span className="font-medium">{candidate.shuma_marreveshjes.toFixed(2)} €</span></div>
                <div className="flex justify-between"><span>E paguar</span><span className="font-medium text-emerald-600">{totalPaid.toFixed(2)} €</span></div>
                <div className="flex justify-between border-t pt-1 mt-1"><span>Borxhi</span><span className={`font-bold ${debt > 0 ? "text-destructive" : "text-emerald-600"}`}>{debt.toFixed(2)} €</span></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="oret" className="mt-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <GraduationCap className="w-4 h-4" /> Orët praktike
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Të mbajtura</span><span className="font-medium">{totalHours}</span></div>
                <div className="flex justify-between"><span>Totali</span><span className="font-medium">{totalLessons}</span></div>
                <div className="flex justify-between border-t pt-1 mt-1"><span>Të mbetura</span><span className="font-bold text-primary">{remaining}</span></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="termini" className="mt-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Clock className="w-4 h-4" /> Termini i ardhshëm
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
          </TabsContent>

          <TabsContent value="kerkesat" className="mt-3">
            <Card className="p-3">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nuk ke kërkesa. Shtyp “Trego termin” më lart.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {requests.map((r) => (
                    <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize truncate">{r.exam_type === "teori" ? "Teori" : "Praktikë"} · {r.requested_date} {r.requested_time?.slice(0, 5)}</p>
                        {r.admin_response && <p className="text-xs text-muted-foreground truncate">{r.admin_response}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md shrink-0 ${statusClass(r.status)}`}>{statusLabel(r.status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
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
  );
};

export default CandidatePortal;
