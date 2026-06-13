import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import {
  createWebClient,
  authEndpoints,
  studentEndpoints,
  adminEndpoints,
  dplEndpoints,
  dosenEndpoints,
  profileEndpoints,
  publicEndpoints,
  periodContextEndpoints,
  notificationsEndpoints,
  attendanceEndpoints,
} from '@sibermas/api-client';

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  return envUrl;
}

export const api = createWebClient(getBaseUrl());
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers?.delete?.('Content-Type');
    delete (config.headers as unknown as Record<string, unknown>)['Content-Type'];
    delete (config.headers as unknown as Record<string, unknown>)['content-type'];
  }
  return config;
});
export const rawApi = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

rawApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
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

    return Promise.reject(error);
  },
);

// Singleton endpoint instances — prevents recreation on every render
export const authApi = authEndpoints(api);
export const studentApi = studentEndpoints(api);
export const adminApi = adminEndpoints(api);
export const dplApi = dplEndpoints(api);
export const dosenApi = dosenEndpoints(api);
export const profileApi = profileEndpoints(api);
export const publicApi = publicEndpoints(api);
export const periodContextApi = periodContextEndpoints(api);
export const notificationsApi = notificationsEndpoints(api);
export const attendanceApi = attendanceEndpoints(api);

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') ?? '';
  const cleaned = path.replace(/^\/*(?:api\/v1\/)?/, '');
  return `${baseUrl}/${cleaned}`;
}
