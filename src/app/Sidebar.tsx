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
        <button onClick={onClose} className="lg:hidden rounded-lg p-1.5 text-muted hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-6")}>
            {section.heading && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.heading}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("size-[18px]", isActive ? "text-brand-600" : "text-slate-400")} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular">
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
        <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-sm font-semibold">JNVST 2027</p>
          <p className="mt-0.5 text-xs text-brand-100">Class 4 · Scholarship track</p>
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
