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
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not set. Define it in .env.local or .env.production');
  }
  return envUrl;
}

export const api = createWebClient(getBaseUrl());

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
