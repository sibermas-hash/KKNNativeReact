import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface GuestLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function GuestLayout({ children, title }: GuestLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col sm:justify-center items-center overflow-hidden font-sans selection:bg-cyan-500/30">
      <Head title={title ? `${title} | SIBERMAS` : 'Portal | SIBERMAS'} />

      {/* Dark Cinematic Background with Image */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <img
          src="/images/uin-saizu_1712224471.webp"
          alt="Campus"
          className="w-full h-full object-cover scale-105 opacity-90"
        />
        {/* Soft dark overlay so background is clearly visible */}
        <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/60" />
      </div>

      {/* Vibrant Glowing Meshes in Cyan/Lime Spectrum */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-lime-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse"
        style={{ animationDuration: '12s' }}
      />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-amber-400/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />

      {/* Bright Frosted Glass Card */}
      <div className="relative z-10 w-full max-w-[420px] px-6 py-12">
        <div className="backdrop-blur-2xl bg-white/70 border border-white p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <Link
            href={route('home')}
            className="text-xs font-bold text-emerald-200/80 hover:text-white transition-colors flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            Kembali ke Beranda Publik
          </Link>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} LPPM UIN Saizu Purwokerto
          </p>
        </div>
      </div>
    </div>
  );
}
