import { useMemo, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Database,
  FileText,
  Printer,
  RefreshCcw,
  Shuffle,
  Upload,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import builtinBank from "@/data/questionBank.json";
import builtinBankC from "@/data/questionBankC.json";
import { Candidate } from "@/types/candidate";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

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

const BUILTIN_QUESTIONS_C: ParsedQuestion[] = (builtinBankC as RawBankQuestion[])
  .map(normalizeBankQuestion)
  .filter((q): q is ParsedQuestion => q !== null);

const getBuiltinBankFor = (category: string): { bank: ParsedQuestion[]; count: number; imageDir: string } => {
  const cat = (category || "B").toUpperCase();
  if (cat === "C") {
    return { bank: BUILTIN_QUESTIONS_C, count: BUILTIN_QUESTIONS_C.length, imageDir: "/literatura-c/" };
  }
  return { bank: BUILTIN_QUESTIONS, count: QUESTION_COUNT, imageDir: "/literatura/" };
};

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/[\u2022\u25CF\u25A0]/g, "-")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();

const parseQuestionBank = (rawText: string): ParsedQuestion[] => {
  const lines = normalizeText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ParsedQuestion[] = [];
  let current: ParsedQuestion | null = null;

  const commitCurrent = () => {
    if (!current) return;
    const optionKeys = new Set(current.options.map((option) => option.key));
    if (current.text && current.options.length >= 2 && optionKeys.has(current.correctKey)) {
      parsed.push({
        ...current,
        text: current.text.trim(),
        options: current.options.map((option) => ({ ...option, text: option.text.trim() })),
      });
    }
    current = null;
  };

  for (const line of lines) {
    const questionMatch = line.match(/^(\d+)[\.)]\s*(.+)$/);
    const optionMatch = line.match(/^([A-E])(?:[\.)\-/:])\s*(.+)$/i);
    const answerMatch = line.match(
      /^(?:p[eë]rgjigjja(?:\s+e\s+sakt[eë])?|sakt[eë]|answer|correct answer)\s*[:\-]\s*([A-E])\b/i,
    );

    if (questionMatch) {
      commitCurrent();
      current = { id: questionMatch[1], text: questionMatch[2], options: [], correctKey: "" };
      continue;
    }
    if (!current) continue;
    if (optionMatch) {
      current.options.push({ key: optionMatch[1].toUpperCase(), text: optionMatch[2] });
      continue;
    }
    if (answerMatch) {
      current.correctKey = answerMatch[1].toUpperCase();
      continue;
    }
    if (current.options.length === 0) {
      current.text = `${current.text} ${line}`.trim();
    } else {
      const lastOption = current.options[current.options.length - 1];
      lastOption.text = `${lastOption.text} ${line}`.trim();
    }
  }

  commitCurrent();
  return parsed;
};

const extractTextFromDocx = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
};

const extractTextFromPdf = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pageTexts = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1);
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }),
  );
  return pageTexts.join("\n");
};

interface TestGeneratorProps {
  candidates: Candidate[];
  initialCandidateId?: string | null;
  onBack?: () => void;
}

