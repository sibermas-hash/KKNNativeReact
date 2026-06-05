const ADMIN_ROLES = ['superadmin', 'admin', 'faculty_admin'];
const LECTURER_ROLES = ['dosen', 'dpl'];

export function dashboardPathForRoles(roles?: string[] | null): string {
  const roleList = roles || [];

  if (roleList.some((role) => ADMIN_ROLES.includes(role))) return '/admin';
  if (roleList.some((role) => LECTURER_ROLES.includes(role))) return '/dosen';
  if (roleList.includes('student')) return '/mahasiswa-v2';

  return '/';
}

export function buildLoginHref(pathname?: string | null): string {
  const normalizedPath = normalizePostLoginRedirect(pathname);

  if (!normalizedPath) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(normalizedPath)}`;
}

export function isSafePostLoginRedirect(path?: string | null): path is string {
  return normalizePostLoginRedirect(path) !== null;
}

export function normalizePostLoginRedirect(path?: string | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }

  if (path === '/' || path.startsWith('/login')) {
    return null;
  }

  if (path === '/superadmin' || path.startsWith('/superadmin/')) {
    return path.replace(/^\/superadmin(?=\/|$)/, '/admin');
  }

  return path;
}
