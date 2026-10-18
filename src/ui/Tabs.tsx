import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-line", className)}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "relative px-3.5 py-2.5 text-sm font-medium transition-colors -mb-px",
              active ? "text-brand-600" : "text-muted hover:text-ink",
            )}
          >
            <span className="flex items-center gap-2">
              {it.label}
              {it.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular",
                    active ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-muted",
                  )}
                >
                  {it.count}
                </span>
              )}
            </span>
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
          </button>
        );
      })}
    </div>
  );
}
