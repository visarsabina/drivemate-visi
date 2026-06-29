import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList, Trophy, RotateCcw, Pencil, Loader2 } from "lucide-react";
import builtinBank from "@/data/questionBank.json";
import bankC from "@/data/questionBankC.json";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const OPTION_KEYS = ["A", "B", "C", "D", "E"];
const PASS_THRESHOLD = 85; // percent
const OVERRIDE_BUCKET = "question-images";

type RawQ = { id: string; text: string; options: string[]; correctIndex: number; image?: string | null; points?: number };
type Q = {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  image?: string | null;
  points: number;
};

function isTrueFalse(raw: RawQ): boolean {
  if (raw.options.length !== 2) return false;
  return raw.options.some((o) => /sakt[ëe]/i.test(o));
}

const RAW_VALID: RawQ[] = (builtinBank as RawQ[]).filter((q) => {
  const opts = q.options.map((o) => (o || "").replace(/\s+/g, " ").trim()).filter((o) => o.length > 0 && o.length < 240);
  const txt = (q.text || "").replace(/\s+/g, " ").trim();
  if (!txt) return false;
  if (opts.length < 2 || opts.length > OPTION_KEYS.length) return false;
  if (q.correctIndex < 0 || q.correctIndex >= opts.length) return false;
  return true;
});

function toQ(raw: RawQ): Q {
  const opts = raw.options.map((o) => (o || "").replace(/\s+/g, " ").trim()).filter((o) => o.length > 0 && o.length < 400);
  return {
    id: raw.id,
    text: (raw.text || "").replace(/\s+/g, " ").trim(),
    options: opts.map((t, i) => ({ key: OPTION_KEYS[i], text: t })),
    correctKey: OPTION_KEYS[raw.correctIndex],
    image: raw.image ?? null,
    points: raw.points ?? 1,
  };
}

// Categorized pools (raw)
const hasImg = (q: RawQ) => !!q.image;
const tLower = (q: RawQ) => (q.text || "").toLowerCase();
const isSign = (q: RawQ) => /shenj/i.test(q.text || "");
const isIntersection = (q: RawQ) => /udh[ëe]kryq|kryq[ëe]zim/i.test(q.text || "");
const isSituation = (q: RawQ) => /situat/i.test(q.text || "");
const isSemafor = (q: RawQ) => /semafor/i.test(q.text || "");
const isFigure = (q: RawQ) => /figur/i.test(q.text || "");

const POOLS = {
  // 5 — image situation A/B/C
  situationAbc: RAW_VALID.filter((q) => hasImg(q) && !isTrueFalse(q) && q.options.length === 3 && isSituation(q)),
  // 8 — image traffic sign true/false
  signTF: RAW_VALID.filter((q) => hasImg(q) && isTrueFalse(q) && isSign(q)),
  // 3 — image intersection drawings
  intersection: RAW_VALID.filter((q) => hasImg(q) && isIntersection(q)),
  // 1 — image with 3 signs A/B/C
  signAbc: RAW_VALID.filter((q) => hasImg(q) && !isTrueFalse(q) && q.options.length === 3 && isSign(q)),
  // 5 — image situation true/false
  situationTF: RAW_VALID.filter((q) => hasImg(q) && isTrueFalse(q) && isSituation(q)),
  // 1 — image semafor
  semafor: RAW_VALID.filter((q) => hasImg(q) && isSemafor(q)),
  // 2 — image figure
  figure: RAW_VALID.filter((q) => hasImg(q) && isFigure(q)),
  // 5 — no image
  noImage: RAW_VALID.filter((q) => !hasImg(q)),
};

const COMPOSITION: Array<{ key: keyof typeof POOLS; count: number }> = [
  { key: "situationAbc", count: 5 },
  { key: "signTF", count: 8 },
  { key: "intersection", count: 3 },
  { key: "signAbc", count: 1 },
  { key: "situationTF", count: 5 },
  { key: "semafor", count: 1 },
  { key: "figure", count: 2 },
  { key: "noImage", count: 5 },
];

const QUESTIONS_PER_TEST = COMPOSITION.reduce((s, c) => s + c.count, 0); // 30

// Deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFromPool(pool: RawQ[], count: number, seed: number, usedIds: Set<string>): RawQ[] {
  if (pool.length === 0) return [];
  const rnd = mulberry32(seed);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const picked: RawQ[] = [];
  for (const q of arr) {
    if (picked.length >= count) break;
    if (usedIds.has(q.id)) continue;
    picked.push(q);
    usedIds.add(q.id);
  }
  // Fallback: if pool too small (e.g. only 2 items but need 1 per test still fine), allow repeats
  let idx = 0;
  while (picked.length < count && arr.length > 0) {
    picked.push(arr[idx % arr.length]);
    idx++;
  }
  return picked;
}

function getTestQuestions(testIndex: number): Q[] {
  const usedIds = new Set<string>();
  const out: RawQ[] = [];
  COMPOSITION.forEach((c, i) => {
    const seed = testIndex * 1000003 + i * 7919 + 17;
    out.push(...pickFromPool(POOLS[c.key], c.count, seed, usedIds));
  });
  return out.map(toQ);
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
  category?: string;
  onClose: () => void;
}

// Category-specific test config
function getTestsForCategory(category?: string): { tests: Q[][]; imageDir: string } {
  const cat = (category || "B").toUpperCase();
  if (cat === "C") {
    const all = (bankC as RawQ[]).map(toQ);
    return { tests: [all], imageDir: "/literatura-c/" };
  }
  // Default (B and others): 20 generated tests from main bank
  const tests = Array.from({ length: 20 }).map((_, i) => getTestQuestions(i));
  return { tests, imageDir: "/literatura/" };
}

