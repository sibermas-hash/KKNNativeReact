import type { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { Globe } from 'lucide-react';

export default function GuestLayout({
 title,
 children,
}: PropsWithChildren<{ title?: string }>) {
 return (
  <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 relative flex items-center justify-center p-6">
  <Head title={title ? `${title} - KKN UIN Prof. K.H. Saifuddin Zuhri` : 'SIM-KKN UIN Prof. K.H. Saifuddin Zuhri'} />

  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-white">
  <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
  <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-amber-400/5 rounded-full blur-[80px]" />
  </div>

  <div className="w-full max-w-[440px] relative z-50">
  {/* BRANDING SINAR DUNIA STYLE */}
  <div className="text-center mb-10">
  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500 shadow-2xl shadow-emerald-500/30 mb-8 mx-auto transform -rotate-3 border-4 border-white">
  <Globe className="w-10 h-10 text-white" />
  </div>
  <h2 className="text-4xl font-black text-slate-950 tracking-tighter leading-none uppercase">
  UIN <span className="text-emerald-500">Prof. K.H. Saifuddin Zuhri</span>
  </h2>
  <div className="flex items-center justify-center gap-4 mt-4">
  <div className="h-1.5 w-8 bg-amber-400 rounded-full" />
  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
  VIRTUAL_GATEWAY
  </p>
  <div className="h-1.5 w-8 bg-emerald-500 rounded-full" />
  </div>
  </div>

  {/* CONTENT CARD */}
  <div className="bg-white rounded-[2.5rem] p-10 sm:p-14 border-4 border-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative z-50 overflow-hidden">
  <div className="relative z-10">
  {children}
  </div>
  
  {/* Accent Corner like the paper packaging */}
  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -translate-y-12 translate-x-12 rounded-full" />
  <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-400/10 -translate-x-8 translate-y-8 rounded-full" />
  </div>

  {/* CLEAN FOOTER */}
  <div className="mt-14 text-center space-y-6">
  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
  Lembaga Penelitian dan Pengabdian kepada Masyarakat UIN Prof. K.H. Saifuddin Zuhri
  </p>
  <div className="flex justify-center items-center gap-4 text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">
  <span>v3.5 VIBRANT</span>
  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
  <span>SECURE_v2</span>
  </div>
  </div>
  </div>
 </div>
 );
}
