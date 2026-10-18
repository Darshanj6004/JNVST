import { Badge, Card, CardBody, CardHeader, ProgressBar, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, BandDonut, ScoreTrend } from "@/charts";
import { scoreHistory, subjectAccuracy, topicPerformance } from "@/data/analytics";

const bandTone = { strong: "success", average: "warning", weak: "danger" } as const;

export default function Progress() {
  const bands = {
    strong: topicPerformance.filter((t) => t.band === "strong").length,
    average: topicPerformance.filter((t) => t.band === "average").length,
    weak: topicPerformance.filter((t) => t.band === "weak").length,
  };
  const donut = [
    { name: "Strong", value: bands.strong, key: "strong" },
    { name: "Average", value: bands.average, key: "average" },
    { name: "Weak", value: bands.weak, key: "weak" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Progress analytics" description="Track your improvement and spot topics to focus on." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Overall accuracy", "72%"],
          ["Tests taken", "12"],
          ["Best score", "85%"],
          ["Practice streak", "5 days"],
        ].map(([l, v]) => (
          <Card key={l}>
            <CardBody>
              <p className="text-[13px] text-muted">{l}</p>
              <p className="mt-2 text-2xl font-semibold text-ink tabular">{v}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Score trend" subtitle="Mock score vs class average over time" />
          <CardBody>
            <ScoreTrend data={scoreHistory} height={260} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Topic bands" subtitle="Distribution across all topics" />
          <CardBody className="flex flex-col items-center">
            <div className="relative">
              <BandDonut data={donut} />
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              {donut.map((d) => (
                <div key={d.key} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-ink">
                    <span
                      className="size-3 rounded"
                      style={{ backgroundColor: d.key === "strong" ? "#16a34a" : d.key === "average" ? "#d97706" : "#dc2626" }}
                    />
                    {d.name}
                  </span>
                  <span className="font-medium text-muted tabular">{d.value} topics</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Accuracy by subject" />
        <CardBody className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <AccuracyBars data={subjectAccuracy.map((s) => ({ label: s.subject, value: s.accuracy }))} />
          <div className="space-y-4">
            {subjectAccuracy.map((s) => (
              <div key={s.subject}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-ink">{s.subject}</span>
                  <span className="text-muted tabular">
                    {s.accuracy}% · {s.attempted} attempted
                  </span>
                </div>
                <ProgressBar value={s.accuracy} />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Topic-wise performance" subtitle="Strong, average and weak topics by accuracy" />
        <Table>
          <THead>
            <tr>
              <TH>Topic</TH>
              <TH>Subject</TH>
              <TH>Attempted</TH>
              <TH>Accuracy</TH>
              <TH>Band</TH>
            </tr>
          </THead>
          <tbody>
            {topicPerformance.map((t) => (
              <TR key={t.topicId}>
                <TD className="font-medium">{t.topic}</TD>
                <TD className="text-muted">{t.subject}</TD>
                <TD className="tabular">{t.attempted}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={t.accuracy} tone={bandTone[t.band]} className="w-24" />
                    <span className="tabular text-muted">{t.accuracy}%</span>
                  </div>
                </TD>
                <TD>
                  <Badge tone={bandTone[t.band]}>{t.band[0].toUpperCase() + t.band.slice(1)}</Badge>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
