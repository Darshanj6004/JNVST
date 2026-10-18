import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Download,
  Inbox,
  LogOut,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Dropdown,
  EmptyState,
  Field,
  Input,
  MenuItem,
  Modal,
  Pagination,
  ProgressBar,
  Radio,
  SearchInput,
  Select,
  Skeleton,
  Spinner,
  StatCard,
  Table,
  Tabs,
  TD,
  TH,
  THead,
  Textarea,
  Tooltip,
  TR,
  useToast,
} from "@/ui";

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center">
      <span className="w-32 shrink-0 text-[13px] font-medium text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const swatches = [
  { name: "Primary", token: "bg-brand-500", hex: "#2563EB" },
  { name: "Ink", token: "bg-ink", hex: "#0F172A" },
  { name: "Muted", token: "bg-muted", hex: "#64748B" },
  { name: "Canvas", token: "bg-canvas border border-line", hex: "#F8FAFC" },
  { name: "Line", token: "bg-line", hex: "#E5E7EB" },
  { name: "Success", token: "bg-success", hex: "#16A34A" },
  { name: "Warning", token: "bg-warning", hex: "#D97706" },
  { name: "Danger", token: "bg-danger", hex: "#DC2626" },
];

const nav = [
  ["foundations", "Foundations"],
  ["buttons", "Buttons"],
  ["inputs", "Inputs & forms"],
  ["data", "Data display"],
  ["feedback", "Feedback"],
];

