export function dashboardPathForRoles(roles: string[] = []): string {
  if (roles.some((role) => ['superadmin', 'admin', 'faculty_admin'].includes(role))) return '/admin';
  if (roles.includes('external_lppm_admin')) return '/external/dashboard';
  if (roles.some((role) => ['dosen', 'dpl'].includes(role))) return '/dosen';
  if (roles.includes('student')) return '/mahasiswa-v2';
  return '/';
}

export function primaryRoleLabel(roles: string[] = [], labels: Record<string, string> = {}): string {
  const role = roles[0] || 'student';
  return labels[role] || role;
}
