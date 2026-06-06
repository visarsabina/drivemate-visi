import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList, Trophy, RotateCcw } from "lucide-react";
import builtinBank from "@/data/questionBank.json";

const OPTION_KEYS = ["A", "B", "C", "D", "E"];
const QUESTIONS_PER_TEST = 30;
const PASS_THRESHOLD = 85; // percent
const TEST_COUNT = 10;

type RawQ = { id: string; text: string; options: string[]; correctIndex: number; image?: string | null };
type Q = { id: string; text: string; options: { key: string; text: string }[]; correctKey: string; image?: string | null };

const ALL_QUESTIONS: Q[] = (builtinBank as RawQ[])
  .map((q) => {
    const opts = q.options.map((o) => (o || "").replace(/\s+/g, " ").trim()).filter((o) => o.length > 0 && o.length < 240);
    if (opts.length < 2 || opts.length > OPTION_KEYS.length) return null;
    if (q.correctIndex < 0 || q.correctIndex >= opts.length) return null;
    const txt = (q.text || "").replace(/\s+/g, " ").trim();
    if (!txt) return null;
    return {
      id: q.id,
      text: txt,
      options: opts.map((t, i) => ({ key: OPTION_KEYS[i], text: t })),
      correctKey: OPTION_KEYS[q.correctIndex],
      image: q.image ?? null,
    };
  })
  .filter((q): q is Q => q !== null);

// Deterministic PRNG (mulberry32) for stable per-test question sets
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getTestQuestions(testIndex: number): Q[] {
  const rnd = mulberry32(testIndex * 1000003 + 7);
  const arr = [...ALL_QUESTIONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(QUESTIONS_PER_TEST, arr.length));
}

type Result = { score: number; total: number; passed: boolean; date: string };

const storageKey = (candidateId: string) => `candidate_test_results_${candidateId}`;

function loadResults(candidateId: string): Record<number, Result> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(candidateId)) || "{}");
  } catch {
    return {};
  }
}
function saveResult(candidateId: string, testIndex: number, result: Result) {
  const all = loadResults(candidateId);
  all[testIndex] = result;
  localStorage.setItem(storageKey(candidateId), JSON.stringify(all));
}

interface Props {
  candidateId: string;
  onClose: () => void;
}

export default function CandidateTests({ candidateId, onClose }: Props) {
  const [activeTest, setActiveTest] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Result>>({});

  useEffect(() => { setResults(loadResults(candidateId)); }, [candidateId]);

  if (activeTest !== null) {
    return (
      <TestRunner
        testIndex={activeTest}
        onExit={() => { setActiveTest(null); setResults(loadResults(candidateId)); }}
        onFinish={(r) => { saveResult(candidateId, activeTest, r); setResults(loadResults(candidateId)); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu
        </Button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate">Testet e autoshkollës</h1>
          <p className="text-xs text-muted-foreground">10 teste · {QUESTIONS_PER_TEST} pyetje · kalueshmëria {PASS_THRESHOLD}%</p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: TEST_COUNT }).map((_, i) => {
            const r = results[i];
            return (
              <Card key={i} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <p className="font-semibold">Testi {i + 1}</p>
                  </div>
                  {r ? (
                    <p className={`text-xs mt-1 ${r.passed ? "text-emerald-600" : "text-destructive"}`}>
                      Rezultati: {r.score}/{r.total} ({Math.round((r.score / r.total) * 100)}%) · {r.passed ? "Kaluar" : "Dështuar"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Ende i pa-bërë</p>
                  )}
                </div>
                <Button size="sm" onClick={() => setActiveTest(i)} className="shrink-0 gap-2">
                  {r ? <><RotateCcw className="w-4 h-4" /> Provo sërish</> : <>Fillo</>}
                </Button>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function TestRunner({ testIndex, onExit, onFinish }: { testIndex: number; onExit: () => void; onFinish: (r: Result) => void }) {
  const questions = useMemo(() => getTestQuestions(testIndex), [testIndex]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => questions.reduce((s, q) => s + (answers[q.id] === q.correctKey ? 1 : 0), 0), [questions, answers]);
  const total = questions.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD;

  const handleSubmit = () => {
    setSubmitted(true);
    onFinish({ score, total, passed, date: new Date().toISOString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold truncate">Testi {testIndex + 1}</h1>
          <p className="text-xs text-muted-foreground">{answeredCount}/{total} të përgjigjura</p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3">
        {submitted && (
          <Card className={`p-4 border-2 ${passed ? "border-emerald-500" : "border-destructive"}`}>
            <div className="flex items-center gap-3">
              <Trophy className={`w-8 h-8 ${passed ? "text-emerald-500" : "text-destructive"}`} />
              <div>
                <p className="text-lg font-bold">{score}/{total} pikë ({pct}%)</p>
                <p className={`text-sm ${passed ? "text-emerald-600" : "text-destructive"}`}>
                  {passed ? "Urime! Ke kaluar testin." : `Nuk e kalove. Duhen ${PASS_THRESHOLD}% për kalim.`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {questions.map((q, idx) => {
          const userKey = answers[q.id];
          return (
            <Card key={q.id} className="p-4">
              <p className="text-sm font-medium mb-3">
                <span className="text-muted-foreground mr-2">{idx + 1}.</span>{q.text}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = userKey === opt.key;
                  const isCorrect = opt.key === q.correctKey;
                  let cls = "border-border";
                  if (submitted) {
                    if (isCorrect) cls = "border-emerald-500 bg-emerald-500/10";
                    else if (selected && !isCorrect) cls = "border-destructive bg-destructive/10";
                  } else if (selected) {
                    cls = "border-primary bg-primary/10";
                  }
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.key }))}
                      className={`w-full text-left px-3 py-2 rounded-md border-2 text-sm transition-colors ${cls} disabled:cursor-default`}
                    >
                      <span className="font-semibold mr-2">{opt.key}.</span>{opt.text}
                      {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 inline-block ml-2 text-emerald-600" />}
                      {submitted && selected && !isCorrect && <XCircle className="w-4 h-4 inline-block ml-2 text-destructive" />}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {!submitted ? (
          <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border p-3 -mx-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <p className="text-xs text-muted-foreground flex-1">{answeredCount}/{total} të përgjigjura</p>
              <Button onClick={handleSubmit} disabled={answeredCount === 0}>Përfundo testin</Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExit} className="flex-1">Kthehu te lista</Button>
            <Button onClick={() => { setAnswers({}); setSubmitted(false); window.scrollTo({ top: 0 }); }} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" /> Provo sërish
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
