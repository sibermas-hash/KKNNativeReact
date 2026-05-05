import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleResponse(response: AxiosResponse): any {
  return response.data;
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
  const client = axios.create({
    baseURL: baseURL || (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'https://sibermas.uinsaizu.ac.id/api/v1',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => handleResponse(response),
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        if (typeof globalThis !== 'undefined') {
          globalThis.dispatchEvent?.(new CustomEvent('auth:logout'));
        }
      }
      return handleError(error);
    },
  );

  return client;
}
