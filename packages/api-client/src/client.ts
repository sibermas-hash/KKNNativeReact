import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@sibermas/shared-types';

function handleResponse<T = unknown>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
    return response.data as T;
  }

  // ── Defensive guard: non-JSON response ──────────────────────────────────
  // Jika nginx salah routing `/api` → request bocor ke Next.js dan balas
  // HTML (mis. halaman 404 Next.js). Axios TIDAK auto-throw untuk ini —
  // body di-keep sebagai `string` di `response.data`. Tanpa guard, caller
  // akan lihat crash kriptik `Cannot read properties of undefined (reading
  // 'call')` saat mencoba unwrap ApiResponse envelope. Throw error jelas
  // supaya Sentry/log langsung menangkap akar masalahnya.
  //
  // Cast ke `unknown` dulu karena `ApiResponse<T>` tidak mengizinkan string
  // di type system, tapi SECARA RUNTIME axios bisa lempar string kalau
  // response bukan JSON. Runtime check tetap wajib di sini.
  const rawData = response.data as unknown;
  if (typeof rawData === 'string') {
    const contentType =
      (response.headers?.['content-type'] as string | undefined) ?? '';
    const trimmed = rawData.trimStart();
    const looksLikeHtml =
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<');

    if (looksLikeHtml || !contentType.toLowerCase().includes('application/json')) {
      const err = new Error(
        `API mengembalikan respons non-JSON (content-type: ${contentType || 'unknown'}). ` +
          `Kemungkinan routing nginx /api bocor ke frontend Next.js. ` +
          `URL: ${response.config.url ?? '?'} | status: ${response.status}`,
      );
      (err as Error & { isNonJsonResponse?: boolean }).isNonJsonResponse = true;
      throw err;
    }
  }

  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data as T;
}

function handleError(error: unknown): never {
  throw error;
}

function emitLogout(): void {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  } catch { /* noop */ }
}

export function createWebClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '/api/v1',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => handleResponse(response),
    (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          emitLogout();
        } else if (error.response?.status === 403 && error.response?.data?.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('auth:require_password_change'));
          }
        } else if (error.response?.status === 403 && error.response?.data?.error?.code === 'PROFILE_INCOMPLETE') {
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('auth:profile_incomplete'));
          }
        }
      }
      return handleError(error);
    },
  );

  return client;
}

export function createMobileClient(getToken: () => Promise<string | null>, baseURL?: string): AxiosInstance {
  if (!baseURL) {
    throw new Error('Mobile API baseURL is required. Set EXPO_PUBLIC_API_URL or pass baseURL explicitly.');
  }

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      delete config.headers.Authorization;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => handleResponse(response),
    (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          if (typeof globalThis !== 'undefined') {
            globalThis.dispatchEvent?.(new CustomEvent('auth:logout'));
          }
        } else if (error.response?.status === 403 && error.response?.data?.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
          globalThis.dispatchEvent?.(new CustomEvent('auth:require_password_change'));
        } else if (error.response?.status === 403 && error.response?.data?.error?.code === 'PROFILE_INCOMPLETE') {
          globalThis.dispatchEvent?.(new CustomEvent('auth:profile_incomplete'));
        }
      }
      return handleError(error);
    },
  );

  return client;
}
