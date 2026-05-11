import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/clear-session
 * Clears all auth cookies (both HttpOnly and non-HttpOnly variants).
 * Used to fix stale cookie issues during production migration.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL('/login', request.url)
  );

  const cookieOptions = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set('sibermas_token', '', cookieOptions);
  response.cookies.set('sibermas_session', '', cookieOptions);
  response.cookies.set('sibermas_pwd_changed', '', cookieOptions);
  response.cookies.set('sibermas_role', '', cookieOptions);
  response.cookies.set('sibermas_profile_complete', '', cookieOptions);

  return response;
}