export default function CandidateTests({ candidateId, category, onClose }: Props) {
  const [activeTest, setActiveTest] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Result>>({});

  const { tests, imageDir } = useMemo(() => getTestsForCategory(category), [category]);
  const testCount = tests.length;

  useEffect(() => {
    setResults(loadResults(candidateId));
  }, [candidateId]);

  if (activeTest !== null) {
    return (
      <TestRunner
        testIndex={activeTest}
        questions={tests[activeTest]}
        imageDir={imageDir}
        onExit={() => {
          setActiveTest(null);
          setResults(loadResults(candidateId));
        }}
        onFinish={(r) => {
          saveResult(candidateId, activeTest, r);
          setResults(loadResults(candidateId));
        }}
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
          <p className="text-xs text-muted-foreground">
            {testCount} {testCount === 1 ? "test" : "teste"} · kalueshmëria {PASS_THRESHOLD}%
          </p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: testCount }).map((_, i) => {
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
                      Rezultati: {r.score}/{r.total} ({Math.round((r.score / r.total) * 100)}%) ·{" "}
                      {r.passed ? "Kaluar" : "Dështuar"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Ende i pa-bërë</p>
                  )}
                </div>
                <Button size="sm" onClick={() => setActiveTest(i)} className="shrink-0 gap-2">
                  {r ? (
                    <>
                      <RotateCcw className="w-4 h-4" /> Provo sërish
                    </>
                  ) : (
                    <>Fillo</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function TestRunner({
  testIndex,
  questions,
  imageDir,
  onExit,
  onFinish,
}: {
  testIndex: number;
  questions: Q[];
  imageDir: string;
  onExit: () => void;
  onFinish: (r: Result) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isSuperAdmin } = useIsSuperAdmin();

  // Load all override files from the bucket once (signed URLs since bucket is private)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from(OVERRIDE_BUCKET).list("", { limit: 1000 });
      if (error || !data || cancelled) return;
      const names = data.map((f) => f.name);
      if (names.length === 0) return;
      const { data: signed } = await supabase.storage.from(OVERRIDE_BUCKET).createSignedUrls(names, 60 * 60 * 8);
      if (cancelled || !signed) return;
      const map: Record<string, string> = {};
      signed.forEach((s) => {
        if (!s.path || !s.signedUrl) return;
        const base = s.path.replace(/\.[^.]+$/, "");
        map[base] = s.signedUrl;
      });
      setOverrides(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + q.points, 0), [questions]);
  const score = useMemo(
    () => questions.reduce((s, q) => s + (answers[q.id] === q.correctKey ? q.points : 0), 0),
    [questions, answers]
  );
  const total = totalPoints;
  const totalQ = questions.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD;

  const handleSubmit = () => {
    setSubmitted(true);
    onFinish({ score, total, passed, date: new Date().toISOString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[currentIdx];
  const userKey = q ? answers[q.id] : undefined;
  const isLast = currentIdx === totalQ - 1;
  const isFirst = currentIdx === 0;

  const handleUploadClick = () => {
    if (!q) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !q) return;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${q.id}.${ext}`;
    setUploadingId(q.id);
    try {
      const { data: existing } = await supabase.storage.from(OVERRIDE_BUCKET).list("", { limit: 1000 });
      const toRemove = (existing || [])
        .filter((f) => f.name.replace(/\.[^.]+$/, "") === q.id)
        .map((f) => f.name);
      if (toRemove.length) await supabase.storage.from(OVERRIDE_BUCKET).remove(toRemove);

      const { error } = await supabase.storage
        .from(OVERRIDE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from(OVERRIDE_BUCKET)
        .createSignedUrl(path, 60 * 60 * 8);
      if (signed?.signedUrl) {
        setOverrides((p) => ({ ...p, [q.id]: signed.signedUrl }));
      }
      toast({ title: "Fotoja u zëvendësua" });
    } catch (err: any) {
      toast({ title: "Gabim gjatë ngarkimit", description: err?.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const currentImageSrc = q ? overrides[q.id] || (q.image ? `${imageDir}${q.image}` : "") : "";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold truncate">Testi {testIndex + 1}</h1>
          <p className="text-xs text-muted-foreground">
            Pyetja {currentIdx + 1}/{totalQ} · {answeredCount} të përgjigjura · {total} pikë gjithsej
          </p>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-3 pb-24">
        {submitted && (
          <>
            <Card className={`p-4 border-2 ${passed ? "border-emerald-500" : "border-destructive"}`}>
              <div className="flex items-center gap-3">
                <Trophy className={`w-8 h-8 ${passed ? "text-emerald-500" : "text-destructive"}`} />
                <div>
                  <p className="text-lg font-bold">
                    {score}/{total} pikë ({pct}%)
                  </p>
                  <p className={`text-sm ${passed ? "text-emerald-600" : "text-destructive"}`}>
                    {passed ? "Urime! Ke kaluar testin." : `Nuk e kalove. Duhen ${PASS_THRESHOLD}% për kalim.`}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Shiko pyetjet — kliko numrin për t'u kthyer te pyetja
              </p>
              <div className="grid grid-cols-10 gap-1.5">
                {questions.map((qq, i) => {
                  const ua = answers[qq.id];
                  const status = !ua ? "skip" : ua === qq.correctKey ? "ok" : "bad";
                  const base = "h-8 rounded text-xs font-semibold border transition-colors";
                  const cls =
                    status === "ok"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-700"
                      : status === "bad"
                      ? "bg-destructive/15 border-destructive text-destructive"
                      : "bg-muted border-border text-muted-foreground";
                  const active = i === currentIdx ? "ring-2 ring-primary" : "";
                  return (
                    <button
                      key={qq.id}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`${base} ${cls} ${active}`}
                      title={status === "ok" ? "Saktë" : status === "bad" ? "Gabim" : "Pa përgjigje"}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" /> Saktë</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/30 border border-destructive" /> Gabim</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Pa përgjigje</span>
              </div>
            </Card>
          </>
        )}

        {q && (
          <Card className="p-4 flex flex-col" style={{ minHeight: "560px" }}>
            <div className="h-16 mb-3">
              <p className="text-sm font-medium line-clamp-3">
                <span className="text-muted-foreground mr-2">{currentIdx + 1}.</span>
                {q.text}
              </p>
            </div>
            <div className="h-64 mb-3 flex items-center justify-center bg-white rounded-md border border-border overflow-hidden p-2">
              {q.image ? (
                <img
                  src={`${imageDir}${q.image}`}
                  alt=""
                  className="h-full w-full object-contain"
                  style={{ objectPosition: "center" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Pa figurë</span>
              )}
            </div>
            <div className="space-y-2 mt-auto">
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
                    <span className="font-semibold mr-2">{opt.key}.</span>
                    {opt.text}
                    {submitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 inline-block ml-2 text-emerald-600" />
                    )}
                    {submitted && selected && !isCorrect && (
                      <XCircle className="w-4 h-4 inline-block ml-2 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm border-t border-border p-3 -mx-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Prapa
            </Button>
            <p className="text-xs text-muted-foreground flex-1 text-center">
              {currentIdx + 1}/{totalQ}
            </p>
            {!submitted && isLast ? (
              <Button onClick={handleSubmit} disabled={answeredCount === 0}>
                Përfundo
              </Button>
            ) : !submitted ? (
              <Button onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}>
                Para →
              </Button>
            ) : isLast ? (
              <Button
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  setCurrentIdx(0);
                  window.scrollTo({ top: 0 });
                }}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Provo sërish
              </Button>
            ) : (
              <Button onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}>
                Para →
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

