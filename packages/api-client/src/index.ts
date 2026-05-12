export { createWebClient, createMobileClient } from './client';
export {
  authEndpoints,
  studentEndpoints,
  dplEndpoints,
  dosenEndpoints,
  adminEndpoints,
  profileEndpoints,
  publicEndpoints,
  periodContextEndpoints,
  notificationsEndpoints,
  attendanceEndpoints,
  serverTimeEndpoints,
} from './endpoints/index';

/**
 * Typed wrapper for queryFn — eliminates `(res as unknown as { data?: unknown })?.data ?? res`
 * pattern that widens queryFn return type to `{}`.
 *
 * Usage: queryFn: () => getTyped<MyType>(() => api.get('/endpoint'))
 */
export async function getTyped<T>(fetcher: () => Promise<unknown>): Promise<T> {
  return fetcher() as Promise<T>;
}
