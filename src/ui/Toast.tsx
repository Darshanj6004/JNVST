import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  toast: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const config: Record<ToastType, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "ring-green-200", iconColor: "text-success" },
  error: { icon: XCircle, ring: "ring-red-200", iconColor: "text-danger" },
  warning: { icon: AlertTriangle, ring: "ring-amber-200", iconColor: "text-warning" },
  info: { icon: Info, ring: "ring-sky-200", iconColor: "text-info" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 w-[min(360px,calc(100vw-2.5rem))]">
          {toasts.map((t) => {
            const { icon: Icon, ring, iconColor } = config[t.type];
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 bg-white rounded-[12px] border border-line shadow-[var(--shadow-lg)] ring-1 p-3.5 pr-3",
                  "animate-[toastIn_.22s_cubic-bezier(0.16,1,0.3,1)]",
                  ring,
                )}
              >
                <Icon className={cn("size-5 shrink-0 mt-0.5", iconColor)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  {t.message && <p className="text-[13px] text-muted mt-0.5">{t.message}</p>}
                </div>
                <button onClick={() => remove(t.id)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100">
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}`}</style>
    </Ctx.Provider>
  );
}
