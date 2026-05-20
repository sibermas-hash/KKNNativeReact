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

const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/dosen', '/profil', '/ganti-password', '/notifikasi'];
const NO_STORE_HEADER_VALUE = 'private, no-store, no-cache, must-revalidate, max-age=0';

function applyNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', NO_STORE_HEADER_VALUE);
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

function hasAuthToken(request: NextRequest): boolean {
  // Only trust the HttpOnly cookie. The legacy `sibermas_session` marker is
  // non-HttpOnly and easily forged, so it is no longer sufficient on its own.
  return Boolean(request.cookies.get('sibermas_token')?.value);
}

function getPublicOrigin(_request: NextRequest): string {
  return 'https://sibermas.uinsaizu.ac.id';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // (1) Anonymous user trying to reach a protected page → /login.
  if (isProtected && !hasAuthToken(request)) {
    const loginUrl = new URL('/login', `${getPublicOrigin(request)}/`);
    loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return applyNoStoreHeaders(NextResponse.redirect(loginUrl, 307));
  }

  if (isProtected) {
    return applyNoStoreHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/mahasiswa',
    '/mahasiswa/:path*',
    '/dosen',
    '/dosen/:path*',
    '/profil',
    '/profil/:path*',
    '/ganti-password',
    '/notifikasi',
    '/notifikasi/:path*',
  ],
};
