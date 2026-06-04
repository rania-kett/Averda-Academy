import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { userApi } from "../api/api";
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from "../api/client";

export type EmpUser = {
  id: string;
  employeeId: string;
  name: string;
  role: "EMPLOYEE";
  group: "DRIVER" | "WORKER";
  language: string;
  avatarColor: string;
  category?: { code: string; name?: Record<string, string> } | null;
  assessmentCompleted?: boolean;
  assessmentScore?: number | null;
  hsseqCourseRequired?: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  role: "ADMIN";
  email?: string;
};

type AuthState =
  | { kind: "employee"; user: EmpUser }
  | { kind: "admin"; user: AdminUser }
  | { kind: "none" };

type Ctx = {
  state: AuthState;
  setEmployeeSession: (user: EmpUser, access: string, refresh: string) => void;
  setAdminSession: (user: AdminUser, access: string, refresh: string) => void;
  updateEmployeeUser: (patch: Partial<EmpUser>) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ kind: "none" });

  const updateEmployeeUser = useCallback((patch: Partial<EmpUser>) => {
    setState((prev) => {
      if (prev.kind !== "employee") return prev;
      return { kind: "employee", user: { ...prev.user, ...patch } };
    });
  }, []);

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const { data } = await userApi.me();
      const u = (data as {
        user: {
          id: string;
          role: string;
          name: string;
          employeeId?: string;
          group?: string;
          language?: string;
          avatarColor?: string;
          email?: string;
          category?: { code?: string; name?: Record<string, string> } | null;
          assessmentCompleted?: boolean;
          assessmentScore?: number | null;
          hsseqCourseRequired?: boolean;
        };
      }).user;
      if (u.role === "ADMIN") {
        setState({
          kind: "admin",
          user: { id: u.id, name: u.name, role: "ADMIN", email: u.email },
        });
      } else {
        setState({
          kind: "employee",
          user: {
            id: u.id,
            employeeId: u.employeeId!,
            name: u.name,
            role: "EMPLOYEE",
            group: u.group as "DRIVER" | "WORKER",
            language: u.language ?? "AR",
            avatarColor: u.avatarColor ?? "#6366F1",
            category: u.category?.code ? { code: u.category.code, name: u.category.name } : null,
            assessmentCompleted: u.assessmentCompleted,
            assessmentScore: u.assessmentScore ?? null,
            hsseqCourseRequired: u.hsseqCourseRequired,
          },
        });
      }
    } catch {
      clearTokens();
      setState({ kind: "none" });
    }
  }, []);

  useEffect(() => {
    const onLogout = () => {
      clearTokens();
      setState({ kind: "none" });
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [refreshMe]);

  const setEmployeeSession = useCallback(
    (user: EmpUser, access: string, refresh: string) => {
      setTokens(access, refresh);
      setState({ kind: "employee", user });
    },
    []
  );

  const setAdminSession = useCallback(
    (user: AdminUser, access: string, refresh: string) => {
      setTokens(access, refresh);
      setState({ kind: "admin", user });
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setState({ kind: "none" });
  }, []);

  const value = useMemo(
    () => ({ state, setEmployeeSession, setAdminSession, updateEmployeeUser, refreshMe, logout }),
    [state, setEmployeeSession, setAdminSession, updateEmployeeUser, refreshMe, logout]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    void refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
