/**
 * Unwrap API response envelope.
 * Handles both { data: T } and raw T responses from the api-client.
 */
export function unwrapResponse<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * Standard onError handler for React Query mutations.
 */
export function mutationErrorHandler(err: unknown): string {
  const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return e?.response?.data?.error?.message || e?.message || 'Terjadi kesalahan. Silakan coba lagi.';
}
