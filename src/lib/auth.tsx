import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Role, User } from "@/types";
import { currentStudent, teacher } from "@/data/users";

interface AuthState {
  user: User | null;
  login: (role: Role) => User;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      user,
      login: (role) => {
        const u = role === "teacher" ? teacher : currentStudent;
        setUser(u);
        return u;
      },
      logout: () => setUser(null),
    }),
    [user],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
