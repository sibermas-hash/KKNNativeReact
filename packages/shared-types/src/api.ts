/**
 * Standard API envelope returned by the Laravel backend.
 *
 * - Success: `{ success: true, data, meta?, links?, message? }`
 * - Error:   `{ success: false, error: { code, message, errors? } }`
 *
 * Both shapes share this type; inspect `success` to narrow.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
  meta?: PaginationMeta;
  links?: PaginationLinks;
  redirect_to?: string;
}

/**
 * @deprecated Use {@link ApiResponse} with `success: false` check instead.
 *   Kept for backward compatibility only.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}
