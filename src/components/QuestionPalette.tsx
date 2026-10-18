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
    answered: "bg-success text-white ring-success",
    unanswered: "bg-white text-muted ring-line",
    review: "bg-warning text-white ring-warning",
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {states.map((s, i) => {
        const isCurrent = i === current;
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={cn(
              "flex h-9 items-center justify-center rounded-lg text-[13px] font-semibold tabular ring-1 ring-inset transition-all hover:scale-105",
              styles[s],
              isCurrent && "outline outline-2 outline-offset-2 outline-brand-500",
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export function PaletteLegend() {
  const items = [
    { label: "Answered", cls: "bg-success" },
    { label: "Not answered", cls: "bg-white ring-1 ring-inset ring-line" },
    { label: "Marked for review", cls: "bg-warning" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2.5 text-[13px] text-muted">
          <span className={cn("size-3.5 rounded", it.cls)} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
