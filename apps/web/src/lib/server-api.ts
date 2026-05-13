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

/**
 * Same as fetchApi but returns a discriminated union so callers bisa
 * bedakan 404 (resource tidak ada) dari 5xx / network error (service
 * down). Critical untuk halaman seperti verifikasi sertifikat yang
 * salah kalau kasih "Tidak Valid" saat backend cuma down.
 */
export type FetchResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'not_found' }
  | { kind: 'service_unavailable'; status?: number };

export async function fetchApiStrict<T>(
  path: string,
  options?: RequestInit,
): Promise<FetchResult<T>> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not set');
  if (isProductionBuild) return { kind: 'service_unavailable' };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      next: options?.cache === 'no-store' ? undefined : { revalidate: 60 },
    });

    if (res.status === 404) {
      return { kind: 'not_found' };
    }

    if (!res.ok) {
      return { kind: 'service_unavailable', status: res.status };
    }

    if (!res.headers.get('content-type')?.includes('application/json')) {
      return { kind: 'service_unavailable' };
    }

    return { kind: 'ok', data: (await res.json()) as T };
  } catch {
    return { kind: 'service_unavailable' };
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
