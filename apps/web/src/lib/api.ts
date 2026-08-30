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

function isProductionMisconfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  // Deployed (not localhost) but API still points to localhost → Vercel edge will 404 with DNS_HOSTNAME_RESOLVED_PRIVATE
  return host !== 'localhost' && host !== '127.0.0.1' && api.includes('localhost');
}

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
    if (isProductionMisconfigured()) {
      throw new ApiError(
        'CONFIG_ERROR',
        'API is not configured for this deployment. Set NEXT_PUBLIC_API_URL (and API_URL) on your hosting provider to your deployed API URL, e.g. https://voter-api.onrender.com — currently it still points to localhost:3001.',
        0,
      );
    }
    throw new ApiError('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error — is the API running on :3001?', 0);
  }

  const text = await res.text();
  let json: Envelope<T>;
  try {
    json = text ? (JSON.parse(text) as Envelope<T>) : ({ success: true, data: undefined as T } as Envelope<T>);
  } catch {
    // Vercel private DNS / 404 HTML when rewrite target is localhost in prod
    if (text.includes('DNS_HOSTNAME_RESOLVED_PRIVATE') || text.includes('The page could not be found')) {
      throw new ApiError(
        'CONFIG_ERROR',
        'Server returned non-JSON (404) — the API URL is misconfigured. In production, localhost:3001 is not reachable from the edge. Deploy the API separately (Render/Railway/Fly) and set NEXT_PUBLIC_API_URL + API_URL to that public URL, and set CORS_ORIGIN to your web URL. See README Deploy section.',
        res.status,
      );
    }
    if (isProductionMisconfigured()) {
      throw new ApiError(
        'CONFIG_ERROR',
        `API not reachable in production (tried localhost:3001 from ${window.location.host}). Set NEXT_PUBLIC_API_URL to your deployed API URL. Original: Server returned non-JSON (${res.status})`,
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
