'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { LayoutDashboard, Users, FileCheck, Power } from 'lucide-react';
import { api } from '@/lib/api';
import { dashboardPathForRoles } from '@/lib/role-routing';

const items = [
  { href: '/external/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/external/participants', label: 'Peserta', icon: Users },
  { href: '/external/collaboration-letters', label: 'Surat', icon: FileCheck },
];

export default function ExternalLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, clearUser, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void fetchUser(true).then((result) => {
        if (result !== 'authenticated') router.replace(`/login?redirect=${encodeURIComponent(pathname ?? '/external/dashboard')}`);
      });
      return;
    }
    if (user && !user.roles?.includes('external_lppm_admin')) {
      router.replace(dashboardPathForRoles(user.roles ?? []));
    }
  }, [isLoading, isAuthenticated, user, router, pathname, fetchUser]);
  const logout = async () => { try { await api.post('/auth/logout'); } catch {} clearUser(); router.replace('/login'); };
  if (isLoading || !isAuthenticated || !user || !user.roles?.includes('external_lppm_admin')) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>;
  }
  return <div className="min-h-screen bg-[color:var(--profile-bg)] text-[color:var(--profile-text)] flex">
    <aside className="w-64 border-r border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-4 hidden md:block">
      <div className="font-black text-lg mb-6">External LPPM</div>
      <nav className="space-y-2">{items.map((it) => { const Icon = it.icon; const active = pathname === it.href; return <Link key={it.href} href={it.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold ${active ? 'bg-cyan-600 text-white' : 'hover:bg-[color:var(--profile-soft)]'}`}><Icon size={16}/>{it.label}</Link>; })}</nav>
      <button onClick={logout} className="mt-8 flex items-center gap-2 text-sm text-red-600 font-bold"><Power size={16}/> Logout</button>
    </aside>
    <main className="flex-1 p-6 overflow-auto">{children}</main>
  </div>;
}
