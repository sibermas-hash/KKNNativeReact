import type { PropsWithChildren } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Shield, Zap, Activity, Cpu, GraduationCap, Grid3X3, ArrowLeft, Landmark, Verified } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuestLayout({
    title,
    children,
}: PropsWithChildren<{ title?: string }>) {
    return (
        <div className="min-h-screen bg-[#FBFBFA] font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 relative flex items-center justify-center p-6 overflow-hidden">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap" rel="stylesheet" />
            </Head>
            <Head title={title ? `${title} | KKN UIN SAIZU` : 'Otoritas Akses | SIM-KKN'} />

            {/* --- PREMIUM ACADEMIC BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.02]" 
                     style={{ backgroundImage: 'radial-gradient(#10a853 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="absolute top-0 right-[-10%] w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse duration-[10s]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse duration-[8s]" />
            </div>

            <div className="w-full max-w-[560px] relative z-10 py-20">
                {/* --- BRANDING --- */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-10"
                >
                    <Link href="/" className="relative inline-block group">
                        <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-emerald-600/10 blur-[80px] group-hover:bg-emerald-600/20 transition-all rounded-full" />
                        <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-[2.8rem] bg-white border border-slate-100 shadow-2xl shadow-emerald-900/10 transform group-hover:rotate-6 transition-transform duration-700">
                            <Landmark className="w-12 h-12 text-emerald-600 relative z-10" />
                        </div>
                    </Link>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-6">
                            <div className="h-[1px] w-12 bg-slate-200" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.5em] italic leading-none">
                                ACADEMIC_GATEWAY_v4.0
                            </span>
                            <div className="h-[1px] w-12 bg-slate-200" />
                        </div>
                        <h2 className="text-5xl font-black text-slate-950 tracking-tighter leading-none uppercase italic font-sans italic selection:bg-emerald-500">
                            Pusat <span className="font-serif italic font-normal text-emerald-600 capitalize">Otoritas.</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-[400px] mx-auto leading-relaxed italic opacity-70">
                             Lembaga Penelitian dan Pengabdian Masyarakat &bull; UIN SAIZU
                        </p>
                    </div>
                </motion.div>

                {/* --- CONTENT CARD --- */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[4rem] p-12 lg:p-20 border border-slate-100 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.06)] relative overflow-hidden group shadow-emerald-900/5 translate-y-0 hover:-translate-y-2 transition-transform duration-700"
                >
                    {/* Decorative Overlay */}
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
                        <Shield className="w-48 h-48 text-slate-900" />
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
                    className="mt-20 text-center space-y-12"
                >
                    <div className="flex items-center justify-center">
                         <Link href="/" className="px-8 py-3 bg-white border border-slate-100 rounded-full flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-700 hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all italic group">
                             <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Kembali ke Portal Publik
                         </Link>
                    </div>

                    <div className="flex flex-col items-center gap-8 border-t border-slate-100 pt-12">
                        <div className="flex items-center gap-8 text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] italic leading-none">
                            <div className="flex items-center gap-2.5">
                                <Verified size={14} className="text-emerald-500" />
                                ENCRYPTED_HANDSHAKE
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Cpu size={14} />
                                CORE_v4_STABLE
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em] italic opacity-40">
                             &copy; 2026 PUSAT DATA TEKNOLOGI INFORMASI &bull; UIN PROF. KH. SAIZU
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
