import { Clock } from "lucide-react";
import { clock } from "@/lib/format";
import { cn } from "@/lib/cn";

export function TimerBadge({ remaining, total }: { remaining: number; total: number }) {
  const ratio = remaining / total;
  const urgent = ratio <= 0.1;
  const warn = ratio <= 0.25 && !urgent;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 font-semibold tabular ring-1 ring-inset transition-colors",
        urgent
          ? "bg-[var(--color-danger-soft)] text-danger ring-red-200 animate-pulse"
          : warn
            ? "bg-[var(--color-warning-soft)] text-warning ring-amber-200"
            : "bg-white text-ink ring-line",
      )}
    >
      <Clock className="size-4" />
      <span className="text-base tracking-tight">{clock(remaining)}</span>
    </div>
  );
}
