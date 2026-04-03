import type { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { Globe } from 'lucide-react';

export default function GuestLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900 selection:bg-primary/20 selection:text-primary-dark relative flex items-center justify-center p-6">
      <Head title={title ? `${title} - KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

      {/* STATIC BACKGROUND OVERLAY - NO ANIMATION FOR STABILITY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-white from-primary-DEFAULT/5 via-white to-emerald-500/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      </div>

      <div className="w-full max-w-[440px] relative z-50">
        {/* BRANDING */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white border border-slate-100 mb-6 mx-auto">
            <Globe className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900  leading-none">
            UIN <span className="text-primary italic">SAIZU</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
             <div className="h-px w-8 bg-slate-200" />
             <p className="text-[11px] font-bold text-slate-400 uppercase 
               Portal KKN
             </p>
             <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>

        {/* CONTENT CARD - RE-STABILIZED */}
        <div className="bg-white rounded-lg p-8 sm:p-12 border border-slate-100 relative z-50">
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Accent Bottom */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white from-transparent via-primary/30 to-transparent" />
        </div>

        {/* CLEAN FOOTER */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase 
            Lembaga Penelitian dan Pengabdian kepada Masyarakat
          </p>
          <div className="flex justify-center items-center gap-3 text-[10px] text-slate-300 font-bold">
            <span>v3.2 EMERALD</span>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <span>SECURE_SESSION_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
