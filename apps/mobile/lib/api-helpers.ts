/**
 * Normalize API response for mobile screens.
 *
 * The shared api-client interceptor unwraps `response.data.data` automatically,
 * so endpoints return the inner payload directly (e.g. an array, or an object
 * with nested `data`). Mobile screens previously expected `{ data: [...] }`
 * wrapper and broke when they received a bare array.
 *
 * This helper handles both shapes uniformly:
 *   - If result is already an array → return as-is
 *   - If result is `{ data: [...] }` → extract `.data`
 *   - Otherwise → return fallback
 */
export function unwrapList<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'data' in result) {
    const inner = (result as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

/**
 * Same as unwrapList but preserves meta/pagination alongside the list.
 */
export function unwrapPaginated<T = Record<string, unknown>>(result: unknown): { data: T[]; meta?: Record<string, unknown> } {
  if (Array.isArray(result)) return { data: result as T[] };
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    const data = Array.isArray(obj.data) ? (obj.data as T[]) : [];
    const meta = (obj.meta as Record<string, unknown>) ?? undefined;
    return { data, meta };
  }
  return { data: [] };
}

/**
 * Unwrap a single-object response (e.g. dashboard, single resource).
 * Returns the object directly whether wrapped or not.
 */
export function unwrapObject<T = Record<string, unknown>>(result: unknown): T | null {
  if (!result || typeof result !== 'object') return null;
  const obj = result as Record<string, unknown>;
  // If it has a `data` key that is an object (not array), unwrap
  if ('data' in obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as T;
  }
  return result as T;
}
