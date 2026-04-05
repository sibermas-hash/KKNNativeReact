import type { PropsWithChildren } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Shield, Zap, Activity, Cpu, GraduationCap, Grid3X3, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuestLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="min-h-screen bg-[#fcfcfc] font-sans text-slate-700 selection:bg-emerald-100 selection:text-emerald-900 relative flex items-center justify-center p-6 overflow-hidden">
            <Head title={title ? `${title} | KKN UIN SAIZU` : 'Otoritas Akses | SIM-KKN'} />

            {/* --- PREMIUM ACADEMIC BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#10a853 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-400/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[540px] relative z-10 py-20">
                {/* --- BRANDING --- */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-8"
                >
                    <Link href="/" className="relative inline-block group">
                        <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full animate-pulse" />
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-emerald-600/5 transform hover:rotate-3 transition-transform duration-500">
                            <GraduationCap className="w-12 h-12 text-emerald-600 relative z-10" />
                        </div>
                    </Link>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-[1px] w-12 bg-slate-100" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] italic">
                                UIN_SAIZU_PORTAL
                            </span>
                            <div className="h-[1px] w-12 bg-slate-100" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">
                            Otoritas <span className="text-emerald-600">Akses.</span>
                        </h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[360px] mx-auto leading-relaxed italic opacity-80">
                             Pusat Manajemen Kuliah Kerja Nyata Terpadu &bull; LPPM
                        </p>
                    </div>
                </motion.div>

                {/* --- CONTENT CARD --- */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group shadow-emerald-600/5"
                >
                    {/* Decorative Overlay */}
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
                        <Activity className="w-40 h-40 text-emerald-600" />
                    </div>
                    
                    <div className="relative z-10">
                        {children}
                    </div>
                </motion.div>

                {/* --- FOOTER TERMINAL --- */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 text-center space-y-10"
                >
                    <div className="flex items-center justify-center gap-10">
                         <Link href="/" className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors italic group">
                             <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Kembali ke Portal Beranda
                         </Link>
                    </div>

                    <div className="flex flex-col items-center gap-6 border-t border-slate-100 pt-10">
                        <div className="flex items-center gap-6 text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] italic shadow-sm">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-3 h-3" />
                                v3.5 PREMIUM_SYNC
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                                GEOSPATIAL_READY
                            </div>
                        </div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.6em] italic">
                             &copy; 2026 PUSAT DATA &bull; UIN PROF. KH. SAIZU
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function clsx(...classes: Array<string | boolean | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}
