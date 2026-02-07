import type { PropsWithChildren } from 'react';
import { Head, Link } from '@inertiajs/react';

export default function GuestLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      <Head title={title} />

      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/90 p-8 shadow-xl ring-1 ring-slate-200">
            <div className="mb-8 text-center">
              <Link href="/" className="text-2xl font-bold text-emerald-700">
                KKN UIN SAIZU
              </Link>
              <p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
