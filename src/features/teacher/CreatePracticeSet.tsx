import { useState } from "react";
import { useNavigate } from "react-router";
import { Layers, Save } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Checkbox, Field, Input, Select, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { difficulties, subjects } from "@/data/subjects";

export default function CreatePracticeSet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0].id);
  const [difficulty, setDifficulty] = useState("combined");
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Create practice set" description="Configure a reusable set of questions for students to practise." />

      <Card>
        <CardHeader title="Set configuration" />
        <CardBody className="space-y-4">
          <Field label="Practice set name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Series & Analogy Warm-up" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Subject">
              <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSelected([]); }}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.short}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {difficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Number of questions">
              <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={5} max={50} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Topics" subtitle={selected.length ? `${selected.length} selected` : "Leave empty to include all topics"} />
        <CardBody className="grid gap-2.5 sm:grid-cols-2">
          {topics.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                selected.includes(t.id) ? "border-brand-300 bg-brand-50/40" : "border-line hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <Checkbox label={t.name} checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
              </div>
              <span className="text-xs text-muted tabular">{t.questionCount} Q</span>
            </label>
          ))}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between rounded-2xl bg-white border border-line p-4">
        <div className="flex items-center gap-3 text-sm">
          <Layers className="size-5 text-brand-500" />
          <span className="text-muted">
            <strong className="text-ink tabular">{count}</strong> questions ·{" "}
            <strong className="text-ink">{difficulties.find((d) => d.id === difficulty)?.name}</strong> ·{" "}
            {selected.length ? `${selected.length} topics` : "all topics"}
          </span>
        </div>
        <Button
          onClick={() => {
            toast({ type: "success", title: "Practice set created", message: `"${name || "Untitled set"}" is ready to assign.` });
            navigate("/teacher/dashboard");
          }}
          leftIcon={<Save className="size-4" />}
        >
          Create set
        </Button>
      </div>
    </div>
  );
}
