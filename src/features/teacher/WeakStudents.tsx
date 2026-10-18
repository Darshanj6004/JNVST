import { useNavigate } from "react-router";
import { ArrowUpRight, TrendingDown, TriangleAlert } from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, ProgressBar, Table, TH, THead, TR, TD } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { students } from "@/data/users";

type SA = (typeof students)[number] & { _accuracy: number };

export default function WeakStudents() {
  const navigate = useNavigate();
  const weak = (students as SA[])
    .filter((s) => s._accuracy < 60 && s.status === "active")
    .sort((a, b) => a._accuracy - b._accuracy);

  const weakTopics = ["Fractions", "Geometry", "Grammar", "Coding–Decoding"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weak students"
        description="Students below 60% accuracy who may need extra support."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-danger-soft)] text-danger">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-ink tabular">{weak.length}</p>
              <p className="text-[13px] text-muted">Need attention</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-warning-soft)] text-warning">
              <TrendingDown className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-ink tabular">4</p>
              <p className="text-[13px] text-muted">Declining trend</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-[13px] text-muted">Common weak topics</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {weakTopics.map((t) => (
                <Badge key={t} tone="danger">
                  {t}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <Table>
          <THead>
            <tr>
              <TH>Student</TH>
              <TH>Class</TH>
              <TH>Accuracy</TH>
              <TH>Weakest topic</TH>
              <TH>Trend</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </THead>
          <tbody>
            {weak.map((s, i) => (
              <TR key={s.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} color={s.avatarColor} size={36} />
                    <div>
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-muted">Roll {s.rollNo}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-muted">{s.className}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={s._accuracy} tone="danger" className="w-24" />
                    <span className="tabular font-medium text-danger">{s._accuracy}%</span>
                  </div>
                </TD>
                <TD className="text-muted">{weakTopics[i % weakTopics.length]}</TD>
                <TD>
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-danger">
                    <TrendingDown className="size-3.5" /> -{(i % 3) + 2}%
                  </span>
                </TD>
                <TD>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate("/teacher/mock-tests/new")}
                      rightIcon={<ArrowUpRight className="size-3.5" />}
                    >
                      Assign practice
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
