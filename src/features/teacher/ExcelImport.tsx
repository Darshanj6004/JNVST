import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Badge, Button, Card, CardBody, CardHeader, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/cn";

// ─── Subject code mapping ─────────────────────────────────────────────────────
const SUBJECT_MAP: Record<string, string> = {
  "mental ability": "mental_ability",
  "mental ability test": "mental_ability",
  "mat": "mental_ability",
  "arithmetic": "arithmetic",
  "arithmetic test": "arithmetic",
  "ari": "arithmetic",
  "language": "language",
  "language test": "language",
  "lan": "language",
};

// ─── Required columns ─────────────────────────────────────────────────────────
const REQUIRED = ["subject", "topic", "difficulty", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer"];

type ParsedRow = {
  row: number;
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  ok: boolean;
  errors: string[];
};

function validateRow(raw: Record<string, string>, rowNum: number): ParsedRow {
  const get = (key: string) => (raw[key] ?? "").trim();

  const subject = get("subject");
  const topic = get("topic");
  const difficulty = get("difficulty").toLowerCase();
  const question = get("question");
  const option_a = get("option_a");
  const option_b = get("option_b");
  const option_c = get("option_c");
  const option_d = get("option_d");
  const correct_answer = get("correct_answer").toUpperCase();
  const marks = parseFloat(get("marks") || "1.25");
  const explanation = get("explanation") || "";

  const errors: string[] = [];
  if (!SUBJECT_MAP[subject.toLowerCase()]) errors.push(`Unknown subject "${subject}"`);
  if (!topic) errors.push("Missing topic");
  if (!["easy", "medium", "hard"].includes(difficulty)) errors.push(`Invalid difficulty "${difficulty}"`);
  if (!question) errors.push("Missing question text");
  if (!option_a || !option_b || !option_c || !option_d) errors.push("All 4 options required");
  if (!["A", "B", "C", "D"].includes(correct_answer)) errors.push(`Correct answer must be A/B/C/D (got "${correct_answer}")`);
  if (isNaN(marks) || marks <= 0) errors.push("Invalid marks value");

  return {
    row: rowNum,
    subject,
    topic,
    difficulty,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    marks: isNaN(marks) ? 1.25 : marks,
    explanation,
    ok: errors.length === 0,
    errors,
  };
}

// ─── Template download ────────────────────────────────────────────────────────
function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["subject", "topic", "difficulty", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "marks", "explanation"],
    ["Mental Ability", "Analogy", "easy", "Hand is to Glove as Foot is to ?", "Sock", "Boot", "Shoe", "Hat", "C", "1.25", "A shoe covers the foot just as a glove covers the hand."],
    ["Arithmetic", "Number System", "easy", "What is the place value of 5 in 3456?", "5", "50", "500", "5000", "B", "1.25", "5 is in the tens place, so its value is 50."],
    ["Language", "Vocabulary", "medium", "Synonym of 'Happy'?", "Sad", "Joyful", "Angry", "Tired", "B", "1.25", "Joyful means feeling great happiness."],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "jnvst_questions_template.xlsx");
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExcelImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const valid = rows.filter((r) => r.ok);
  const invalid = rows.filter((r) => !r.ok);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      const parsed = raw.map((row, i) => validateRow(row, i + 2));
      setRows(parsed);
      setImportDone(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (valid.length === 0) return;
    setImporting(true);
    let successCount = 0;

    for (const row of valid) {
      const { error } = await supabase.rpc("upsert_question", {
        p_subject_code: SUBJECT_MAP[row.subject.toLowerCase()],
        p_topic_name: row.topic,
        p_difficulty: row.difficulty,
        p_question_text: row.question,
        p_option_a: row.option_a,
        p_option_b: row.option_b,
        p_option_c: row.option_c,
        p_option_d: row.option_d,
        p_correct_option: row.correct_answer,
        p_marks: row.marks,
        p_explanation: row.explanation || null,
        p_image_url: null,
        p_question_id: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (!error) successCount++;
    }

    setImporting(false);
    setImportedCount(successCount);
    setImportDone(true);

    toast({
      type: successCount > 0 ? "success" : "error",
      title: `${successCount} question${successCount !== 1 ? "s" : ""} imported`,
      message: successCount < valid.length
        ? `${valid.length - successCount} failed to save.`
        : "All questions are now in the bank.",
    });

    if (successCount > 0) {
      setTimeout(() => navigate("/teacher/questions"), 1500);
    }
  };

  const reset = () => {
    setFileName(null);
    setRows([]);
    setImportDone(false);
    setImportedCount(0);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/teacher/questions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to question bank
      </Link>

      <PageHeader
        title="Import questions"
        description="Bulk-upload questions from an Excel (.xlsx) file."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="size-4" />}
            onClick={downloadTemplate}
          >
            Download template
          </Button>
        }
      />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {!fileName ? (
        <Card>
          <CardBody>
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-canvas py-14 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <UploadCloud className="size-7" />
              </span>
              <span className="text-sm font-semibold text-ink">Click to upload or drag & drop</span>
              <span className="text-[13px] text-muted">.xlsx or .csv · Use the template above for correct column names</span>
            </button>
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-[13px] text-muted space-y-1">
              <p className="flex items-center gap-2 font-medium text-ink">
                <FileSpreadsheet className="size-4 text-brand-500" />
                Required columns:
              </p>
              <p className="font-mono text-[11px] leading-relaxed">
                subject · topic · difficulty · question · option_a · option_b · option_c · option_d · correct_answer
              </p>
              <p className="text-[11px]">
                Optional: <span className="font-mono">marks</span> (default 1.25), <span className="font-mono">explanation</span>
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* File info banner */}
          <Card>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{fileName}</p>
                  <p className="text-xs text-muted">{rows.length} rows detected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="success">{valid.length} valid</Badge>
                {invalid.length > 0 && (
                  <Badge tone="danger">{invalid.length} error{invalid.length > 1 ? "s" : ""}</Badge>
                )}
                <button onClick={reset} className="ml-1 text-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Preview table */}
          <Card>
            <CardHeader
              title="Validation preview"
              subtitle={invalid.length > 0 ? "Fix errors in your file, then re-upload" : "All rows are valid — ready to import"}
            />
            <Table>
              <THead>
                <tr>
                  <TH>Row</TH>
                  <TH>Subject</TH>
                  <TH>Topic</TH>
                  <TH>Level</TH>
                  <TH>Question</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <TR key={r.row} className={cn(!r.ok && "bg-red-50/40")}>
                    <TD className="tabular text-muted">{r.row}</TD>
                    <TD className={cn(!SUBJECT_MAP[r.subject.toLowerCase()] && "text-danger")}>{r.subject || "—"}</TD>
                    <TD className="text-muted">{r.topic || "—"}</TD>
                    <TD className="text-muted capitalize">{r.difficulty || "—"}</TD>
                    <TD className="max-w-[200px] truncate text-muted">{r.question}</TD>
                    <TD>
                      {r.ok ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                          <CheckCircle2 className="size-4" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger" title={r.errors.join("; ")}>
                          <AlertTriangle className="size-4" /> {r.errors[0]}
                        </span>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>
              Upload different file
            </Button>
            <Button
              disabled={valid.length === 0 || importing || importDone}
              onClick={handleImport}
              leftIcon={importing ? <Loader2 className="size-4 animate-spin" /> : undefined}
            >
              {importing
                ? "Importing…"
                : importDone
                  ? `✓ ${importedCount} imported`
                  : `Import ${valid.length} valid question${valid.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
