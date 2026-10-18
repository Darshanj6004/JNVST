import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pageCount,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  const btn =
    "inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      <button className={cn(btn, "text-muted hover:bg-slate-100")} disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              btn,
              p === page ? "bg-brand-500 text-white shadow-[var(--shadow-xs)]" : "text-ink hover:bg-slate-100",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={cn(btn, "text-muted hover:bg-slate-100")}
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
