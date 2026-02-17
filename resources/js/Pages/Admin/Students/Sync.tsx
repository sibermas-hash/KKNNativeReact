import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { route } from 'ziggy-js';
import {
    CloudArrowDownIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CpuChipIcon,
    ServerStackIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

interface Props {
    title: string;
}

export default function StudentSync({ title }: Props) {
    const { post, processing } = useForm({});

    const handleSync = () => {
        if (confirm('CRITICAL ACTION: DO YOU AUTHORIZE MASS SCHOLAR DATA INGESTION FROM CENTRAL COMMAND API? THIS PROCESS MAY DISRUPT CURRENT OPS FOR SEVERAL MINUTES.')) {
            post(route('admin.mahasiswa.sync.store'));
        }
    };

    return (
        <AppLayout title="Scholar Nexus Sync">
            <div className="max-w-4xl mx-auto space-y-16 pb-20 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="text-center space-y-6 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
                    <div className="inline-flex p-6 rounded-[2rem] bg-accent-gold/10 border border-accent-gold/20 text-accent-gold shadow-2xl mb-4 group hover:scale-110 transition-transform duration-500">
                        <CloudArrowDownIcon className="w-16 h-16 group-hover:animate-bounce" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-[10px] font-black uppercase tracking-[0.3em]">DATA INGESTION PIPELINE</div>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">{title}</h1>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] max-w-lg mx-auto italic">
                            Automated scholastic data ingestion from central SAIZU mainframe into the KKN tactical registry.
                        </p>
                    </div>
                </div>

                {/* Sync Console */}
                <div className="glass rounded-[3.5rem] p-16 shadow-2xl border-white/10 text-center space-y-12 relative overflow-hidden backdrop-blur-xxl">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-white">
                        <CpuChipIcon className="h-64 w-64 rotate-12" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Authorize Ingestion</h2>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest">System will verify scholastic eligibility and initialize identity tokens automatically.</p>
                    </div>

                    <div className="flex flex-col items-center gap-10">
                        <button
                            onClick={handleSync}
                            disabled={processing}
                            className={`group relative h-24 px-16 rounded-[2.5rem] text-2xl font-black uppercase tracking-widest flex items-center gap-6 transition-all duration-500 border border-white/10 shadow-glow overflow-hidden ${processing
                                    ? 'bg-white/5 text-white/20'
                                    : 'bg-gradient-to-br from-primary to-primary-dark text-white hover:scale-105 active:scale-95 shadow-primary/40'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="w-8 h-8 animate-spin" />
                                    Ingesting...
                                </>
                            ) : (
                                <>
                                    <ArrowPathIcon className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" />
                                    Synchronize Nexus
                                </>
                            )}
                        </button>

                        <div className="flex flex-wrap justify-center gap-6">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <LockClosedIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">ENCRYPTED TUNNEL</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                <ServerStackIcon className="w-4 h-4 text-primary-light" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">MAINFRAME SYNC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Intel */}
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="glass rounded-[3rem] p-10 border-rose-500/20 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-rose-500 group-hover:rotate-12 transition-transform">
                            <ExclamationTriangleIcon className="h-16 w-16" />
                        </div>
                        <div className="flex items-center gap-4 text-rose-400">
                            <h3 className="font-black uppercase tracking-[0.3em] text-xs italic">Ingestion Protocol</h3>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold tracking-widest uppercase leading-relaxed italic border-l-2 border-rose-500/30 pl-6">
                            DUPLICATE IDENTIFIER PROTECTION ACTIVE. SYSTEM WILL CALIBRATE LOCAL DATA AGAINST MAINFRAME RECORDS WITHOUT COMPROMISING TRANSACTIONAL INTEGRITY.
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-[3rem] p-10 border-white/10 space-y-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-white group-hover:-rotate-12 transition-transform">
                            <ShieldCheckIcon className="h-16 w-16" />
                        </div>
                        <div className="flex items-center gap-4 text-accent-gold">
                            <h3 className="font-black uppercase tracking-[0.3em] text-xs italic">Identity Genesis</h3>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold tracking-widest uppercase leading-relaxed italic border-l-2 border-accent-gold/30 pl-6">
                            INITIALIZED SCHOLARS WILL RECEIVE IDENTITY TOKENS. USERNAME: <span className="text-white">NIM (NUMERIC)</span>. DEFAULT ACCESS KEY: <span className="text-white">password123</span>.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
