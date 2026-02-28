import { useAuthStore } from "@/stores/auth.store";

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = useAuthStore.getState().token;

  if (!token) {
    token = await useAuthStore.getState().refreshToken();
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `API Error ${res.status}`, res.status, body);
  }

  return res.json();
}

export function apiGet<T>(path: string): Promise<T> {
  return apiClient<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiClient<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiClient<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiClient<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiClient<T>(path, { method: "DELETE" });
}
