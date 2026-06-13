import { cookies } from 'next/headers';

const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

type ApiErrorBody = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    errors?: Record<string, string[] | string>;
  };
};

type AuthFetchErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'service_unavailable';

export type AuthFetchErrorResult = {
  kind: AuthFetchErrorKind;
  status?: number;
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

export type AuthFetchResult<T> =
  | { kind: 'ok'; data: T; status: number }
  | AuthFetchErrorResult;

function getServerApiBase(): string {
  const apiBase = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  return apiBase.replace(/\/$/, '');
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false;
}

function normalizeErrorFields(errors: unknown): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object') return undefined;

  const normalized = Object.entries(errors as Record<string, unknown>).reduce<Record<string, string[]>>(
    (acc, [field, value]) => {
      if (Array.isArray(value)) {
        const messages = value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
        if (messages.length > 0) acc[field] = messages;

        return acc;
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        acc[field] = [value];
      }

      return acc;
    },
    {},
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function getFirstErrorMessage(errors?: Record<string, string[]>): string | undefined {
  if (!errors) return undefined;

  for (const messages of Object.values(errors)) {
    if (messages[0]) return messages[0];
  }

  return undefined;
}

function parseApiErrorPayload(payload: unknown): Omit<AuthFetchErrorResult, 'kind' | 'status'> {
  if (!payload || typeof payload !== 'object') return {};

  const apiError = (payload as ApiErrorBody).error;
  const errors = normalizeErrorFields(apiError?.errors);
  const firstErrorMessage = getFirstErrorMessage(errors);

  return {
    code: apiError?.code,
    message: firstErrorMessage ?? apiError?.message,
    errors,
  };
}

function mapStatusToAuthErrorKind(status: number): AuthFetchErrorKind {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 422:
      return 'validation_error';
    default:
      return 'service_unavailable';
  }
}

export function getAuthFetchErrorMessage(
  result: AuthFetchErrorResult,
  fallback = 'Layanan sedang tidak tersedia. Coba beberapa saat lagi.',
): string {
  if (result.message) return result.message;

  switch (result.kind) {
    case 'unauthorized':
      return 'Sesi Anda tidak valid atau sudah berakhir. Silakan masuk ulang.';
    case 'forbidden':
      return 'Akses Anda ditolak untuk operasi ini.';
    case 'not_found':
      return 'Endpoint atau data yang diminta tidak ditemukan.';
    case 'validation_error':
      return 'Data yang dikirim tidak valid.';
    case 'service_unavailable':
    default:
      return fallback;
  }
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (isProductionBuild) return null;
  const API_BASE = getServerApiBase();

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      next: { revalidate: 60 },
    });
    if (!res.ok || !isJsonResponse(res)) return null;
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
  if (isProductionBuild) return { kind: 'service_unavailable' };
  const API_BASE = getServerApiBase();

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

    if (!isJsonResponse(res)) {
      return { kind: 'service_unavailable' };
    }

    return { kind: 'ok', data: (await res.json()) as T };
  } catch {
    return { kind: 'service_unavailable' };
  }
}

/** Authenticated fetch — forwards Bearer token from cookie for protected endpoints */
export async function fetchApiAuth<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (isProductionBuild) return null;
  const API_BASE = getServerApiBase();

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
    if (!res.ok || !isJsonResponse(res)) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchApiAuthStrict<T>(
  path: string,
  options?: RequestInit,
): Promise<AuthFetchResult<T>> {
  if (isProductionBuild) return { kind: 'service_unavailable' };
  const API_BASE = getServerApiBase();

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

    if (res.status === 204) {
      return { kind: 'ok', data: null as T, status: 204 };
    }

    if (!res.ok) {
      const parsedError = isJsonResponse(res) ? parseApiErrorPayload(await res.json()) : {};

      return {
        kind: mapStatusToAuthErrorKind(res.status),
        status: res.status,
        ...parsedError,
      };
    }

    if (!isJsonResponse(res)) {
      return { kind: 'service_unavailable', status: res.status };
    }

    return { kind: 'ok', data: (await res.json()) as T, status: res.status };
  } catch {
    return { kind: 'service_unavailable' };
  }
}
