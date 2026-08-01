import type { ApiErrorBody } from "./types";
import { getOrCreateGuestKey, rememberGuestKey } from "./guest-usage";
import { getApiUrl } from "./env";

const API_URL = getApiUrl();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const guestKey = getOrCreateGuestKey();
  if (guestKey) {
    headers["X-Guest-Key"] = guestKey;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Cannot reach the API at ${API_URL}. Start the backend with pnpm dev:api.`,
    );
  }

  const returnedKey = response.headers.get("X-Guest-Key");
  if (returnedKey) rememberGuestKey(returnedKey);

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const err = (data ?? {}) as ApiErrorBody;
    throw new ApiError(
      response.status,
      err.code ?? "INTERNAL_ERROR",
      err.message ?? "Request failed",
    );
  }

  if (data && typeof data === "object" && "guestKey" in data) {
    rememberGuestKey(String((data as { guestKey?: string }).guestKey ?? ""));
  }

  return data as T;
}
