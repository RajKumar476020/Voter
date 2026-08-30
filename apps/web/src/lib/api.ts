export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });
  const json = (await res.json()) as Envelope<T>;
  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message);
  }
  return json.data;
}

export const client = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};
