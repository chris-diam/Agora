import type { PaginationMeta } from "../types";

// In dev, Vite's proxy forwards a relative "/api" to the local backend (see
// vite.config.ts) — but a static production build has no such proxy, so it
// needs the real backend origin. Falls back to "/api" (relative) when unset,
// which also covers the case where frontend and backend are served from the
// same origin in production.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

// Sockets need an absolute origin (no relative-path proxy trick applies to
// a WebSocket upgrade) — derive it from VITE_API_URL by dropping the "/api"
// suffix, or default to the known local backend port in dev.
export const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:4000";

// A stored avatar path is relative ("/uploads/avatars/x.png", served by our
// own backend) or already absolute (a Google-provided profile picture URL).
// Relative ones need the backend's real origin prefixed — same origin
// SOCKET_URL resolves to — since the frontend is a separate static origin
// in production and has no proxy for anything but "/api".
export const resolveMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SOCKET_URL}${url}`;
};

const TOKEN_KEY = "agora_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

export interface ApiResult<T> {
  data: T;
  pagination?: PaginationMeta;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

// All requests go through this — it attaches the auth token, unwraps the
// backend's { success, data, pagination } envelope, and turns a
// { success: false, message } response into a throwable error so callers
// can just `catch` and show err.message.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = getToken();
  const headers = new Headers(options.headers);
  // FormData bodies (file uploads) must NOT get a manual Content-Type — the
  // browser sets multipart/form-data with the correct boundary itself, and
  // overriding it here would break parsing on the server.
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // No/invalid JSON body — fall through to the generic error below.
  }

  if (!response.ok || !body?.success) {
    throw new ApiRequestError(body?.message ?? `Request failed (${response.status})`, response.status);
  }

  return { data: body.data as T, pagination: body.pagination };
}

// Generic over `object` (rather than `Record<string, ...>`) deliberately —
// a named param type like ListPostsParams has no index signature, and TS
// won't assign such a type to a Record-typed parameter even though every
// property is compatible. Accepting T extends object sidesteps that.
export const buildQuery = <T extends object>(params: T): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, string | number | string[] | undefined][]) {
    if (value === undefined || value === "") continue;
    // Arrays (e.g. a multi-category filter) join as comma-separated —
    // String([a,b]) === "a,b" — matching what the backend's validators expect.
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};