export default function ShowcasePage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(2);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("medium");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="mb-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
              <ArrowLeft className="size-3.5" /> Back home
            </Link>
            <h1 className="text-xl font-semibold text-ink">Design system</h1>
          </div>
          <Badge tone="brand" dot>
            Navodaya UI · v1
          </Badge>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1120px] gap-10 px-6 py-10">
        <nav className="sticky top-24 hidden h-fit w-40 shrink-0 space-y-1 lg:block">
          {nav.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="block rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-slate-100 hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-14">
          <Section id="foundations" title="Foundations" description="Color tokens, typography scale and elevation.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader title="Color" />
                <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {swatches.map((s) => (
                    <div key={s.name}>
                      <div className={`h-14 rounded-xl ${s.token}`} />
                      <p className="mt-1.5 text-[13px] font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-muted tabular">{s.hex}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Typography" subtitle="Inter" />
                <CardBody className="space-y-2">
                  <p className="text-2xl font-semibold text-ink">Display · 24/600</p>
                  <p className="text-lg font-semibold text-ink">Heading · 18/600</p>
                  <p className="text-sm text-ink">Body · 14/400 — the quick brown fox.</p>
                  <p className="text-[13px] text-muted">Caption · 13/400 muted.</p>
                  <p className="tabular text-sm text-ink">Tabular · 1,234.56</p>
                </CardBody>
              </Card>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(["shadow-xs", "shadow-sm", "shadow-md"] as const).map((sh) => (
                <div key={sh} className={`rounded-2xl bg-surface p-5 ${sh}`}>
                  <p className="text-[13px] font-medium text-ink">{sh}</p>
                  <p className="text-xs text-muted">Elevation token</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="buttons" title="Buttons" description="Variants, sizes and states.">
            <Card>
              <CardBody className="divide-y divide-line py-0">
                <Row label="Variants">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                </Row>
                <Row label="Sizes">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </Row>
                <Row label="With icons">
                  <Button leftIcon={<Plus className="size-4" />}>New question</Button>
                  <Button variant="secondary" rightIcon={<Download className="size-4" />}>
                    Export
                  </Button>
                </Row>
                <Row label="States">
                  <Button loading>Saving</Button>
                  <Button disabled>Disabled</Button>
                </Row>
              </CardBody>
            </Card>
          </Section>

          <Section id="inputs" title="Inputs & forms" description="Fields, selects, search and choice controls.">
            <Card>
              <CardBody className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" hint="required">
                  <Input placeholder="Isha Deshmukh" />
                </Field>
                <Field label="Username">
                  <Input leftIcon={<Search className="size-4" />} placeholder="Search…" />
                </Field>
                <Field label="Roll number" error="This roll number already exists.">
                  <Input defaultValue="A-14" invalid />
                </Field>
                <Field label="Class">
                  <Select defaultValue="4a">
                    <option value="4a">4th A</option>
                    <option value="4b">4th B</option>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Search bar">
                    <SearchInput placeholder="Search students, questions…" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <Textarea rows={3} placeholder="Add a note…" />
                  </Field>
                </div>
                <div className="space-y-3">
                  <p className="text-[13px] font-medium text-ink">Checkbox</p>
                  <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} label="Enable weak-student alerts" />
                  <Checkbox disabled label="Disabled option" />
                </div>
                <div className="space-y-3">
                  <p className="text-[13px] font-medium text-ink">Radio · difficulty</p>
                  {["easy", "medium", "hard"].map((d) => (
                    <Radio key={d} name="diff" checked={radio === d} onChange={() => setRadio(d)} label={d[0].toUpperCase() + d.slice(1)} />
                  ))}
                </div>
              </CardBody>
            </Card>
          </Section>

          <Section id="data" title="Data display" description="Badges, cards, stats, tables and pagination.">
            <div className="space-y-4">
              <Card>
                <CardBody className="flex flex-wrap items-center gap-2.5">
                  <Badge>Neutral</Badge>
                  <Badge tone="brand">Brand</Badge>
                  <Badge tone="success">Strong</Badge>
                  <Badge tone="warning">Average</Badge>
                  <Badge tone="danger">Weak</Badge>
                  <Badge tone="info">Scheduled</Badge>
                  <Badge tone="success" dot>
                    Live
                  </Badge>
                  <Avatar name="Isha Deshmukh" color="#2563EB" />
                  <Tooltip label="View profile">
                    <Button variant="secondary" size="sm">
                      Hover me
                    </Button>
                  </Tooltip>
                  <Dropdown
                    trigger={
                      <Button variant="secondary" size="sm" rightIcon={<ChevronDown className="size-3.5" />}>
                        Menu
                      </Button>
                    }
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<Settings2 className="size-4" />} onClick={close}>
                          Settings
                        </MenuItem>
                        <MenuItem icon={<Bell className="size-4" />} onClick={close}>
                          Notifications
                        </MenuItem>
                        <MenuItem icon={<LogOut className="size-4" />} danger onClick={close}>
                          Log out
                        </MenuItem>
                      </>
                    )}
                  </Dropdown>
                </CardBody>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total students" value="30" trend={{ value: "+4", up: true }} accent="brand" />
                <StatCard label="Class average" value="68%" trend={{ value: "-2%", up: false }} accent="warning" />
                <StatCard label="Active tests" value="3" hint="this week" accent="success" />
              </div>

              <Card>
                <CardHeader title="Progress bars" />
                <CardBody className="space-y-3">
                  <ProgressBar value={82} tone="success" />
                  <ProgressBar value={54} tone="warning" />
                  <ProgressBar value={28} tone="danger" />
                </CardBody>
              </Card>

              <Card>
                <Table>
                  <THead>
                    <tr>
                      <TH>Student</TH>
                      <TH>Class</TH>
                      <TH>Accuracy</TH>
                      <TH className="text-right">Action</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {[
                      ["Isha Deshmukh", "4th A", 88],
                      ["Rohan Patil", "4th B", 61],
                      ["Sara Kulkarni", "4th A", 42],
                    ].map(([n, c, a]) => (
                      <TR key={n as string}>
                        <TD>
                          <div className="flex items-center gap-3">
                            <Avatar name={n as string} size={32} />
                            <span className="font-medium text-ink">{n}</span>
                          </div>
                        </TD>
                        <TD className="text-muted">{c}</TD>
                        <TD>
                          <Badge tone={(a as number) >= 75 ? "success" : (a as number) >= 50 ? "warning" : "danger"}>{a}%</Badge>
                        </TD>
                        <TD>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="size-3.5" />}>
                              Remove
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
                <div className="border-t border-line px-4 py-3">
                  <Pagination page={page} pageCount={6} onChange={setPage} />
                </div>
              </Card>

              <Tabs
                items={[
                  { id: "all", label: "All", count: 30 },
                  { id: "strong", label: "Strong", count: 12 },
                  { id: "weak", label: "Weak", count: 5 },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
          </Section>

          <Section id="feedback" title="Feedback" description="Toasts, modals, loading and empty states.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Toasts & modals" />
                <CardBody className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => toast({ type: "success", title: "Saved", message: "Question added to the bank." })}>
                    Success toast
                  </Button>
                  <Button variant="secondary" onClick={() => toast({ type: "error", title: "Failed", message: "Could not reach the server." })}>
                    Error toast
                  </Button>
                  <Button variant="secondary" onClick={() => toast({ type: "warning", title: "Heads up", message: "3 rows have missing answers." })}>
                    Warning toast
                  </Button>
                  <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Loading" />
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span className="text-sm text-muted">Loading questions…</span>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </CardBody>
              </Card>
              <Card className="lg:col-span-2">
                <EmptyState
                  icon={<Inbox className="size-6" />}
                  title="No questions yet"
                  description="Add your first question or import a set from Excel to get started."
                  action={<Button leftIcon={<Plus className="size-4" />}>Add question</Button>}
                />
              </Card>
            </div>
          </Section>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete question?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast({ type: "success", title: "Deleted", message: "The question was removed from the bank." });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This action cannot be undone. The question will be permanently removed from the question bank and any linked practice sets.
        </p>
      </Modal>
    </div>
  );
}
