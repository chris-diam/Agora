import { ensureFreshToken, getAccessToken } from "./authTokens";

// Unlike the web app, there's no dev proxy here — a physical device or
// emulator can't resolve "localhost" to the dev machine, so this always
// needs a real reachable address. See mobile/README.md for how to set it
// per platform (LAN IP for a physical device, 10.0.2.2 for the Android
// emulator).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL!;

export const resolveMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SOCKET_URL}${url}`;
};

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  await ensureFreshToken();

  const token = getAccessToken();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
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

  return body.data as T;
}
