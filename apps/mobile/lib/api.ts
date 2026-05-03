import { createMobileClient } from '@sibermas/api-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://sibermas.uinsaizu.ac.id/api/v1';

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
