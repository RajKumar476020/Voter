const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${api}${path.startsWith('/') ? path : `/${path}`}`, { next: { revalidate: 30 } });
    const json = (await res.json()) as Envelope<T>;
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}
