'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JenisKknBuatPage(): React.JSX.Element {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/jenis-kkn'); }, [router]);
  return <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />;
}
