import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import { keycloak } from "../lib/keycloak";
import type { CurrentUser } from "../types";

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let keycloakInitPromise: Promise<boolean> | null = null;

// `keycloak.init()` must run exactly once per page load — React 18 Strict
// Mode double-invokes effects in dev, and keycloak-js throws on a second
// init() call against the same instance. Memoizing the promise itself
// (not just guarding with a ref) also means a StrictMode remount gets the
// same in-flight/resolved result instead of racing a fresh init.
function initKeycloakOnce(): Promise<boolean> {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });
  }
  return keycloakInitPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    initKeycloakOnce()
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        setReady(true);
      })
      .catch(() => setReady(true));

    // The refresh token itself expiring/being revoked (not just the short
    // access token) means the session is genuinely over — reflect that in
    // state rather than leaving the app thinking it's still logged in.
    keycloak.onAuthRefreshError = () => {
      setIsAuthenticated(false);
      queryClient.clear();
    };
    keycloak.onAuthLogout = () => {
      setIsAuthenticated(false);
      queryClient.clear();
    };
  }, [queryClient]);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.getMe()).data,
    enabled: ready && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    // Keycloak says we have a session, but our own backend rejected it (a
    // deleted account, most likely) — treat as logged out rather than
    // getting stuck.
    if (ready && isAuthenticated && isError) setIsAuthenticated(false);
  }, [ready, isAuthenticated, isError]);

  const login = () => keycloak.login();

  const logout = () => {
    queryClient.clear();
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthenticated: ready && isAuthenticated && Boolean(user),
    isLoading: !ready || (isAuthenticated && isLoading),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
