import { describe, it, expectTypeOf } from 'vitest';
import type { ApiResponse, PaginatedResponse, ApiError } from '../src/api';
import type { User, Mahasiswa } from '../src/models';

/**
 * Type-level contract tests. Tidak runtime — cukup memastikan bentuk
 * type shared-types menyesuaikan kontrak backend. Jika shape berubah,
 * test ini akan gagal compile (vitest expectTypeOf) dan memaksa review.
 */

describe('ApiResponse shape', () => {
  it('success envelope shape', () => {
    const ok: ApiResponse<{ id: number }> = {
      success: true,
      data: { id: 1 },
    };
    expectTypeOf(ok.success).toEqualTypeOf<boolean>();
    expectTypeOf(ok.data).toMatchTypeOf<{ id: number } | undefined>();
  });

  it('error envelope shape', () => {
    const err: ApiResponse = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Input tidak valid', errors: { email: ['harus berupa email'] } },
    };
    expectTypeOf(err.error).toMatchTypeOf<ApiError['error'] | undefined>();
  });
});

describe('PaginatedResponse shape', () => {
  it('has data + meta + links', () => {
    const page: PaginatedResponse<User> = {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
      links: { first: null, last: null, prev: null, next: null },
    };
    expectTypeOf(page.data).toEqualTypeOf<User[]>();
    expectTypeOf(page.meta.current_page).toBeNumber();
  });
});

describe('User / Mahasiswa domain types', () => {
  it('User has id + email + roles', () => {
    expectTypeOf<User>().toHaveProperty('id');
    expectTypeOf<User>().toHaveProperty('email');
  });

  it('Mahasiswa is tied to User via user_id', () => {
    expectTypeOf<Mahasiswa>().toHaveProperty('user_id');
    expectTypeOf<Mahasiswa>().toHaveProperty('nim');
  });
});
