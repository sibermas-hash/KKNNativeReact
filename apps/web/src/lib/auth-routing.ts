const ADMIN_ROLES = ['superadmin', 'admin', 'faculty_admin'];
const LECTURER_ROLES = ['dosen', 'dpl'];

export function dashboardPathForRoles(roles?: string[] | null): string {
  const roleList = roles || [];

  if (roleList.some((role) => ADMIN_ROLES.includes(role))) return '/admin';
  if (roleList.some((role) => LECTURER_ROLES.includes(role))) return '/dosen';
  if (roleList.includes('student')) return '/mahasiswa';

  return '/';
}

export function buildLoginHref(pathname?: string | null): string {
  if (!pathname || pathname === '/' || pathname.startsWith('/login')) {
    return '/login';
  }

  return `/login?redirect=${encodeURIComponent(pathname)}`;
}

export function isSafePostLoginRedirect(path?: string | null): path is string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  if (path === '/' || path.startsWith('/login') || path.startsWith('/admin')) {
    return false;
  }

  return true;
}
