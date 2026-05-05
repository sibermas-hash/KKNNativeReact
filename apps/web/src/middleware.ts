import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/mahasiswa', '/dosen', '/profil'];
// /ganti-password intentionally excluded: logged-in users with PASSWORD_CHANGE_REQUIRED
// must be able to reach it. The providers/index.tsx event handler manages the redirect.
const AUTH_PAGES = ['/login', '/lupa-kata-sandi', '/atur-ulang-kata-sandi'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sibermas_token')?.value;

  // If user is on a protected page without a token, redirect to login
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and visits auth pages, redirect to home
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + '/')
  );

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match protected routes
    '/admin/:path*',
    '/mahasiswa/:path*',
    '/dosen/:path*',
    '/profil/:path*',
    // Match auth pages
    '/login',
    '/lupa-kata-sandi',
    '/atur-ulang-kata-sandi',
  ],
};
