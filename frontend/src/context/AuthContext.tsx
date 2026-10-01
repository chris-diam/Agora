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
//
// checkLoginIframe (default true) adds periodic cross-tab "logged out
// elsewhere" polling this app doesn't need, so it's turned off — but note
// it does NOT stop keycloak-js's own one-time 3p-cookies capability check
// that check-sso itself runs (confirmed by watching network requests with
// it both on and off). That check hits Keycloak directly, and on a cold
// Render free-tier instance it can come back 503 (or just be slow while
// the instance wakes up) in a way keycloak-js doesn't resolve cleanly from
// — init() just never settles, silently stalling the entire login flow
// with no visible error. The real protection against that is the timeout
// race below, not this flag.
function initKeycloakOnce(): Promise<boolean> {
  if (!keycloakInitPromise) {
    const init = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      checkLoginIframe: false,
    });
    // If init() hasn't settled within a few seconds (cold Keycloak, per
    // above), fall back to "not authenticated" so the UI unblocks and the
    // user can click Log in — a full top-level navigation, far more
    // resilient than an iframe, that just shows Keycloak's own slow
    // cold-start page directly if it's still waking up.
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8000));
    keycloakInitPromise = Promise.race([init, timeout]);
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
