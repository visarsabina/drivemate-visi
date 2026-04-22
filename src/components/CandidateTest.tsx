import { useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, FileText, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { testQuestions, TestQuestion } from "@/data/testQuestions";

interface CandidateTestProps {
  candidates: Candidate[];
}

const POINTS_PER_QUESTION = 4;
const PASS_PERCENTAGE = 0.9; // 90% — standardi zyrtar i Kosovës
const QUESTIONS_PER_TEST = 30;

const formatDateNow = () => {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")}.${String(n.getMonth() + 1).padStart(2, "0")}.${n.getFullYear()}`;
};

const getPoints = (q: TestQuestion) => q.points ?? POINTS_PER_QUESTION;

const printOfficialTest = (
  candidate: Candidate,
  questions: TestQuestion[],
  answers: Record<number, number>,
  earnedPoints: number,
  totalPoints: number,
  passed: boolean,
) => {
  const win = window.open("", "_blank");
  if (!win) return;

  const percentage = ((earnedPoints / totalPoints) * 100).toFixed(1);
  const passThresholdPoints = Math.ceil(totalPoints * PASS_PERCENTAGE);

  const rows = questions
    .map((q, i) => {
      const userIdx = answers[q.id];
      const correct = userIdx === q.correctIndex;
      const userAnswer = userIdx !== undefined ? q.options[userIdx] : "—";
      const correctAnswer = q.options[q.correctIndex];
      const points = getPoints(q);
      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td class="q">${q.question}</td>
          <td class="ua ${correct ? "ok" : "bad"}">${userAnswer}</td>
          <td class="ca">${correctAnswer}</td>
          <td class="pts">${correct ? points : 0}/${points}</td>
          <td class="mark">${correct ? "✓" : "✗"}</td>
        </tr>`;
    })
    .join("");

  win.document.write(`<!DOCTYPE html><html><head><title>Test Teorik - ${candidate.emri} ${candidate.mbiemri}</title>
    <style>
      @page{size:A4 portrait;margin:10mm 12mm}
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:11px;color:#000}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px}
      .header h1{margin:0;font-size:18px;letter-spacing:1px}
      .header h2{margin:4px 0 0;font-size:13px;font-weight:normal}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:10px;font-size:11px}
      .info div{padding:3px 0;border-bottom:1px dotted #999}
      .info strong{display:inline-block;min-width:130px}
      .result-box{border:2px solid #000;padding:8px 12px;margin:10px 0;display:flex;justify-content:space-between;align-items:center;font-size:12px;flex-wrap:wrap;gap:8px}
      .result-box .pass{color:#0a7d0a;font-weight:bold;font-size:16px}
      .result-box .fail{color:#c00;font-weight:bold;font-size:16px}
      h3{margin:10px 0 6px;font-size:13px;border-bottom:1px solid #000;padding-bottom:3px}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th,td{border:1px solid #555;padding:4px 5px;text-align:left;vertical-align:top}
      th{background:#e8e8e8;font-weight:bold;font-size:10px}
      td.num{width:24px;text-align:center;font-weight:bold}
      td.q{width:38%}
      td.ua,td.ca{width:22%}
      td.pts{width:42px;text-align:center;font-weight:bold}
      td.mark{width:22px;text-align:center;font-weight:bold;font-size:13px}
      td.ok{background:#e8f5e8}
      td.bad{background:#fde8e8;text-decoration:line-through}
      .signatures{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:30px}
      .sig{text-align:center;font-size:11px}
      .sig .line{border-top:1px solid #000;margin-top:30px;padding-top:3px}
      .footer{margin-top:14px;text-align:center;font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:5px}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="header">
      <h1>AUTO SHKOLLA VISI</h1>
      <h2>FLETA E TESTIT TEORIK — Kategoria ${candidate.kategoria}</h2>
    </div>

    <div class="info">
      <div><strong>Emri dhe Mbiemri:</strong> ${candidate.emri} ${candidate.mbiemri}</div>
      <div><strong>Nr. Personal:</strong> ${candidate.numriPersonal}</div>
      <div><strong>Nr. Regjistrimit:</strong> ${candidate.numriRegjistrimit}</div>
      <div><strong>Kategoria:</strong> ${candidate.kategoria}</div>
      <div><strong>Vendi:</strong> ${candidate.vendi}</div>
      <div><strong>Data e Testit:</strong> ${formatDateNow()}</div>
    </div>

    <div class="result-box">
      <div><strong>Pikët:</strong> ${earnedPoints} / ${totalPoints} &nbsp; (${percentage}%)</div>
      <div><strong>Kufiri për kalim:</strong> ${passThresholdPoints} pikë (${(PASS_PERCENTAGE * 100).toFixed(0)}%)</div>
      <div class="${passed ? "pass" : "fail"}">${passed ? "KALOI ✓" : "NUK KALOI ✗"}</div>
    </div>

    <h3>Përgjigjet e Dhëna</h3>
    <table>
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Pyetja</th>
          <th>Përgjigja e Dhënë</th>
          <th>Përgjigja e Saktë</th>
          <th>Pikë</th>
          <th>✓/✗</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="signatures">
      <div class="sig"><div class="line">Kandidati</div></div>
      <div class="sig"><div class="line">Ligjëruesi / Komisioni</div></div>
    </div>

    <div class="footer">Auto Shkolla Visi — Fletë zyrtare e testit teorik</div>

    <script>window.print();<\/script></body></html>`);
  win.document.close();
};

const CandidateTest = ({ candidates }: CandidateTestProps) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Zgjedh 30 pyetje (random nëse ka më shumë)
  const questions = useMemo<TestQuestion[]>(() => {
    if (!started) return [];
    const all = [...testQuestions];
    const target = Math.min(QUESTIONS_PER_TEST, all.length);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, target);
  }, [started]);

  const candidate = candidates.find((c) => c.id === selectedId);

  const totalPoints = questions.reduce((sum, q) => sum + getPoints(q), 0);
  const earnedPoints = questions.reduce(
    (sum, q) => sum + (answers[q.id] === q.correctIndex ? getPoints(q) : 0),
    0,
  );
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const passThresholdPoints = Math.ceil(totalPoints * PASS_PERCENTAGE);
  const passed = questions.length > 0 && earnedPoints >= passThresholdPoints;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  const handleStart = () => {
    if (!selectedId) return;
    setStarted(true);
    setSubmitted(false);
    setAnswers({});
  };

  const handleReset = () => {
    setStarted(false);
    setSubmitted(false);
    setAnswers({});
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  // Hapi 1 — zgjedhja e kandidatit
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Test Teorik i Auto-Shkollës</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Zgjedh kandidatin që do të bëjë testin. Sistemi do të zgjedhë automatikisht{" "}
            {Math.min(QUESTIONS_PER_TEST, testQuestions.length)} pyetje.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Standardi zyrtar i Kosovës: 4 pikë për pyetje • Kalon me ≥{(PASS_PERCENTAGE * 100).toFixed(0)}% të pikëve
          </p>

          <div className="space-y-2 max-w-md">
            <Label>Kandidati</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Zgjedh kandidatin..." />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emri} {c.mbiemri} — {c.numriRegjistrimit} ({c.kategoria})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="mt-6 gap-2" onClick={handleStart} disabled={!selectedId}>
            <FileText className="w-4 h-4" /> Fillo Testin
          </Button>
        </div>
      </div>
    );
  }

  // Hapi 3 — rezultati pas dorëzimit
  if (submitted && candidate) {
    const percentage = ((earnedPoints / totalPoints) * 100).toFixed(1);
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">Rezultati i Testit</h2>
              <p className="text-muted-foreground">
                {candidate.emri} {candidate.mbiemri} — Kategoria {candidate.kategoria}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-bold text-lg ${
                passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {passed ? "KALOI ✓" : "NUK KALOI ✗"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">
                {earnedPoints}/{totalPoints}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Pikë</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">{percentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">Përqindja</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold">
                {correctCount}/{questions.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Të sakta</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-muted-foreground">{passThresholdPoints}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Kufiri ({(PASS_PERCENTAGE * 100).toFixed(0)}%)
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              className="gap-2"
              onClick={() =>
                printOfficialTest(candidate, questions, answers, earnedPoints, totalPoints, passed)
              }
            >
              <Printer className="w-4 h-4" /> Printo Fletën Zyrtare
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" /> Test i Ri
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Përgjigjet</h3>
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userIdx = answers[q.id];
              const correct = userIdx === q.correctIndex;
              return (
                <div key={q.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {idx + 1}. {q.question}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({getPoints(q)} pikë)
                        </span>
                      </p>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt={q.question}
                          className="mt-2 max-h-48 rounded border border-border"
                        />
                      )}
                      <div className="mt-2 text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Përgjigja jote: </span>
                          <span
                            className={
                              correct ? "text-green-700 font-medium" : "text-destructive font-medium"
                            }
                          >
                            {userIdx !== undefined ? q.options[userIdx] : "Pa përgjigje"}
                          </span>
                        </div>
                        {!correct && (
                          <div>
                            <span className="text-muted-foreground">E sakta: </span>
                            <span className="text-green-700 font-medium">{q.options[q.correctIndex]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Hapi 2 — plotësimi i testit
  const answeredCount = Object.keys(answers).length;
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-4 sticky top-20 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold">
              {candidate?.emri} {candidate?.mbiemri}
            </p>
            <p className="text-xs text-muted-foreground">
              Kategoria: {candidate?.kategoria} • {answeredCount}/{questions.length} të përgjigjura • {totalPoints} pikë gjithsej
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Anulo
            </Button>
            <Button size="sm" disabled={!allAnswered} onClick={handleSubmit}>
              Dorëzo Testin
            </Button>
          </div>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="font-medium">
                <span className="text-primary mr-2">{idx + 1}.</span>
                {q.question}
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {getPoints(q)} pikë
              </span>
            </div>
            {q.imageUrl && (
              <img
                src={q.imageUrl}
                alt={q.question}
                className="mb-3 max-h-64 rounded-lg border border-border"
              />
            )}
            <RadioGroup
              value={answers[q.id]?.toString() ?? ""}
              onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v, 10) }))}
            >
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value={i.toString()} id={`q${q.id}-${i}`} />
                  <Label htmlFor={`q${q.id}-${i}`} className="cursor-pointer font-normal">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={handleReset}>
          Anulo
        </Button>
        <Button disabled={!allAnswered} onClick={handleSubmit} className="gap-2">
          <CheckCircle2 className="w-4 h-4" /> Dorëzo Testin
        </Button>
      </div>
    </div>
  );
};

export default CandidateTest;
