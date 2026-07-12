import { createContext } from "react";
import type { Role, User } from "../types";

export interface AppContextValue {
  user: User | null;
  ready: boolean;
  selectedRole: Role;
  theme: "light" | "dark";
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, departmentId: string) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedRole: (role: Role) => void;
  toggleTheme: () => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);
