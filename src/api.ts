// src/api.ts

// --- PILIH BACKEND DI SINI ---
// Kalau mau pakai backend yang di-deploy (Vercel):
const BASE_URL = "https://backend-member-lestari.vercel.app";

// Helper utama
async function request<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 15000;

  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const baseMessage =
        json?.message ||
        text ||
        `Request error (${res.status}) saat memanggil ${path}`;

      const err = new Error(
        `${res.status}  - ${path} - ${JSON.stringify(json ?? text)}`
      );
      (err as any).status = res.status;
      (err as any).message = baseMessage;
      throw err;
    }

    return json as T;
  } finally {
    clearTimeout(id);
  }
}

// Wrapper metode HTTP
export function apiGet<T>(path: string) {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: any) {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: any) {
  return request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: any) {
  return request<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}
