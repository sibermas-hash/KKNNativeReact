import { cookies } from 'next/headers';

const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not set');
  if (isProductionBuild) return null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      next: { revalidate: 60 },
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Authenticated fetch — forwards Bearer token from cookie for protected endpoints */
export async function fetchApiAuth<T>(path: string, options?: RequestInit): Promise<T | null> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not set');
  if (isProductionBuild) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get('sibermas_token')?.value;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      cache: 'no-store',
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
