import { createMobileClient } from '@sibermas/api-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL =
  // `EXPO_PUBLIC_*` env vars are inlined into the JS bundle at build time.
  // This is the idiomatic path; reading via `Constants.expoConfig.extra`
  // is fragile because `app.config.ts` evaluation can happen before dotenv
  // finishes exporting and silently fall back to the hard-coded default.
  (process.env.EXPO_PUBLIC_API_URL as string | undefined)
  // Legacy fallback for builds that still set apiUrl via app.config.extra.
  || (Constants.expoConfig?.extra?.apiUrl as string | undefined)
  // Production default, used if nothing is configured.
  || 'https://sibermas.uinsaizu.ac.id/api/v1';

// DEV-only: log which API base the app is actually using. Helps debug
// env-var propagation from `.env` → bundle → runtime.
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[SIBERMAS] API_URL resolved to:', API_URL);
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

export const api = createMobileClient(getToken, API_URL);

export async function storeToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync('auth_token');
}
