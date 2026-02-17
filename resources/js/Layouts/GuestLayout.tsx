import type { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

export default function GuestLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <div className="min-h-screen bg-surface-base selection:bg-primary/20 selection:text-primary text-white font-sans relative overflow-hidden">
      <Head title={title ? `${title} - KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

      {/* Futuristic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-gold/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      {/* Design System Injection */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet" />

      <div className="flex min-h-screen items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
          <div className="rounded-[2.5rem] bg-white/[0.03] p-12 backdrop-blur-xxl border border-white/10 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl shadow-primary/40 border border-white/10 group">
                <AcademicCapIcon className="w-10 h-10 text-accent-gold transition-transform group-hover:scale-110" />
              </div>
            </div>

            <div className="mt-6 mb-12 text-center">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">UIN SAIZU <span className="text-accent-gold">KKN</span></h1>
              <p className="mt-4 text-[10px] font-black text-white/30 uppercase tracking-ultrawide">QUANTUM MANAGEMENT • 2026</p>
            </div>
            {children}
          </div>

          <p className="mt-10 text-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            © 2026 LPPM UIN SAIZU - SECURED ACADEMIC NEXUS
          </p>
        </div>
      </div>
    </div>
  );
}
