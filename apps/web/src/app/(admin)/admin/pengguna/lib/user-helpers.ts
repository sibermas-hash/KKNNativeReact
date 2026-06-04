export const normalizeAvatarUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.replace('/api/storage/', '/storage/');
};

export const roleBadgeClass = (role: string) => {
  if (role === 'superadmin') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (role === 'admin' || role === 'faculty_admin') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (role === 'dosen' || role === 'dpl') return 'bg-violet-50 text-violet-700 ring-violet-200';
  return 'bg-cyan-50 text-cyan-700 ring-cyan-200';
};

export function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}
