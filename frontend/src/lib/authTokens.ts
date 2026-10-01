// Minimal, fully-understood replacement for keycloak-js's token handling —
// dropped after keycloak-js's iframe-based mechanisms (check-sso,
// checkLoginIframe) repeatedly caused real production issues (a sandboxed
// iframe that can't reliably read Keycloak's session cookie cross-origin,
// a capability-check sub-request that hangs the whole init() on a cold
// Keycloak instance). Logging in is now a direct Resource Owner Password
// Credentials grant from the browser straight to Keycloak's token
// endpoint — no redirect, no iframe, no SDK — and everything below is
// plain fetch calls against Keycloak's standard OIDC endpoints.

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

const STORAGE_KEY = "kyma_auth_tokens";

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  // Access token expiry, as a Unix-seconds timestamp decoded from the JWT —
  // stored alongside rather than re-decoded on every check.
  expiresAt: number;
}

let current: TokenSet | null = loadFromStorage();

function loadFromStorage(): TokenSet | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenSet) : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    if (current) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, quota) — session just won't
    // survive a refresh; not worth failing the request over.
  }
}

function decodeExpiry(accessToken: string): number {
  try {
    const payload = accessToken.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const decoded = JSON.parse(json) as { exp?: number };
    return decoded.exp ?? 0;
  } catch {
    return 0;
  }
}

function setTokens(accessToken: string, refreshToken: string) {
  current = { accessToken, refreshToken, expiresAt: decodeExpiry(accessToken) };
  persist();
}

function clearTokens() {
  current = null;
  persist();
}

export class AuthRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
  }
}

const parseTokenEndpointError = async (res: Response): Promise<never> => {
  const body = await res.json().catch(() => ({}) as { error_description?: string; error?: string });
  const message =
    res.status === 401 || body.error === "invalid_grant"
      ? "Invalid username or password"
      : (body.error_description ?? "Could not sign in");
  throw new AuthRequestError(message, res.status);
};

export const login = async (username: string, password: string): Promise<void> => {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID,
      username,
      password,
      scope: "openid profile email",
    }),
  });

  if (!res.ok) await parseTokenEndpointError(res);
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  setTokens(body.access_token, body.refresh_token);
};

export const logout = async (): Promise<void> => {
  const refreshToken = current?.refreshToken;
  clearTokens();
  if (!refreshToken) return;
  // Best-effort — revokes the session server-side so the refresh token
  // can't be replayed, but a failure here shouldn't block logging out
  // locally (the tokens are already cleared above).
  await fetch(LOGOUT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: refreshToken }),
  }).catch(() => {});
};

// Refreshes if the access token is expired or close to it (30s grace,
// matching the margin the old keycloak-js call used). Call before any
// authenticated request; a no-op (resolves immediately) when the current
// token still has life left.
export const ensureFreshToken = async (): Promise<void> => {
  if (!current) return;
  const nowSeconds = Date.now() / 1000;
  if (current.expiresAt - nowSeconds > 30) return;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: current.refreshToken,
    }),
  });

  if (!res.ok) {
    // Refresh token itself expired/revoked — session is genuinely over.
    clearTokens();
    return;
  }
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  setTokens(body.access_token, body.refresh_token);
};

export const getAccessToken = (): string | null => current?.accessToken ?? null;

export const isAuthenticated = (): boolean => current !== null;
