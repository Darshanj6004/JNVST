import { useNavigate } from "react-router";
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, Dropdown, MenuItem, SearchInput } from "@/ui";

export function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="lg:hidden flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-ink transition-colors"
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden sm:block w-full max-w-xs">
        <SearchInput placeholder={isTeacher ? "Search students, questions…" : "Search practice topics…"} />
      </div>

      {!isTeacher && (
        <div className="hidden md:flex items-center gap-2 pl-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Practice Mode
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => navigate(isTeacher ? "/teacher/dashboard" : "/student/notifications")}
          aria-label="Notifications"
          className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-ink transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <Dropdown
          trigger={
            <span className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors cursor-pointer ring-1 ring-transparent hover:ring-slate-200">
              <Avatar name={user?.name ?? "User"} color={user?.avatarColor} size={32} />
              <span className="hidden text-left sm:flex sm:flex-col sm:leading-tight">
                <span className="text-[13px] font-semibold text-ink">{user?.name}</span>
                <span className="text-[11px] font-medium text-muted">{isTeacher ? "Class Teacher" : "Class 4 Student"}</span>
              </span>
            </span>
          }
        >
          {(close) => (
            <>
              <div className="px-3 py-2.5 mb-1 border-b border-line bg-slate-50/70 rounded-t-lg">
                <p className="text-sm font-semibold text-ink">{user?.name}</p>
                <p className="text-xs text-muted">@{user?.username}</p>
              </div>
              <MenuItem
                icon={<UserIcon className="size-4" />}
                onClick={() => {
                  close();
                  navigate(isTeacher ? "/teacher/settings" : "/student/profile");
                }}
              >
                My Profile
              </MenuItem>
              {isTeacher && (
                <MenuItem
                  icon={<Settings className="size-4" />}
                  onClick={() => {
                    close();
                    navigate("/teacher/settings");
                  }}
                >
                  Settings
                </MenuItem>
              )}
              <MenuItem icon={<LogOut className="size-4" />} danger onClick={doLogout}>
                Sign out
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
