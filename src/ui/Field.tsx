import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-[10px] border bg-white text-ink text-sm placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-[3px] focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between text-[13px] font-medium text-ink mb-1.5">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leftIcon, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={cn(
          fieldBase,
          "h-10 px-3",
          leftIcon ? "pl-9" : "",
          invalid && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, "px-3 py-2.5 min-h-24 resize-y leading-relaxed", invalid && "border-danger", className)}
        {...rest}
      />
    );
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(fieldBase, "h-10 pl-3 pr-9 appearance-none cursor-pointer", invalid && "border-danger", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
    </div>
  );
});

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <Input leftIcon={<Search className="size-4" />} placeholder="Search…" className={className} {...rest} />;
}

export function Checkbox({ label, id, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const gen = useId();
  const cid = id ?? gen;
  return (
    <label htmlFor={cid} className="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-ink">
      <input
        id={cid}
        type="checkbox"
        className="size-4 rounded-[5px] border-slate-300 text-brand-500 focus:ring-brand-500/30 accent-brand-500"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Radio({ label, id, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const gen = useId();
  const cid = id ?? gen;
  return (
    <label htmlFor={cid} className="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-ink">
      <input id={cid} type="radio" className="size-4 border-slate-300 text-brand-500 accent-brand-500" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}
