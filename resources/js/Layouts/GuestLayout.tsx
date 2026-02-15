import type { PropsWithChildren } from 'react';
import { Head, Link } from '@inertiajs/react';

export default function GuestLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/20 selection:text-primary">
      <Head title={title} />

      {/* Design System Injection */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet" />

      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[2rem] bg-white p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-10 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white mb-6 shadow-lg shadow-primary/20">
                <span className="text-3xl font-black">K</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">KKN SAIZU</h1>
              <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Management Intelligence v2.2</p>
            </div>
            {children}
          </div>

          <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            © 2026 LPPM UIN Saizu - Secure Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
