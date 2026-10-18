import { useState } from "react";
import { AlertTriangle, Bell, CheckCheck, FileText, Info, Trophy } from "lucide-react";
import type { Notification } from "@/types";
import { Button, Card, CardBody, EmptyState } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { notifications as seed } from "@/data/notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const meta = {
  test: { icon: FileText, cls: "bg-brand-50 text-brand-600" },
  result: { icon: Trophy, cls: "bg-[var(--color-warning-soft)] text-warning" },
  alert: { icon: AlertTriangle, cls: "bg-[var(--color-danger-soft)] text-danger" },
  info: { icon: Info, cls: "bg-slate-100 text-slate-500" },
} as const;

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>(seed);
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread updates` : "You're all caught up"}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="size-4" />}
            disabled={unread === 0}
            onClick={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
          >
            Mark all read
          </Button>
        }
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="size-6" />} title="No notifications" description="New updates will appear here." />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const m = meta[n.type];
            return (
              <Card key={n.id} className={cn(!n.read && "ring-1 ring-brand-100")}>
                <CardBody
                  className="flex cursor-pointer items-start gap-3.5 py-4"
                  onClick={() => setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
                >
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.cls)}>
                    <m.icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{n.body}</p>
                    <p className="mt-1.5 text-xs text-muted">{relativeTime(n.time)}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
