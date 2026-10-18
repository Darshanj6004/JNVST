import { Crown, Download, Medal } from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { students } from "@/data/users";

type SA = (typeof students)[number] & { _accuracy: number };

export default function MeritList() {
  const ranked = (students as SA[])
    .filter((s) => s.status === "active")
    .map((s) => ({ ...s, score: Math.round((s._accuracy / 100) * 100) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const medals = ["#f59e0b", "#94a3b8", "#b45309"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merit list"
        description="Class ranking from the latest JNVST full mock — downloadable for students and faculty."
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>
            Download PDF
          </Button>
        }
      />

      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.map((s, i) => (
          <Card key={s.id} className={i === 0 ? "sm:-translate-y-2 sm:order-2 ring-1 ring-amber-200" : i === 1 ? "sm:order-1" : "sm:order-3"}>
            <CardBody className="flex flex-col items-center py-6 text-center">
              <div className="relative">
                <Avatar name={s.name} color={s.avatarColor} size={64} />
                <span
                  className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full text-white ring-2 ring-white"
                  style={{ backgroundColor: medals[i] }}
                >
                  {i === 0 ? <Crown className="size-4" /> : <Medal className="size-4" />}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{s.name}</p>
              <p className="text-xs text-muted">Roll {s.rollNo} · {s.className}</p>
              <p className="mt-2 text-2xl font-semibold text-ink tabular">{s.score}</p>
              <Badge tone={i === 0 ? "warning" : "neutral"} className="mt-1">
                Rank {i + 1}
              </Badge>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <THead>
            <tr>
              <TH className="w-16">Rank</TH>
              <TH>Student</TH>
              <TH>Class</TH>
              <TH>Score</TH>
              <TH>Percentage</TH>
            </tr>
          </THead>
          <tbody>
            {rest.map((s, i) => (
              <TR key={s.id}>
                <TD>
                  <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-600 tabular">
                    {i + 4}
                  </span>
                </TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} color={s.avatarColor} size={32} />
                    <span className="font-medium text-ink">{s.name}</span>
                  </div>
                </TD>
                <TD className="text-muted">{s.className}</TD>
                <TD className="tabular font-medium text-ink">{s.score}/100</TD>
                <TD>
                  <Badge tone={s.score >= 75 ? "success" : s.score >= 50 ? "warning" : "danger"}>{s.score}%</Badge>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
