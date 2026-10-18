import { useState } from "react";
import { Outlet } from "react-router";
import type { NavSection } from "@/lib/nav";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function AppShell({ nav, portalLabel }: { nav: NavSection[]; portalLabel: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar
        nav={nav}
        portalLabel={portalLabel}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
