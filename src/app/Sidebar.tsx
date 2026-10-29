import { NavLink } from "react-router";
import { GraduationCap, X } from "lucide-react";
import type { NavSection } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function Sidebar({
  nav,
  portalLabel,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  nav: NavSection[];
  portalLabel: string;
  onNavigate?: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 px-5 border-b border-line">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-[var(--shadow-xs)]">
            <GraduationCap className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-ink">Navodaya</span>
            <span className="text-[11px] font-medium text-muted">{portalLabel}</span>
          </span>
        </NavLink>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-4">
        {nav.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-6")}>
            {section.heading && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.heading}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex min-h-[42px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all select-none",
                      isActive
                        ? "bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200/70 shadow-[var(--shadow-xs)]"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-ink active:bg-slate-200/70",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "size-[19px] shrink-0 transition-transform group-hover:scale-105",
                          isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white tabular shadow-xs">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-200">Exam Target</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">Class 4</span>
          </div>
          <p className="mt-1 text-sm font-bold text-white">JNVST 2027</p>
          <p className="mt-0.5 text-xs text-brand-100">Scholarship & Navodaya Prep</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-line bg-white">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-[var(--shadow-lg)] animate-[slideIn_.2s_ease]">
            {content}
          </div>
          <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:none}}`}</style>
        </div>
      )}
    </>
  );
}
