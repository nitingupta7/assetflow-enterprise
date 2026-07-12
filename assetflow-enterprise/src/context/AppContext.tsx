import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Role, User } from "../types";
import { authService } from "../services/domain";
import { AppContext, type AppContextValue } from "./app-context-value";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedRole, setSelectedRoleState] = useState<Role>((localStorage.getItem("assetflow-role") as Role | null) ?? "Admin");
  const [theme, setTheme] = useState<"light" | "dark">((localStorage.getItem("assetflow-theme") as "light" | "dark" | null) ?? "light");

  useEffect(() => {
    authService.current().then((current) => {
      setUser(current);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("assetflow-theme", theme);
  }, [theme]);

  const setSelectedRole = (role: Role) => {
    setSelectedRoleState(role);
    localStorage.setItem("assetflow-role", role);
  };

  const value = useMemo<AppContextValue>(() => ({
    user,
    ready,
    selectedRole,
    theme,
    login: async (email) => {
      const loggedIn = await authService.login(email);
      setUser(loggedIn);
      setSelectedRole(loggedIn.role);
    },
    signup: async (name, email, departmentId) => {
      const signedUp = await authService.signup(name, email, departmentId);
      setUser(signedUp);
      setSelectedRole("Employee");
    },
    logout: async () => {
      await authService.logout();
      setUser(null);
    },
    setSelectedRole,
    toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
  }), [ready, selectedRole, theme, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
