import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, FileText, Info, Trophy } from "lucide-react";
import { Button, Card, CardBody, EmptyState } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

type DBNotification = {
  id: string;
  title: string;
  body: string;
  type: "test" | "result" | "alert" | "info";
  created_at: string;
  read: boolean;
  notification_id?: string;
};

const meta = {
  test: { icon: FileText, cls: "bg-brand-50 text-brand-600" },
  result: { icon: Trophy, cls: "bg-[var(--color-warning-soft)] text-warning" },
  alert: { icon: AlertTriangle, cls: "bg-[var(--color-danger-soft)] text-danger" },
  info: { icon: Info, cls: "bg-slate-100 text-slate-500" },
} as const;

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Load notifications for this user (all + role-targeted)
    const { data: notifs } = await sb
      .from("notifications")
      .select("id, title, body, type, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    // Load which ones have been read
    const { data: reads } = await sb
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id);

    const readIds = new Set((reads ?? []).map((r: { notification_id: string }) => r.notification_id));

    const merged: DBNotification[] = (notifs ?? []).map((n: {
      id: string;
      title: string;
      body: string;
      type: "test" | "result" | "alert" | "info";
      created_at: string;
    }) => ({
      ...n,
      read: readIds.has(n.id),
    }));

    setItems(merged);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    if (!user?.id) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notification_reads")
      .upsert({ notification_id: id, user_id: user.id }, { onConflict: "notification_id,user_id" });
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const unread = items.filter((i) => !i.read);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    for (const n of unread) {
      await sb.from("notification_reads")
        .upsert({ notification_id: n.id, user_id: user.id }, { onConflict: "notification_id,user_id" });
    }
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread update${unread !== 1 ? "s" : ""}` : "You're all caught up"}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="size-4" />}
            disabled={unread === 0}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
          <Bell className="size-8 animate-pulse text-brand-400" />
          <p className="text-sm font-medium">Checking for updates…</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <EmptyState
            icon={<Bell className="size-8 text-slate-300" />}
            title="All caught up!"
            description="You don't have any unread notifications. Announcements and test reminders will appear right here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const m = meta[n.type] ?? meta.info;
            return (
              <Card
                key={n.id}
                className={cn(
                  "rounded-2xl border transition-all duration-150 cursor-pointer",
                  !n.read
                    ? "border-brand-200 bg-gradient-to-r from-brand-50/40 to-white shadow-xs"
                    : "border-line bg-white hover:border-slate-300",
                )}
                onClick={() => markRead(n.id)}
              >
                <CardBody className="flex items-start gap-4 p-4 sm:p-5">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-xs", m.cls)}>
                    <m.icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm text-ink", !n.read ? "font-bold" : "font-semibold")}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 font-normal">{n.body}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">{relativeTime(n.created_at)}</p>
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
