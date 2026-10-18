import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, Select, StatCard, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { AccuracyBars, ScoreTrend } from "@/charts";
import { scoreHistory, subjectAccuracy, topicPerformance } from "@/data/analytics";

const bandTone = { strong: "success", average: "warning", weak: "danger" } as const;

export default function Reports() {
  const [subject, setSubject] = useState("all");
  const [range, setRange] = useState("30");
  const rows = topicPerformance.filter((t) => subject === "all" || t.subject.toLowerCase().includes(subject));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Class-level and topic-wise performance analysis."
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>
            Export report
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <Filter className="size-4" /> Filters
          </span>
          <Select value={subject} onChange={(e) => setSubject(e.target.value)} className="min-w-40">
            <option value="all">All subjects</option>
            <option value="mental">Mental Ability</option>
            <option value="arithmetic">Arithmetic</option>
            <option value="language">Language</option>
          </Select>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="min-w-36">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </Select>
          <Select defaultValue="both" className="min-w-36">
            <option value="both">Practice & mock</option>
            <option value="mock">Mock only</option>
            <option value="practice">Practice only</option>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Class average" value="68%" trend={{ value: "+6%", up: true }} hint="vs last mock" accent="success" />
        <StatCard label="Tests conducted" value="12" hint="this term" accent="brand" />
        <StatCard label="Avg. attendance" value="93%" trend={{ value: "+2%", up: true }} accent="warning" />
        <StatCard label="Top score" value="92%" hint="Isha Deshmukh" accent="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Class average trend" />
          <CardBody>
            <ScoreTrend data={scoreHistory} height={260} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Subject accuracy" />
          <CardBody>
            <AccuracyBars data={subjectAccuracy.map((s) => ({ label: s.subject.split(" ")[0], value: s.accuracy }))} height={260} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Topic-wise accuracy" subtitle="Across the whole class" />
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
            {rows.map((t) => (
              <TR key={t.topicId}>
                <TD className="font-medium">{t.topic}</TD>
                <TD className="text-muted">{t.subject}</TD>
                <TD className="tabular text-muted">{t.attempted}</TD>
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
