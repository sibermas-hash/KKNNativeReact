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
 * This middleware now only handles two cases:
 *   1. Block anonymous access to pages that definitely require a session.
 *   2. Redirect already-authenticated users away from the login page (UX).
 *
 * It deliberately trusts ONLY the HttpOnly `sibermas_token` cookie for the
 * presence check. It does not attempt to validate the token — that is the
 * backend's responsibility when the page makes its first API call.
 */

const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/dosen', '/profil', '/ganti-password', '/notifikasi'];
const AUTH_PAGES = ['/login', '/lupa-kata-sandi', '/atur-ulang-kata-sandi'];

function hasAuthToken(request: NextRequest): boolean {
  // Only trust the HttpOnly cookie. The legacy `sibermas_session` marker is
  // non-HttpOnly and easily forged, so it is no longer sufficient on its own.
  return Boolean(request.cookies.get('sibermas_token')?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // (1) Anonymous user trying to reach a protected page → /login.
  if (isProtected && !hasAuthToken(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // (2) Already-authenticated user on an auth page → send to dashboard.
  //     The real role-based dashboard choice happens client-side once the
  //     page fetches `/api/v1/auth/user`. The edge only redirects to "/"
  //     which the authenticated root page resolves correctly.
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + '/')
  );

  if (isAuthPage && hasAuthToken(request)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/mahasiswa/:path*',
    '/dosen/:path*',
    '/profil/:path*',
    '/ganti-password',
    '/login',
    '/lupa-kata-sandi',
    '/atur-ulang-kata-sandi',
    '/notifikasi/:path*',
  ],
};
