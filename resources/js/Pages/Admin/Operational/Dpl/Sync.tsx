import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  RefreshCw,
  Users,
  Link2,
  Clock3,
  ShieldCheck,
  Database,
  ListFilter,
  Binary,
  Zap,
  CheckCircle2,
  Info,
  ChevronRight,
  ArrowRight,
  Target,
  Activity,
  Cpu
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  summary: {
    local_lecturers: number;
    with_master_link: number;
    last_synced_at: string | null;
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) return 'NEVER INITIALIZED';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function DplSync({ title, summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({
    nip_list: '',
  });

  function submitBulk() {
    bulkForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    targetedForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  return (
    <AppLayout title="Data Ingestion Protocol">
      <Head title="Sinkronisasi Data Master | SIKKKN" />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
      >
        {/* --- COMMAND HEADER --- */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Data Ingestion Protocol</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                    Data <span>Ingestion.</span>
                </h1>
                <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                    Sinkronisasi basis data personalia. <br />
                    <span className="text-slate-900 not-italic">Kalibrasi registry lokal terhadap Master Data Universitas untuk validitas otentikasi.</span>
                </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                <div className="flex items-center gap-6 relative z-10">
                     <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                          <Activity size={28} />
                     </div>
                     <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Last Transmission</p>
                          <p className="text-xl font-black tracking-tight uppercase leading-none">{formatSyncTime(summary.last_synced_at)}</p>
                     </div>
                </div>
            </div>
        </motion.div>

        {/* --- TELEMETRY BENTO MATRIX --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard label="Total Registry" value={summary.local_lecturers.toLocaleString()} icon={Users} color="slate" />
            <MetricCard label="Master Linkage" value={summary.with_master_link.toLocaleString()} icon={Link2} color="emerald" />
            <MetricCard label="Registry Status" value="VALIDATED" icon={ShieldCheck} color="emerald" isText />
        </motion.div>

        {/* --- SECURITY PROTOCOL ALERT --- */}
        <motion.div variants={itemVariants} className="bg-emerald-600 rounded-[3.5rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl shadow-emerald-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <Cpu size={240} strokeWidth={1} />
            </div>
            <div className="flex items-center gap-10 relative z-10">
                <div className="h-24 w-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20 text-white shadow-2xl group-hover:scale-105 transition-transform">
                    <Binary size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Secure Synchronization Protocol</h2>
                    <p className="text-emerald-50/70 max-w-2xl text-lg font-medium leading-relaxed italic">
                        Instruksi penarikan data langsung melalui API terpusat. Harap pastikan sinkronisasi dilakukan hanya setelah Master Data universitas diverifikasi.
                    </p>
                </div>
            </div>
            <div className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] relative z-10 shadow-2xl flex items-center gap-3">
                <ShieldCheck size={18} strokeWidth={3} className="text-emerald-600" />
                Network Node Secured
            </div>
        </motion.div>

        {/* --- INGESTION CONTROLS --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Bulk Synchronizer */}
            <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col group/panel">
                <div className="p-12 space-y-10 flex-1">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-slate-900 text-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover/panel:rotate-12 transition-transform">
                            <Database size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Bulk Cluster Sync</h3>
                            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Massive Registry Update</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-6">
                        <div className="flex gap-4 text-slate-400">
                            <Info size={20} className="shrink-0 text-emerald-500" />
                            <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                Prosedur kalibrasi total terhadap seluruh metadata personalia. Eksekusi ini mencakup:
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <ProtocolCheck label="Identity Verification" active />
                            <ProtocolCheck label="Faculty Mapping Sync" active />
                            <ProtocolCheck label="Metadata Normalization" active />
                        </div>
                    </div>
                </div>
                <div className="px-12 py-10 bg-slate-900 flex justify-end">
                    <Button
                        onClick={submitBulk}
                        disabled={bulkForm.processing || targetedForm.processing}
                        className="h-20 px-12 bg-emerald-600 hover:bg-white hover:text-slate-950 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30"
                    >
                        {bulkForm.processing ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                        {bulkForm.processing ? 'Transmitting Data...' : 'Execute Bulk Transmission'}
                    </Button>
                </div>
            </motion.section>

            {/* Targeted Synchronizer */}
            <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col group/panel">
                <div className="p-12 space-y-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover/panel:rotate-12 transition-transform">
                            <Target size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Targeted Vector Sync</h3>
                            <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Specific Node Refresh</p>
                        </div>
                    </div>

                    <form onSubmit={submitTargeted} className="space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Vector ID (NIP) List</label>
                            <textarea
                                value={targetedForm.data.nip_list}
                                onChange={(e) => targetedForm.setData('nip_list', e.target.value)}
                                className="w-full flex-1 px-8 py-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-sm font-black focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300 font-mono tracking-tight uppercase"
                                placeholder="INPUT NIP IDENTIFIERS (NEW LINE SEPARATED)..."
                                rows={6}
                            />
                        </div>
                        <div className="flex justify-end">
                             <Button
                                type="submit"
                                disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nip_list.trim() === ''}
                                className="h-20 px-12 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl transition-all flex items-center gap-4 active:scale-95 disabled:opacity-20"
                            >
                                {targetedForm.processing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                                {targetedForm.processing ? 'Injecting Nodes...' : 'Inject Targeted Nodes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.section>
        </div>
      </motion.div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color, isText = false }: { label: string; value: string | number; icon: any; color: 'emerald' | 'slate'; isText?: boolean }) {
    return (
        <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-all duration-700">
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="flex items-center gap-8 relative z-10">
                <div className={clsx(
                    "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={28} strokeWidth={2.5} />
                </div>
                <div>
                   <p className={clsx("font-black text-slate-900 tracking-tighter uppercase leading-none", isText ? "text-2xl" : "text-4xl")}>
                       {typeof value === 'number' ? value.toLocaleString() : value}
                   </p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60 italic">{label}</p>
                </div>
            </div>
        </div>
    );
}

function ProtocolCheck({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <div className="flex items-center gap-5 group/check">
             <div className={clsx(
                 "h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all",
                 active ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/20" : "bg-white border-slate-200 text-slate-200"
             )}>
                  <ShieldCheck size={18} strokeWidth={3} />
             </div>
             <span className={clsx(
                 "text-[10px] font-black uppercase tracking-[0.3em] leading-none",
                 active ? "text-slate-900 italic" : "text-slate-300"
             )}>{label}</span>
        </div>
    );
}
