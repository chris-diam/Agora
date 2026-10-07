import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../lib/api";
import * as authTokens from "../lib/authTokens";

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  profileImageUrl: string | null;
  emailDigestOptIn: boolean;
}

export interface RegisterInput {
  displayName: string;
  username: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  // Merges a partial update into the locally-held user — for screens that
  // already got the updated row back from a PATCH and want to reflect it
  // immediately without a full refetch.
  updateLocalUser: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Starts true: restoring a SecureStore-backed session is async (unlike
  // sessionStorage on web), so there's a brief "don't know yet" window on
  // every cold start where neither the login screen nor the app should
  // render.
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const refetchUser = async (): Promise<void> => {
    try {
      const data = await apiFetch<CurrentUser>("/auth/me");
      setUser(data);
      setHasSession(true);
    } catch {
      await authTokens.logout();
      setUser(null);
      setHasSession(false);
    }
  };

  useEffect(() => {
    (async () => {
      await authTokens.loadPersistedTokens();
      if (authTokens.isAuthenticated()) await refetchUser();
      setIsLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    await authTokens.login(username, password);
    setHasSession(true);
    await refetchUser();
  };

  const register = async (input: RegisterInput) => {
    await apiFetch<null>("/auth/register", { method: "POST", body: JSON.stringify(input) });
    // The account now exists in Keycloak — log straight in with the same
    // credentials rather than sending the user to a separate login screen.
    await login(input.username, input.password);
  };

  const logout = async () => {
    setHasSession(false);
    setUser(null);
    await authTokens.logout();
  };

  const updateLocalUser = (patch: Partial<CurrentUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: hasSession && Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