const TestGenerator = ({ candidates, initialCandidateId, onBack }: TestGeneratorProps) => {
  const [candidateId, setCandidateId] = useState<string>(initialCandidateId ?? "");

  const [form, setForm] = useState<TestCandidate>({
    emri: "",
    mbiemri: "",
    numriPersonal: "",
    kategoria: "B",
    dataTestit: new Date().toISOString().split("T")[0],
  });

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

  const builtinFor = useMemo(() => getBuiltinBankFor(form.kategoria), [form.kategoria]);
  const [questionBank, setQuestionBank] = useState<ParsedQuestion[]>(builtinFor.bank);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [bankSource, setBankSource] = useState<"builtin" | "upload">("builtin");
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);

  // When category changes and we're on builtin source, swap the bank automatically
  useMemo(() => {
    if (bankSource === "builtin") {
      setQuestionBank(builtinFor.bank);
    }
  }, [builtinFor, bankSource]);

  const effectiveCount = bankSource === "builtin" ? builtinFor.count : QUESTION_COUNT;
  const imageDir = bankSource === "builtin" ? builtinFor.imageDir : "/literatura/";

  const summary = useMemo(
    () => ({ total: questionBank.length, enough: questionBank.length >= effectiveCount }),
    [questionBank, effectiveCount],
  );

  const createGeneratedTest = (candidate: TestCandidate) => {
    const count = effectiveCount;
    if (questionBank.length < count) {
      toast.error("Nuk ka pyetje të mjaftueshme");
      return;
    }

    const MIN_NO_IMAGE = Math.min(6, Math.max(0, count - 1));
    const withoutImage = shuffleArray(questionBank.filter((q) => !q.image));
    const withImage = shuffleArray(questionBank.filter((q) => !!q.image));
    const noImageCount = Math.min(MIN_NO_IMAGE, withoutImage.length);
    const picked = [
      ...withoutImage.slice(0, noImageCount),
      ...withImage.slice(0, count - noImageCount),
    ];
    if (picked.length < count) {
      const used = new Set(picked.map((q) => q.id));
      const rest = questionBank.filter((q) => !used.has(q.id));
      picked.push(...shuffleArray(rest).slice(0, count - picked.length));
    }
    const selectedQuestions = shuffleArray(picked);

    const minCorrect = Math.ceil((PASS_THRESHOLD / 100) * count);
    const possibleTargets = Array.from(
      { length: count - minCorrect + 1 },
      (_, i) => minCorrect + i,
    );
    const lastScore = generatedTest?.score;
    const availableTargets = possibleTargets.filter(
      (t) => Math.round((t / count) * 100) !== lastScore,
    );
    const pool = availableTargets.length > 0 ? availableTargets : possibleTargets;
    const correctTarget = pool[Math.floor(Math.random() * pool.length)];
    const indices = Array.from({ length: count }, (_, i) => i);
    const wrongIndices = new Set(shuffleArray(indices).slice(0, count - correctTarget));

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
    const score = Math.round((correctAnswers / count) * 100);

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
    if (!summary.enough) {
      toast.error("Ngarko fajllin me pyetje");
      return;
    }
    createGeneratedTest(form);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isDocx = lowerName.endsWith(".docx");
    const isPdf = lowerName.endsWith(".pdf");

    if (!isDocx && !isPdf) {
      setParseError("Ngarko vetëm fajll DOCX ose PDF.");
      toast.error("Format i pambështetur");
      return;
    }

    setIsParsing(true);
    setParseError("");
    setGeneratedTest(null);

    try {
      const text = isDocx ? await extractTextFromDocx(file) : await extractTextFromPdf(file);
      const parsedQuestions = parseQuestionBank(text);

      if (parsedQuestions.length < QUESTION_COUNT) {
        setQuestionBank(parsedQuestions);
        setBankSource("upload");
        setUploadedFileName(file.name);
        setParseError(
          "Struktura e fajllit nuk u lexua plotësisht. Sigurohu që pyetjet të jenë të numëruara, alternativat me A/B/C/D dhe të jetë shënuar përgjigjja e saktë.",
        );
        toast.error(`U gjetën vetëm ${parsedQuestions.length} pyetje të vlefshme.`);
        return;
      }

      setQuestionBank(parsedQuestions);
      setBankSource("upload");
      setUploadedFileName(file.name);
      toast.success(`U përgatitën ${parsedQuestions.length} pyetje për gjenerim testi.`);
    } catch {
      setQuestionBank(BUILTIN_QUESTIONS);
      setBankSource("builtin");
      setUploadedFileName(file.name);
      setParseError("Fajlli nuk mund të lexohet. Kontrollo formatin dhe provo sërish.");
      toast.error("Leximi i fajllit dështoi");
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const useBuiltinBank = () => {
    setQuestionBank(BUILTIN_QUESTIONS);
    setBankSource("builtin");
    setUploadedFileName("");
    setParseError("");
    toast.success(`Banka zyrtare: ${BUILTIN_QUESTIONS.length} pyetje gati.`);
  };

  return (
    <main className="print-shell space-y-6">
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack} className="print-hidden">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kthehu
        </Button>
      )}

      <header className="flex flex-col gap-4 print-hidden">
        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
          Generator i testeve për auto shkollë
        </Badge>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Gjenero testin e kandidatit</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Ngarko fajllin me pyetje, plotëso të dhënat e kandidatit dhe krijo menjëherë test me 30 pyetje, rezultat
              final dhe printim të optimizuar për A4.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="rounded-md border-border/70 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pyetje të lexuara</p>
                <p className="mt-1 text-2xl font-semibold">{summary.total}</p>
              </CardContent>
            </Card>
            <Card className="rounded-md border-border/70 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pyetje në test</p>
                <p className="mt-1 text-2xl font-semibold">{effectiveCount}</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 rounded-md border-border/70 shadow-none sm:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Kalueshmëria</p>
                <p className="mt-1 text-2xl font-semibold">{PASS_THRESHOLD}/100</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] print:block">
        <div className="print-hidden space-y-6">
          <Card className="rounded-md border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-primary" />
                Banka e pyetjeve
              </CardTitle>
              <CardDescription>
                Sistemi vjen me {BUILTIN_QUESTIONS.length} pyetje zyrtare. Mund të përdorësh bankën e gatshme ose të
                ngarkosh një fajll DOCX/PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {bankSource === "builtin" ? "Banka zyrtare e integruar" : "Banka e ngarkuar nga ti"}
                    </p>
                    <p className="text-xs text-muted-foreground">{summary.total} pyetje · 30 për test</p>
                  </div>
                  {bankSource !== "builtin" ? (
                    <Button type="button" variant="outline" size="sm" onClick={useBuiltinBank}>
                      Përdor bankën zyrtare
                    </Button>
                  ) : null}
                </div>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-accent">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <Upload className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium">Ngarko fajll tjetër (opsionale)</p>
                  <p className="text-sm text-muted-foreground">DOCX ose PDF — zëvendëson përkohësisht bankën zyrtare</p>
                </div>
                <Input
                  type="file"
                  accept=".docx,.pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {uploadedFileName ? (
                <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                  <p className="font-medium">Fajlli aktiv</p>
                  <p className="text-muted-foreground">{uploadedFileName}</p>
                </div>
              ) : null}

              {isParsing ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Duke lexuar fajllin</AlertTitle>
                  <AlertDescription>Po analizohen pyetjet, alternativat dhe përgjigjet.</AlertDescription>
                </Alert>
              ) : null}

              {parseError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nevojitet rregullim i fajllit</AlertTitle>
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              ) : null}

              {summary.total > 0 && !parseError ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Baza e pyetjeve është gati</AlertTitle>
                  <AlertDescription>
                    U lexuan {summary.total} pyetje të vlefshme dhe sistemi mund të gjenerojë testin.
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-md border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Të dhënat e kandidatit</CardTitle>
              <CardDescription>Plotëso të gjitha fushat para gjenerimit të testit.</CardDescription>
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
                <Input
                  value={form.numriPersonal}
                  onChange={(e) => setForm({ ...form, numriPersonal: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kategoria</Label>
                  <Select value={form.kategoria} onValueChange={(v) => setForm({ ...form, kategoria: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data e testit</Label>
                  <Input
                    type="date"
                    value={form.dataTestit}
                    onChange={(e) => setForm({ ...form, dataTestit: e.target.value })}
                  />
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
          <Card className="print-surface rounded-md border-border/70 shadow-sm">
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
                        <p className="text-xs uppercase text-muted-foreground print:text-[8pt]">
                          Të dhënat e kandidatit
                        </p>
                        <h2 className="text-2xl font-semibold print:text-[12pt]">
                          {generatedTest.candidate.emri} {generatedTest.candidate.mbiemri}
                        </h2>
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 print:text-[8.5pt]">
                          <p>
                            <span className="font-medium text-foreground">Numri personal:</span>{" "}
                            {generatedTest.candidate.numriPersonal}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">Kategoria:</span>{" "}
                            {generatedTest.candidate.kategoria}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">Data e testit:</span>{" "}
                            {generatedTest.candidate.dataTestit}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-[220px] gap-3 rounded-md border bg-background p-4 print:min-w-0 print:p-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Pikët</span>
                          <span className="text-2xl font-semibold print:text-[11pt]">
                            {generatedTest.score}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Kalueshmëria</span>
                          <span className="font-medium">{generatedTest.passThreshold}/100</span>
                        </div>
                        <Badge
                          variant={generatedTest.passed ? "default" : "secondary"}
                          className="justify-center py-1.5"
                        >
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
                              src={`${imageDir}${question.image}`}
                              alt={`Pyetja ${index + 1}`}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                              className="h-auto w-full max-w-[180px] shrink-0 rounded-sm border object-contain print:max-w-[24mm]"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1 space-y-1.5 print:space-y-0.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-xs font-medium text-muted-foreground print:text-[8pt]">
                                Pyetja {index + 1}
                              </p>
                              <Badge
                                variant={question.isCorrect ? "default" : "secondary"}
                                className="shrink-0 px-1.5 py-0 text-[10px] print:hidden"
                              >
                                {question.isCorrect ? "E saktë" : "E pasaktë"}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-medium leading-snug print:text-[9pt]">{question.text}</h3>
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
                                        {isCorrect ? (
                                          <Check className="h-3 w-3" strokeWidth={3} />
                                        ) : isWrongPick ? (
                                          <X className="h-3 w-3" strokeWidth={3} />
                                        ) : null}
                                      </span>
                                      <p className="text-xs leading-snug print:text-[8.5pt]">
                                        <span className="font-semibold">{option.key}.</span> {option.text}
                                        {isSelected ? (
                                          <span className="ml-1 text-[10px] text-muted-foreground print:hidden">
                                            (zgjedhur)
                                          </span>
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
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <FileText className="h-7 w-7" />
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Testi do të shfaqet këtu</h2>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      Plotëso të dhënat e kandidatit dhe shtyp "Gjenero testin". Do të shohësh 30 pyetje të zgjedhura
                      rastësisht, përgjigjet e plota dhe rezultatin final gati për printim.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default TestGenerator;
