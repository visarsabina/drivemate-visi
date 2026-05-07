import { useMemo, useState } from "react";
import { Printer, RefreshCcw, Shuffle, Check, X, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import builtinBank from "@/data/questionBank.json";
import { Candidate } from "@/types/candidate";

const QUESTION_COUNT = 30;
const PASS_THRESHOLD = 85;
const OPTION_KEYS = ["A", "B", "C", "D", "E"];
const CATEGORY_OPTIONS = ["A", "A1", "AM", "B", "B1", "BE", "C", "C1", "CE", "D"];

type RawBankQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  image?: string | null;
};

type ParsedQuestion = {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  image?: string | null;
};

type GeneratedQuestion = ParsedQuestion & {
  selectedKey: string;
  isCorrect: boolean;
};

type TestCandidate = {
  emri: string;
  mbiemri: string;
  numriPersonal: string;
  kategoria: string;
  dataTestit: string;
};

type GeneratedTest = {
  candidate: TestCandidate;
  questions: GeneratedQuestion[];
  score: number;
  passThreshold: number;
  passed: boolean;
  createdAt: string;
};

const normalizeBankQuestion = (q: RawBankQuestion): ParsedQuestion | null => {
  const cleanedOptions = q.options
    .map((opt) => opt.replace(/\s+/g, " ").trim())
    .filter((opt) => opt.length > 0 && opt.length < 240);
  if (cleanedOptions.length < 2 || cleanedOptions.length > OPTION_KEYS.length) return null;
  if (q.correctIndex < 0 || q.correctIndex >= cleanedOptions.length) return null;
  return {
    id: q.id,
    text: q.text.replace(/\s+/g, " ").trim(),
    options: cleanedOptions.map((text, idx) => ({ key: OPTION_KEYS[idx], text })),
    correctKey: OPTION_KEYS[q.correctIndex],
    image: q.image ?? null,
  };
};

const BUILTIN_QUESTIONS: ParsedQuestion[] = (builtinBank as RawBankQuestion[])
  .map(normalizeBankQuestion)
  .filter((q): q is ParsedQuestion => q !== null);

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

interface TestGeneratorProps {
  candidates: Candidate[];
  initialCandidateId?: string | null;
  onBack?: () => void;
}

