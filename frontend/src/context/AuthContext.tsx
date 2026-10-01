import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import * as authTokens from "../lib/authTokens";
import type { CurrentUser } from "../types";

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seeded synchronously from sessionStorage (unlike the old keycloak-js
  // setup, there's no async init() to wait on at all here — a stored
  // refresh token either works or it doesn't, found out on the first
  // request that needs it) so a page reload doesn't flash a logged-out
  // state before settling.
  const [hasSession, setHasSession] = useState(authTokens.isAuthenticated);
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.getMe()).data,
    enabled: hasSession,
    retry: false,
  });

  useEffect(() => {
    // The stored refresh token was rejected (expired/revoked) or our own
    // backend rejected the resulting access token (deleted account) —
    // either way, stop treating this as a live session.
    if (hasSession && isError) {
      authTokens.logout();
      setHasSession(false);
    }
  }, [hasSession, isError]);

  const login = async (username: string, password: string) => {
    await authTokens.login(username, password);
    setHasSession(true);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const register = async (input: authApi.RegisterInput) => {
    await authApi.register(input);
    // The account now exists in Keycloak — log straight in with the same
    // credentials rather than making the user re-type them on a separate
    // login screen.
    await login(input.username, input.password);
  };

  const logout = async () => {
    // Update UI state immediately — authTokens.logout() clears local tokens
    // synchronously before its own (best-effort) network revoke call, so
    // there's no reason to make the user wait on that round-trip to see
    // themselves logged out.
    setHasSession(false);
    queryClient.clear();
    await authTokens.logout();
  };

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthenticated: hasSession && Boolean(user),
    isLoading: hasSession && isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
