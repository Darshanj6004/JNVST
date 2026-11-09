import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Light-weight Marathi / English switch for the student portal.
 * Students see Marathi by default; the choice is remembered on the device.
 *
 *   const t = useT();
 *   t("सराव", "Practice")
 */
export type Lang = "mr" | "en";

const KEY = "jnvst-lang";
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

function initial(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "mr") return v;
  } catch {
    /* private mode */
  }
  return "mr";
}

/** Current language outside React (e.g. in auth error messages). */
export function currentLang(): Lang {
  return initial();
}
/** Pick text by the saved language, for non-React code. */
export function pick(mr: string, en: string): string {
  return currentLang() === "mr" ? mr : en;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "mr" ? "mr" : "en";
  }, []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  return ctx ?? { lang: "en" as Lang, setLang: () => undefined };
}

/** Pick the Marathi or English text for the current language. */
export function useT() {
  const { lang } = useLang();
  return useCallback((mr: string, en: string) => (lang === "mr" ? mr : en), [lang]);
}

const DEV = "०१२३४५६७८९";
/** Numbers in Devanagari digits when Marathi is selected. */
export function useNum() {
  const { lang } = useLang();
  return useCallback(
    (v: number | string) => (lang === "mr" ? String(v).replace(/[0-9]/g, (d) => DEV[Number(d)]) : String(v)),
    [lang],
  );
}

/** Small pill switch: मराठी | English */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <span className={className || "inline-flex"}>
    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {(["mr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-lg px-2.5 py-1 transition-colors ${lang === l ? "bg-white text-brand-700 shadow-xs" : "text-slate-500 hover:text-ink"}`}
        >
          {l === "mr" ? "मराठी" : "English"}
        </button>
      ))}
    </div>
    </span>
  );
}
