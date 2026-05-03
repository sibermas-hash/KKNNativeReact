import { createWebClient } from '@sibermas/api-client';

export const api = createWebClient(
  process.env.NEXT_PUBLIC_API_URL || '/api/v1',
);
