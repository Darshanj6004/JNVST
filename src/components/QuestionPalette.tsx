import { cn } from "@/lib/cn";

export type QState = "answered" | "unanswered" | "review" | "current";

export function QuestionPalette({
  states,
  current,
  onJump,
}: {
  states: Exclude<QState, "current">[];
  current: number;
  onJump: (i: number) => void;
}) {
  const styles: Record<Exclude<QState, "current">, string> = {
    answered: "bg-emerald-600 text-white ring-emerald-600 shadow-xs",
    unanswered: "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
    review: "bg-amber-500 text-white ring-amber-500 shadow-xs",
  };

  const counts = states.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { answered: 0, unanswered: 0, review: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-3">
      {/* Quick summary badges */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-1.5">
          <p className="font-bold text-emerald-700 tabular">{counts.answered}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Answered</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-1.5">
          <p className="font-bold text-amber-700 tabular">{counts.review}</p>
          <p className="text-[10px] text-amber-600 font-medium">Review</p>
        </div>
        <div className="rounded-lg bg-slate-100 border border-slate-200 p-1.5">
          <p className="font-bold text-slate-700 tabular">{counts.unanswered}</p>
          <p className="text-[10px] text-slate-500 font-medium">Left</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {states.map((s, i) => {
          const isCurrent = i === current;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "flex h-9 items-center justify-center rounded-xl text-xs font-bold tabular ring-1 ring-inset transition-all cursor-pointer",
                styles[s],
                isCurrent && "ring-2 ring-offset-2 ring-brand-600 scale-105 z-10 font-extrabold",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PaletteLegend() {
  const items = [
    { label: "Answered", countCls: "bg-emerald-600 text-white" },
    { label: "Marked for review", countCls: "bg-amber-500 text-white" },
    { label: "Not answered yet", countCls: "bg-white text-slate-600 ring-1 ring-slate-200" },
  ];
  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-line">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
          <span className={cn("size-4 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0", it.countCls)}>
            ✓
          </span>
          {it.label}
        </div>
      ))}
    </div>
  );
}
