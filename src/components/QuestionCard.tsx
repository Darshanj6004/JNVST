import { Check, X } from "lucide-react";
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-600 tabular">
            {index + 1}
          </span>
          <Badge tone={difficultyTone[question.difficulty]}>
            {question.difficulty[0].toUpperCase() + question.difficulty.slice(1)}
          </Badge>
        </div>
        <span className="text-xs text-muted tabular">{question.marks} marks</span>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-ink">{question.text}</p>

      {question.imageUrl ? (
        <img
          src={question.imageUrl}
          alt="Question figure"
          className="mt-4 w-full max-h-48 rounded-xl object-cover bg-slate-100"
        />
      ) : null}

      <div className="mt-5 grid gap-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = reveal && i === question.answer;
          const isWrong = reveal && isSelected && i !== question.answer;

          return (
            <button
              key={i}
              disabled={reveal}
              onClick={() => onSelect?.(i)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                !reveal && "hover:border-brand-300 hover:bg-brand-50/40",
                isSelected && !reveal && "border-brand-500 bg-brand-50/60 ring-[3px] ring-brand-500/15",
                !isSelected && !reveal && "border-line bg-white",
                isCorrect && "border-success bg-[var(--color-success-soft)]",
                isWrong && "border-danger bg-[var(--color-danger-soft)]",
                reveal && !isCorrect && !isWrong && "border-line bg-white opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold ring-1 ring-inset transition-colors",
                  isSelected && !reveal && "bg-brand-500 text-white ring-brand-500",
                  !isSelected && !reveal && "bg-slate-50 text-muted ring-line group-hover:ring-brand-300",
                  isCorrect && "bg-success text-white ring-success",
                  isWrong && "bg-danger text-white ring-danger",
                  reveal && !isCorrect && !isWrong && "bg-slate-50 text-muted ring-line",
                )}
              >
                {isCorrect ? <Check className="size-4" /> : isWrong ? <X className="size-4" /> : letters[i]}
              </span>
              {question.optionImages?.[i] && (
                <img
                  src={question.optionImages[i]}
                  alt={`Option ${letters[i]}`}
                  className="size-10 rounded-lg object-cover bg-slate-100"
                />
              )}
              <span className={cn("text-ink", (isCorrect || isWrong) && "font-medium")}>{opt}</span>
            </button>
          );
        })}
      </div>

      {reveal && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-[13px] font-semibold text-brand-700">Explanation</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
