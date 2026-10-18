import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";

const preview = [
  { row: 2, subject: "Mental Ability", topic: "Series", diff: "Easy", q: "2, 4, 6, 8, __?", ok: true },
  { row: 3, subject: "Arithmetic", topic: "Multiplication", diff: "Easy", q: "12 × 8 = ?", ok: true },
  { row: 4, subject: "Arithmetic", topic: "Fractions", diff: "Medium", q: "Which fraction is largest?", ok: true },
  { row: 5, subject: "—", topic: "Analogy", diff: "Hard", q: "Hand : Glove :: Foot : ?", ok: false, error: "Missing subject" },
  { row: 6, subject: "Language", topic: "Vocabulary", diff: "Easy", q: "Synonym of Happy?", ok: true },
];

export default function ExcelImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploaded, setUploaded] = useState(false);
  const valid = preview.filter((p) => p.ok).length;
  const invalid = preview.length - valid;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/teacher/questions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to question bank
      </Link>

      <PageHeader
        title="Import questions"
        description="Bulk-upload questions from an Excel (.xlsx) or CSV file."
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>
            Download template
          </Button>
        }
      />

      {!uploaded ? (
        <Card>
          <CardBody>
            <button
              onClick={() => setUploaded(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-canvas py-14 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <UploadCloud className="size-7" />
              </span>
              <span className="text-sm font-semibold text-ink">Click to upload or drag & drop</span>
              <span className="text-[13px] text-muted">.xlsx or .csv up to 5 MB</span>
            </button>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-[13px] text-muted">
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0" />
              Columns: subject, topic, difficulty, question, option_a–d, correct_answer, marks, explanation. Data is
              validated before saving.
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-success-soft)] text-success">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">jnvst_questions_batch.xlsx</p>
                  <p className="text-xs text-muted">{preview.length} rows detected</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge tone="success">{valid} valid</Badge>
                {invalid > 0 && <Badge tone="danger">{invalid} error{invalid > 1 ? "s" : ""}</Badge>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Validation preview" subtitle="Fix highlighted rows before importing" />
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
                {preview.map((p) => (
                  <TR key={p.row} className={!p.ok ? "bg-red-50/40" : undefined}>
                    <TD className="tabular text-muted">{p.row}</TD>
                    <TD className={p.subject === "—" ? "text-danger" : "text-ink"}>{p.subject}</TD>
                    <TD className="text-muted">{p.topic}</TD>
                    <TD className="text-muted">{p.diff}</TD>
                    <TD className="max-w-[180px] truncate text-muted">{p.q}</TD>
                    <TD>
                      {p.ok ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                          <CheckCircle2 className="size-4" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger">
                          <AlertTriangle className="size-4" /> {p.error}
                        </span>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setUploaded(false)}>
              Upload different file
            </Button>
            <Button
              onClick={() => {
                toast({ type: "success", title: `${valid} questions imported`, message: `${invalid} invalid row skipped.` });
                navigate("/teacher/questions");
              }}
            >
              Import {valid} valid questions
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
