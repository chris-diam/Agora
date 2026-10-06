import * as SecureStore from "expo-secure-store";

// Mirrors the web app's lib/authTokens.ts — same direct Resource Owner
// Password Credentials grant against Keycloak, no SDK. The only real
// difference is storage: SecureStore's API is async (backed by Keychain/
// Keystore), so there's an explicit loadPersistedTokens() the app calls
// once at startup instead of a synchronous module-load read.

const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM!;
const CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID!;

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

const STORAGE_KEY = "kyma_auth_tokens";

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let current: TokenSet | null = null;

// Hermes doesn't reliably expose a global atob/btoa across Expo/RN
// versions, so this decodes base64url by hand rather than depending on it
// (or pulling in a package) for a single JWT field read.
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  let output = "";
  let buffer = 0;
  let bitsStored = 0;
  for (const char of normalized) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bitsStored += 6;
    if (bitsStored >= 8) {
      bitsStored -= 8;
      output += String.fromCharCode((buffer >> bitsStored) & 0xff);
    }
  }
  return output;
}

function decodeExpiry(accessToken: string): number {
  try {
    const payload = accessToken.split(".")[1];
    const json = base64UrlDecode(payload);
    const decoded = JSON.parse(json) as { exp?: number };
    return decoded.exp ?? 0;
  } catch {
    return 0;
  }
}

async function persist() {
  try {
    if (current) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(current));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Keychain/Keystore unavailable — session just won't survive a
    // restart; not worth failing the request over.
  }
}

async function setTokens(accessToken: string, refreshToken: string) {
  current = { accessToken, refreshToken, expiresAt: decodeExpiry(accessToken) };
  await persist();
}

async function clearTokens() {
  current = null;
  await persist();
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

// Called once at app startup (before rendering any auth-gated screen) so a
// restored session is available immediately rather than the app flashing
// a logged-out state while SecureStore resolves.
export const loadPersistedTokens = async (): Promise<void> => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as TokenSet) : null;
  } catch {
    current = null;
  }
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
    }).toString(),
  });

  if (!res.ok) await parseTokenEndpointError(res);
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  await setTokens(body.access_token, body.refresh_token);
};

export const logout = async (): Promise<void> => {
  const refreshToken = current?.refreshToken;
  await clearTokens();
  if (!refreshToken) return;
  await fetch(LOGOUT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: refreshToken }).toString(),
  }).catch(() => {});
};

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
    }).toString(),
  });

  if (!res.ok) {
    await clearTokens();
    return;
  }
  const body = (await res.json()) as { access_token: string; refresh_token: string };
  await setTokens(body.access_token, body.refresh_token);
};

export const getAccessToken = (): string | null => current?.accessToken ?? null;

export const isAuthenticated = (): boolean => current !== null;
