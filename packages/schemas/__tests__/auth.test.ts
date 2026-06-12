import { describe, it, expect } from 'vitest';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../src/auth';

/**
 * Auth schema contract tests. Fokus pada validation rules yang user-facing
 * (pesan error Indonesia, whitelist/blacklist karakter). Kalau test ini
 * berubah warna, konfirmasi dulu dengan UX copy sebelum update.
 */

describe('loginSchema', () => {
  it('accepts NIM-style login', () => {
    const result = loginSchema.safeParse({
      login: '1423203072',
      password: 'Secret1!',
      captcha_id: 'abc',
      captcha_answer: '42',
    });
    expect(result.success).toBe(true);
  });

  it('rejects email-like login (users must use NIM/NIP/username)', () => {
    const result = loginSchema.safeParse({
      login: 'someone@uinsaizu.ac.id',
      password: 'Secret1!',
      captcha_id: 'abc',
      captcha_answer: '42',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Email tidak dapat digunakan/i);
    }
  });

  it('requires all fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const validBase = {
    token: 'reset-token-123',
    email: 'user@example.com',
    password: 'Abcdef1!',
    password_confirmation: 'Abcdef1!',
  };

  it('accepts strong matching password', () => {
    expect(resetPasswordSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects mismatched confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      ...validBase,
      password_confirmation: 'DifferentPwd1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no uppercase)', () => {
    expect(resetPasswordSchema.safeParse({ ...validBase, password: 'abcdef1!', password_confirmation: 'abcdef1!' }).success).toBe(false);
  });

  it('rejects weak password (no digit)', () => {
    expect(resetPasswordSchema.safeParse({ ...validBase, password: 'Abcdefgh!', password_confirmation: 'Abcdefgh!' }).success).toBe(false);
  });

  it('rejects weak password (no symbol)', () => {
    expect(resetPasswordSchema.safeParse({ ...validBase, password: 'Abcdefg1', password_confirmation: 'Abcdefg1' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(resetPasswordSchema.safeParse({ ...validBase, password: 'Ab1!', password_confirmation: 'Ab1!' }).success).toBe(false);
  });
});
