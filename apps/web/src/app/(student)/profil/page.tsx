'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Profil</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-600">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-800">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            {user.nim && <p className="text-sm text-slate-500">NIM: {user.nim}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
