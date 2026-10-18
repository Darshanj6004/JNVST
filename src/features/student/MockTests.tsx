import { useState } from "react";
import { Link } from "react-router";
import { CalendarClock, ChevronRight, Clock, FileText } from "lucide-react";
import type { MockStatus } from "@/types";
import { Badge, Button, Card, CardBody, Tabs, type TabItem } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { mockTests } from "@/data/mockTests";
import { formatDateTime } from "@/lib/format";

const statusMeta: Record<MockStatus, { tone: "brand" | "success" | "neutral" | "danger"; label: string }> = {
  upcoming: { tone: "brand", label: "Upcoming" },
  live: { tone: "success", label: "Live now" },
  completed: { tone: "neutral", label: "Completed" },
  missed: { tone: "danger", label: "Missed" },
};

export default function MockTests() {
  const [tab, setTab] = useState("all");
  const tabs: TabItem[] = [
    { id: "all", label: "All", count: mockTests.length },
    { id: "live", label: "Available", count: mockTests.filter((m) => m.status === "live" || m.status === "upcoming").length },
    { id: "completed", label: "Completed", count: mockTests.filter((m) => m.status === "completed").length },
  ];

  const filtered = mockTests.filter((m) => {
    if (tab === "all") return true;
    if (tab === "live") return m.status === "live" || m.status === "upcoming";
    return m.status === "completed";
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mock tests" description="Timed simulations that mirror the official JNVST pattern." />
      <Tabs items={tabs} value={tab} onChange={setTab} />

      <div className="grid gap-4">
        {filtered.map((m) => {
          const meta = statusMeta[m.status];
          const canStart = m.status === "live";
          const done = m.status === "completed";
          return (
            <Card key={m.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <FileText className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink">{m.title}</h3>
                      <Badge tone={meta.tone} dot={m.status === "live"}>
                        {meta.label}
                      </Badge>
                      <Badge tone="neutral">{m.pattern}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <FileText className="size-3.5" /> {m.totalQuestions} Q · {m.totalMarks} marks
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> {m.durationMin} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" /> {formatDateTime(m.scheduledFor)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  {done && (
                    <span className="text-sm font-semibold text-ink tabular">
                      {m.score}/{m.totalMarks}
                    </span>
                  )}
                  {done ? (
                    <Link to={`/student/result/${m.id}`}>
                      <Button variant="secondary" rightIcon={<ChevronRight className="size-4" />}>
                        View result
                      </Button>
                    </Link>
                  ) : canStart ? (
                    <Link to={`/student/mock-tests/${m.id}/instructions`}>
                      <Button rightIcon={<ChevronRight className="size-4" />}>Start test</Button>
                    </Link>
                  ) : m.status === "upcoming" ? (
                    <Button variant="secondary" disabled>
                      Not started
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      Missed
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
