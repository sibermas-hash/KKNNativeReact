import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /clear-session
 * Frontend-owned route that clears stale auth cookies without colliding with
 * the reverse-proxied Laravel `/api/*` namespace in production.
 */
function getPublicOrigin(_request: NextRequest): string {
  return 'https://sibermas.uinsaizu.ac.id';
}

function getCookieDomains(request: NextRequest): Array<string | undefined> {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost ?? request.nextUrl.host).split(',')[0]?.trim() ?? request.nextUrl.host;
  const hostname = host.replace(/:\d+$/, '');
  const labels = hostname.split('.').filter(Boolean);

  let parentDomain: string | null = null;
  if (labels.length >= 3 && labels.at(-1)?.length === 2 && (labels.at(-2)?.length ?? 0) <= 3) {
    parentDomain = labels.slice(-3).join('.');
  } else if (labels.length >= 2) {
    parentDomain = labels.slice(-2).join('.');
  }

  return Array.from(new Set<string | undefined>([
    undefined,
    hostname || undefined,
    hostname ? `.${hostname}` : undefined,
    parentDomain || undefined,
    parentDomain ? `.${parentDomain}` : undefined,
  ]));
}

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim() === 'https';
  }

  return request.nextUrl.protocol === 'https:';
}

function expiredCookieHeader(name: string, domain: string | undefined, secure: boolean): string {
  const parts = [
    `${name}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
  ];

  if (domain) {
    parts.push(`Domain=${domain}`);
  }

  if (secure) {
    parts.push('Secure');
  }

  parts.push('HttpOnly', 'SameSite=Strict');

  return parts.join('; ');
}

export function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect');
  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/login';

  const response = NextResponse.redirect(
    new URL(safeRedirect, `${getPublicOrigin(request)}/`)
  );

  const cookieNames = [
    'sibermas_token',
    'sibermas_session',
    'sibermas_pwd_changed',
    'sibermas_role',
    'sibermas_profile_complete',
  ];
  const secure = isSecureRequest(request);

  for (const name of cookieNames) {
    for (const domain of getCookieDomains(request)) {
      response.headers.append('Set-Cookie', expiredCookieHeader(name, domain, secure));
    }
  }

  return response;
}
