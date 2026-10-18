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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onOpenMenu} className="lg:hidden rounded-lg p-2 text-muted hover:bg-slate-100">
        <Menu className="size-5" />
      </button>

      <div className="hidden sm:block w-full max-w-xs">
        <SearchInput placeholder={isTeacher ? "Search students, questions…" : "Search practice topics…"} />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button className="sm:hidden rounded-lg p-2 text-muted hover:bg-slate-100">
          <Search className="size-5" />
        </button>

        <button
          onClick={() => navigate(isTeacher ? "/teacher/dashboard" : "/student/notifications")}
          className="relative rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink transition-colors"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-white" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <Dropdown
          trigger={
            <span className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100 transition-colors">
              <Avatar name={user?.name ?? "User"} color={user?.avatarColor} size={32} />
              <span className="hidden text-left sm:flex sm:flex-col sm:leading-tight">
                <span className="text-[13px] font-semibold text-ink">{user?.name}</span>
                <span className="text-[11px] text-muted">{isTeacher ? "Teacher" : "Student"}</span>
              </span>
            </span>
          }
        >
          {(close) => (
            <>
              <div className="px-2.5 py-2 mb-1 border-b border-line">
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
                Profile
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
                Log out
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
