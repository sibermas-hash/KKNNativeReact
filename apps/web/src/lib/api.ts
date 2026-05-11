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

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use env var directly, fallback to Laravel URL
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    return 'http://localhost:8000/api/v1';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
};

const getLegacyBaseUrl = () => getBaseUrl().replace(/\/v1\/?$/, '');

export const api = createWebClient(getBaseUrl());
const legacyApi = createWebClient(getLegacyBaseUrl());

// Singleton endpoint instances — prevents recreation on every render
export const authApi = authEndpoints(api);
export const studentApi = studentEndpoints(api);
export const adminApi = adminEndpoints(api);
export const dplApi = dplEndpoints(api);
export const dosenApi = dosenEndpoints(api);
export const profileApi = profileEndpoints(api);
export const publicApi = publicEndpoints(api);
export const periodContextApi = periodContextEndpoints(api);
export const notificationsApi = notificationsEndpoints(legacyApi);
export const attendanceApi = attendanceEndpoints(legacyApi);

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') ?? '';
  return `${baseUrl}/${path.replace(/^\/|^api\/v1\//g, '')}`;
}
