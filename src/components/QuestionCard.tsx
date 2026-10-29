import { Check, Lightbulb, X } from "lucide-react";
import type { Question } from "@/types";
import { Badge } from "@/ui";
import { cn } from "@/lib/cn";

const letters = ["A", "B", "C", "D", "E"];

export function QuestionCard({
  question,
  index,
  selected,
  onSelect,
  reveal = false,
}: {
  question: Question;
  index: number;
  selected: number | null;
  onSelect?: (i: number) => void;
  reveal?: boolean;
}) {
  const difficultyTone = { easy: "success", medium: "warning", hard: "danger" } as const;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-xs tabular">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question {index + 1}</span>
          <Badge tone={difficultyTone[question.difficulty]}>
            {question.difficulty[0].toUpperCase() + question.difficulty.slice(1)}
          </Badge>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 tabular">
          +{question.marks} marks
        </span>
      </div>

      <p className="mt-4 text-[16px] leading-relaxed text-ink font-medium">{question.text}</p>

      {question.imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-slate-50 p-2">
          <img
            src={question.imageUrl}
            alt="Question figure"
            className="w-full max-h-56 rounded-xl object-contain bg-white"
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = reveal && i === question.answer;
          const isWrong = reveal && isSelected && i !== question.answer;

          return (
            <button
              key={i}
              type="button"
              disabled={reveal}
              onClick={() => onSelect?.(i)}
              className={cn(
                "group flex min-h-[52px] items-center gap-3.5 rounded-xl border px-4 py-3 text-left text-sm transition-all select-none cursor-pointer",
                !reveal && "hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-xs active:scale-[0.99]",
                isSelected && !reveal && "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/20 font-semibold",
                !isSelected && !reveal && "border-line bg-white shadow-xs",
                isCorrect && "border-success bg-emerald-50 ring-2 ring-emerald-500/20 font-semibold",
                isWrong && "border-danger bg-rose-50 ring-2 ring-rose-500/20 font-semibold",
                reveal && !isCorrect && !isWrong && "border-line bg-white opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ring-inset transition-colors",
                  isSelected && !reveal && "bg-brand-500 text-white ring-brand-500",
                  !isSelected && !reveal && "bg-slate-100 text-slate-600 ring-line group-hover:bg-brand-100 group-hover:text-brand-700",
                  isCorrect && "bg-success text-white ring-success",
                  isWrong && "bg-danger text-white ring-danger",
                  reveal && !isCorrect && !isWrong && "bg-slate-100 text-slate-400 ring-line",
                )}
              >
                {isCorrect ? <Check className="size-4 stroke-[3]" /> : isWrong ? <X className="size-4 stroke-[3]" /> : letters[i]}
              </span>
              {question.optionImages?.[i] && (
                <img
                  src={question.optionImages[i]}
                  alt={`Option ${letters[i]}`}
                  className="size-12 rounded-xl object-contain border border-line bg-white p-1"
                />
              )}
              <span className={cn("text-[15px] leading-snug flex-1", (isCorrect || isWrong) ? "text-ink font-semibold" : isSelected ? "text-brand-900" : "text-slate-700")}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {reveal && (
        <div className="mt-5 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/80 to-indigo-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-brand-800">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white shadow-xs">
              <Lightbulb className="size-4" />
            </span>
            <p className="text-sm font-bold">Explanation & Solution Step:</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 font-normal pl-9">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
