import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  icon,
  trend,
  hint,
  accent = "brand",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; up: boolean };
  hint?: string;
  accent?: "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const accents = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-[var(--color-success-soft)] text-success",
    warning: "bg-[var(--color-warning-soft)] text-warning",
    danger: "bg-[var(--color-danger-soft)] text-danger",
  } as const;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink tabular leading-none">{value}</p>
        </div>
        {icon && (
          <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0", accents[accent])}>{icon}</div>
        )}
      </div>
      {(trend || hint) && (
        <div className="mt-3.5 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                trend.up ? "text-success" : "text-danger",
              )}
            >
              {trend.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
