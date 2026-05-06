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
} from '@sibermas/api-client';

export const api = createWebClient(
  process.env.NEXT_PUBLIC_API_URL || '/api/v1',
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
