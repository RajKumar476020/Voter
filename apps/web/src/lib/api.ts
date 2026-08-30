export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    throw new ApiError('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error — is the API running on :3001?', 0);
  }

  const text = await res.text();
  let json: Envelope<T>;
  try {
    json = text ? (JSON.parse(text) as Envelope<T>) : ({ success: true, data: undefined as T } as Envelope<T>);
  } catch {
    // Vercel private DNS / 404 HTML when rewrite target was localhost, or API function not deployed
    if (text.includes('DNS_HOSTNAME_RESOLVED_PRIVATE') || text.includes('The page could not be found')) {
      const host = typeof window !== 'undefined' ? window.location.host : '';
      const isVercel = host.includes('vercel.app');
      if (isVercel) {
        throw new ApiError(
          'CONFIG_ERROR',
          'API not reachable on Vercel — the serverless API function may not have deployed or DATABASE_URL is missing. This build now includes the API at /api on the same host (voter-web-app.vercel.app) — ensure DATABASE_URL, SESSION_SECRET, JWT_SECRET, and CORS_ORIGIN are set in Vercel → Settings → Environment Variables, then Redeploy. If you still see this after redeploy, check Vercel Function logs for API.',
          res.status,
        );
      }
      throw new ApiError(
        'CONFIG_ERROR',
        'Server returned non-JSON (404) — API not reachable. If deployed, ensure the API is deployed on the same host (this repo now serves API at /api on voter-web-app.vercel.app) and that DATABASE_URL is set. See README Deploy section.',
        res.status,
      );
    }
    throw new ApiError('NETWORK_ERROR', `Server returned non-JSON (${res.status}). Is the API running?`, res.status);
  }

  if (!json.success) {
    throw new ApiError(json.error.code || 'ERROR', json.error.message || `Request failed (${res.status})`, res.status);
  }
  if (!res.ok) {
    throw new ApiError('ERROR', `Request failed (${res.status})`, res.status);
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
