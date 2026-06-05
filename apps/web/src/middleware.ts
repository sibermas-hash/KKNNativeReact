import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js edge middleware.
 *
 * Audit C-004 (option b): This middleware NO LONGER makes authorization
 * decisions based on client-accessible cookies (`sibermas_role`,
 * `sibermas_pwd_changed`, `sibermas_profile_complete`). Those cookies are not
 * HttpOnly, so a browser user can set them to anything and reach any page.
 *
 * The Laravel backend is the sole source of truth for:
 *   - Is the user authenticated? (verifies `sibermas_token` HttpOnly cookie)
 *   - Does the user have the correct role? (policies + EnsureAdminAuthorization)
 *   - Must the user change password? (EnsurePasswordChanged middleware)
 *   - Is the user's profile complete? (EnsureProfileCompleted middleware)
 *
 * When an unauthorized API call occurs, the backend returns a structured
 * error envelope the client uses to redirect appropriately:
 *   - `{code: 'UNAUTHORIZED'}` → client redirects to /login
 *   - `{code: 'PASSWORD_CHANGE_REQUIRED'}` → client redirects to /ganti-password
 *   - `{code: 'PROFILE_INCOMPLETE'}` → client redirects to /profil
 *   - `{code: 'FORBIDDEN'}` → client shows a 403 page
 *
 * This middleware now only handles one case:
 *   1. Block anonymous access to pages that definitely require a session.
 *
 * It deliberately trusts ONLY the HttpOnly `sibermas_token` cookie for the
 * presence check for protected pages. It does not attempt to validate the
 * token — that is the backend's responsibility when the page makes its first
 * API call.
 *
 * Important: we intentionally do NOT redirect `/login` away based only on
 * cookie presence. A stale/expired cookie can still exist in the browser; if
 * we bounce `/login` -> `/` on mere presence, users get stuck in a loop where
 * clicking "Login" appears to do nothing.
 */

const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/mahasiswa-v2', '/dosen', '/profil', '/ganti-password', '/notifikasi'];

function hasAuthToken(request: NextRequest): boolean {
  // Only trust the HttpOnly cookie. The legacy `sibermas_session` marker is
  // non-HttpOnly and easily forged, so it is no longer sufficient on its own.
  return Boolean(request.cookies.get('sibermas_token')?.value);
}

function getPublicOrigin(request: NextRequest): string {
  const explicitOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, '');
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // (1) Anonymous user trying to reach a protected page → /login.
  if (isProtected && !hasAuthToken(request)) {
    const loginUrl = new URL('/login', `${getPublicOrigin(request)}/`);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, 308);
  }

  const response = NextResponse.next();
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/mahasiswa/:path*',
    '/mahasiswa-v2/:path*',
    '/dosen/:path*',
    '/profil/:path*',
    '/ganti-password',
    '/notifikasi/:path*',
  ],
};
