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

// Restoring a session on refresh via check-sso (a hidden iframe reading
// Keycloak's session cookie) turned out to be unreliable in practice —
// Keycloak and this app are different origins, so that cookie read is a
// third-party-cookie access, and browsers increasingly restrict those (this
// is what the "iframe... can escape its sandboxing" console warning and the
// "works, but logs out on every refresh" reports traced back to). A plain
// token-refresh POST carries the refresh token in the request body, not a
// cookie, so it isn't subject to that restriction at all — storing the
// tokens ourselves and handing them back to keycloak.init() on the next
// load sidesteps the cross-origin cookie problem entirely. sessionStorage
// (not localStorage) so it's at least scoped to the tab/window and cleared
// when that closes, same exposure class the previous JWT-in-localStorage
// system already had.
const STORAGE_KEY = "kc_tokens";

interface StoredTokens {
  token: string;
  refreshToken: string;
  idToken: string;
}

const loadStoredTokens = (): StoredTokens | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
};

const persistTokens = () => {
  if (!keycloak.token || !keycloak.refreshToken) return;
  try {
    const tokens: StoredTokens = {
      token: keycloak.token,
      refreshToken: keycloak.refreshToken,
      idToken: keycloak.idToken ?? "",
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — session just won't
    // survive a refresh; not worth failing the request over.
  }
};

const clearStoredTokens = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

let keycloakInitPromise: Promise<boolean> | null = null;

// `keycloak.init()` must run exactly once per page load — React 18 Strict
// Mode double-invokes effects in dev, and keycloak-js throws on a second
// init() call against the same instance. Memoizing the promise itself
// (not just guarding with a ref) also means a StrictMode remount gets the
// same in-flight/resolved result instead of racing a fresh init.
function initKeycloakOnce(): Promise<boolean> {
  if (!keycloakInitPromise) {
    const stored = loadStoredTokens();
    const init = stored
      ? keycloak.init({ ...stored, pkceMethod: "S256", checkLoginIframe: false })
      : keycloak.init({
          onLoad: "check-sso",
          pkceMethod: "S256",
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          checkLoginIframe: false,
        });
    // If init() hasn't settled within a few seconds (cold Keycloak — a
    // stock check-sso attempt can stall on Keycloak's own capability-check
    // request against a cold Render free-tier instance), fall back to "not
    // authenticated" so the UI unblocks and the user can click Log in — a
    // full top-level navigation, far more resilient than an iframe, that
    // just shows Keycloak's own slow cold-start page directly if needed.
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8000));
    keycloakInitPromise = Promise.race([init, timeout]).then((authenticated) => {
      if (authenticated) persistTokens();
      else clearStoredTokens();
      return authenticated;
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
      .catch(() => {
        clearStoredTokens();
        setReady(true);
      });

    // Re-persist on every refresh — refresh tokens can rotate, so the
    // stored copy has to stay current or a later reload would hand
    // keycloak.init() a refresh token Keycloak no longer recognizes.
    keycloak.onAuthSuccess = persistTokens;
    keycloak.onAuthRefreshSuccess = persistTokens;

    // The refresh token itself expiring/being revoked (not just the short
    // access token) means the session is genuinely over — reflect that in
    // state rather than leaving the app thinking it's still logged in.
    keycloak.onAuthRefreshError = () => {
      clearStoredTokens();
      setIsAuthenticated(false);
      queryClient.clear();
    };
    keycloak.onAuthLogout = () => {
      clearStoredTokens();
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
    clearStoredTokens();
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
