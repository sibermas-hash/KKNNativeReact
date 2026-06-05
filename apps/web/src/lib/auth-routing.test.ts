import { describe, expect, it } from 'vitest';
import { buildLoginHref, dashboardPathForRoles, isSafePostLoginRedirect } from './auth-routing';

describe('auth routing helpers', () => {
  it('builds a plain login href for root and login pages', () => {
    expect(buildLoginHref('/')).toBe('/login');
    expect(buildLoginHref('/login')).toBe('/login');
  });

  it('preserves the originating public path in login redirect params', () => {
    expect(buildLoginHref('/berita/terbaru')).toBe('/login?redirect=%2Fberita%2Fterbaru');
  });

  it('maps roles to the correct dashboard entry point', () => {
    expect(dashboardPathForRoles(['superadmin'])).toBe('/admin');
    expect(dashboardPathForRoles(['dpl'])).toBe('/dosen');
    expect(dashboardPathForRoles(['student'])).toBe('/mahasiswa-v2');
    expect(dashboardPathForRoles([])).toBe('/');
  });

  it('rejects unsafe or looping post-login redirects', () => {
    expect(isSafePostLoginRedirect('/berita')).toBe(true);
    expect(isSafePostLoginRedirect('/')).toBe(false);
    expect(isSafePostLoginRedirect('/login')).toBe(false);
    expect(isSafePostLoginRedirect('//evil.test')).toBe(false);
    expect(isSafePostLoginRedirect('https://evil.test')).toBe(false);
  });
});