const TestGenerator = ({ candidates, initialCandidateId, onBack }: TestGeneratorProps) => {
  const [candidateId, setCandidateId] = useState<string>(initialCandidateId ?? "");
  const selected = useMemo(
    () => candidates.find((c) => c.id === candidateId) ?? null,
    [candidates, candidateId],
  );

  const [form, setForm] = useState<TestCandidate>({
    emri: "",
    mbiemri: "",
    numriPersonal: "",
    kategoria: "B",
    dataTestit: new Date().toISOString().split("T")[0],
  });

  // Sync from selected candidate when changed
  const handleCandidateChange = (id: string) => {
    setCandidateId(id);
    const c = candidates.find((x) => x.id === id);
    if (c) {
      setForm({
        emri: c.emri,
        mbiemri: c.mbiemri,
        numriPersonal: c.numriPersonal ?? "",
        kategoria: c.kategoria || "B",
        dataTestit: new Date().toISOString().split("T")[0],
      });
    }
  };

  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);

  const summary = useMemo(
    () => ({ total: BUILTIN_QUESTIONS.length, enough: BUILTIN_QUESTIONS.length >= QUESTION_COUNT }),
    [],
  );

  const createGeneratedTest = (candidate: TestCandidate) => {
    if (BUILTIN_QUESTIONS.length < QUESTION_COUNT) {
      toast.error("Nuk ka pyetje të mjaftueshme në bankë");
      return;
    }

    const MIN_NO_IMAGE = 6;
    const withoutImage = shuffleArray(BUILTIN_QUESTIONS.filter((q) => !q.image));
    const withImage = shuffleArray(BUILTIN_QUESTIONS.filter((q) => !!q.image));
    const noImageCount = Math.min(MIN_NO_IMAGE, withoutImage.length);
    const picked = [
      ...withoutImage.slice(0, noImageCount),
      ...withImage.slice(0, QUESTION_COUNT - noImageCount),
    ];
    if (picked.length < QUESTION_COUNT) {
      const used = new Set(picked.map((q) => q.id));
      const rest = BUILTIN_QUESTIONS.filter((q) => !used.has(q.id));
      picked.push(...shuffleArray(rest).slice(0, QUESTION_COUNT - picked.length));
    }
    const selectedQuestions = shuffleArray(picked);

    const minCorrect = Math.ceil((PASS_THRESHOLD / 100) * QUESTION_COUNT);
    const possibleTargets = Array.from(
      { length: QUESTION_COUNT - minCorrect + 1 },
      (_, i) => minCorrect + i,
    );
    const lastScore = generatedTest?.score;
    const availableTargets = possibleTargets.filter(
      (t) => Math.round((t / QUESTION_COUNT) * 100) !== lastScore,
    );
    const pool = availableTargets.length > 0 ? availableTargets : possibleTargets;
    const correctTarget = pool[Math.floor(Math.random() * pool.length)];
    const indices = Array.from({ length: QUESTION_COUNT }, (_, i) => i);
    const wrongIndices = new Set(shuffleArray(indices).slice(0, QUESTION_COUNT - correctTarget));

    const completed = selectedQuestions.map((question, idx) => {
      const shouldBeWrong = wrongIndices.has(idx);
      let selectedKey = question.correctKey;
      if (shouldBeWrong) {
        const wrongOptions = question.options.filter((opt) => opt.key !== question.correctKey);
        if (wrongOptions.length > 0) {
          selectedKey = wrongOptions[Math.floor(Math.random() * wrongOptions.length)].key;
        }
      }
      return { ...question, selectedKey, isCorrect: selectedKey === question.correctKey };
    });

    const correctAnswers = completed.filter((q) => q.isCorrect).length;
    const score = Math.round((correctAnswers / QUESTION_COUNT) * 100);

    setGeneratedTest({
      candidate,
      questions: completed,
      score,
      passThreshold: PASS_THRESHOLD,
      passed: score >= PASS_THRESHOLD,
      createdAt: new Date().toLocaleString("sq-AL", { dateStyle: "medium", timeStyle: "short" }),
    });
  };

  const handleGenerate = () => {
    if (!form.emri.trim() || !form.mbiemri.trim()) {
      toast.error("Plotëso emrin dhe mbiemrin");
      return;
    }
    if (!form.numriPersonal.trim()) {
      toast.error("Shkruaj numrin personal");
      return;
    }
    if (!form.dataTestit) {
      toast.error("Zgjedh datën e testit");
      return;
    }
    createGeneratedTest(form);
  };

  return (
    <div className="space-y-6 print-shell">
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack} className="print-hidden">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kthehu
        </Button>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] print:block">
        <div className="print-hidden space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Të dhënat e kandidatit</CardTitle>
              <CardDescription>
                Banka zyrtare: {summary.total} pyetje · 30 për test · kalueshmëria {PASS_THRESHOLD}/100
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Zgjedh kandidatin (opsionale)</Label>
                <Select value={candidateId} onValueChange={handleCandidateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjedh nga lista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.emri} {c.mbiemri} — {c.kategoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Të dhënat plotësohen automatikisht nga lista e kandidatëve.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emri</Label>
                  <Input value={form.emri} onChange={(e) => setForm({ ...form, emri: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Mbiemri</Label>
                  <Input value={form.mbiemri} onChange={(e) => setForm({ ...form, mbiemri: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Numri personal</Label>
                <Input value={form.numriPersonal} onChange={(e) => setForm({ ...form, numriPersonal: e.target.value })} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kategoria</Label>
                  <Select value={form.kategoria} onValueChange={(v) => setForm({ ...form, kategoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data e testit</Label>
                  <Input type="date" value={form.dataTestit} onChange={(e) => setForm({ ...form, dataTestit: e.target.value })} />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleGenerate} className="flex-1">
                  <Shuffle className="w-4 h-4 mr-2" /> Gjenero testin
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={!summary.enough}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Gjenero tjetër
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="print-surface">
            <CardHeader className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Parapamja e testit</CardTitle>
                <CardDescription>Test me 30 pyetje, përgjigje të zgjedhura dhe rezultat final.</CardDescription>
              </div>
              <Button onClick={() => window.print()} disabled={!generatedTest}>
                <Printer className="w-4 h-4 mr-2" /> Printo A4
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6 print:space-y-3 print:p-0">
              {generatedTest ? (
                <div className="space-y-6 print:space-y-2">
                  <section className="rounded-md border bg-secondary/30 p-4 sm:p-5 print:p-2 print:break-inside-avoid">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
                      <div className="space-y-2 print:space-y-0.5">
                        <p className="text-xs uppercase text-muted-foreground print:text-[8pt]">Të dhënat e kandidatit</p>
                        <h2 className="text-2xl font-semibold print:text-[12pt]">
                          {generatedTest.candidate.emri} {generatedTest.candidate.mbiemri}
                        </h2>
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 print:text-[8.5pt]">
                          <p><span className="font-medium text-foreground">Numri personal:</span> {generatedTest.candidate.numriPersonal}</p>
                          <p><span className="font-medium text-foreground">Kategoria:</span> {generatedTest.candidate.kategoria}</p>
                          <p><span className="font-medium text-foreground">Data e testit:</span> {generatedTest.candidate.dataTestit}</p>
                        </div>
                      </div>

                      <div className="grid min-w-[220px] gap-3 rounded-md border bg-background p-4 print:min-w-0 print:p-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Pikët</span>
                          <span className="text-2xl font-semibold print:text-[11pt]">{generatedTest.score}/100</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Kalueshmëria</span>
                          <span className="font-medium">{generatedTest.passThreshold}/100</span>
                        </div>
                        <Badge variant={generatedTest.passed ? "default" : "secondary"} className="justify-center py-1.5">
                          {generatedTest.passed ? "Kaloi" : "Nuk kaloi"}
                        </Badge>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 print:block print:space-y-0 print:columns-2 print:gap-x-4">
                    {generatedTest.questions.map((question, index) => (
                      <article
                        key={`${question.id}-${index}`}
                        className="rounded-md border p-3 sm:p-4 print:mb-1.5 print:inline-block print:w-full print:rounded-none print:border-0 print:border-b print:p-0 print:pb-1.5 print:break-inside-avoid"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3 print:flex-row print:gap-2">
                          {question.image ? (
                            <img
                              src={`/q-images/${question.image}`}
                              alt={`Pyetja ${index + 1}`}
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              className="h-auto w-full max-w-[180px] shrink-0 rounded-sm border object-contain print:max-w-[24mm]"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1 space-y-1.5 print:space-y-0.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-xs font-medium text-muted-foreground print:text-[8pt]">
                                Pyetja {index + 1}
                              </p>
                              <Badge variant={question.isCorrect ? "default" : "secondary"} className="shrink-0 px-1.5 py-0 text-[10px] print:hidden">
                                {question.isCorrect ? "E saktë" : "E pasaktë"}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-medium leading-snug print:text-[9pt]">
                              {question.text}
                            </h3>
                            <div className="grid gap-1 print:gap-0">
                              {question.options.map((option) => {
                                const isSelected = option.key === question.selectedKey;
                                const isCorrect = option.key === question.correctKey;
                                const isWrongPick = isSelected && !isCorrect;
                                const cls = isCorrect
                                  ? "rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 print:border-0 print:bg-transparent print:px-0 print:py-0"
                                  : isWrongPick
                                    ? "rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1 print:border-0 print:bg-transparent print:px-0 print:py-0"
                                    : "rounded-sm border bg-secondary/20 px-2 py-1 print:border-0 print:bg-transparent print:px-0 print:py-0";
                                return (
                                  <div key={`${question.id}-${option.key}`} className={cls}>
                                    <div className="flex items-start gap-1.5">
                                      <span
                                        className={
                                          isCorrect
                                            ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground print:bg-transparent print:text-primary"
                                            : isWrongPick
                                              ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground print:bg-transparent print:text-destructive"
                                              : "mt-0.5 hidden h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground sm:flex print:hidden"
                                        }
                                        aria-hidden="true"
                                      >
                                        {isCorrect ? <Check className="h-3 w-3" strokeWidth={3} /> : isWrongPick ? <X className="h-3 w-3" strokeWidth={3} /> : null}
                                      </span>
                                      <p className="text-xs leading-snug print:text-[8.5pt]">
                                        <span className="font-semibold">{option.key}.</span> {option.text}
                                        {isSelected ? (
                                          <span className="ml-1 text-[10px] text-muted-foreground print:hidden">(zgjedhur)</span>
                                        ) : null}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </section>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/30 p-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <FileText className="h-7 w-7" />
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Testi do të shfaqet këtu</h2>
                    <p className="max-w-xl text-sm text-muted-foreground">
                      Zgjedh kandidatin (ose plotëso të dhënat manualisht) dhe shtyp "Gjenero testin".
                      Sistemi do të krijojë test me 30 pyetje nga banka zyrtare e {summary.total} pyetjeve.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestGenerator;
