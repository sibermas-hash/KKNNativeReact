import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
 Cpu, Activity, Zap, Layers, History, Fingerprint, ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';

interface AiStatusProps {
 status: {
 provider: string;
 is_healthy: boolean;
 endpoint: string;
 model_text: string;
 last_check: string;
 };
 usage: {
 total_prompts: number;
 successful_heals: number;
 };
}

export default function AiStatus({ status, usage }: AiStatusProps) {
 return (
 <AppLayout title="Monitor Sistem AI">
 <Head title="Monitor Sistem AI - Panel Kontrol" />

 <div className="max-w-[1400px] mx-auto space-y-4 pb-10">
 {/* --- MODERN COMPACT HEADER --- */}
 <div className="space-y-2 pt-4 pb-2 border-b border-gray-200">
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
 <span className="text-[11px] font-semibold text-emerald-950 tracking-normal leading-none">Manajemen Digital &middot; Intelegensi Buatan</span>
 </div>
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div className="space-y-1">
 <h1 className="text-2xl font-semibold text-emerald-950 tracking-tight leading-tight">
 Intelegensi Sistem
 </h1>
 <p className="text-xs font-bold text-emerald-900 tracking-tight max-w-xl">
 Sistem pemeliharaan otonom dan intelegensi portal berbasis AI.
 </p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <div className={clsx(
 "px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all",
 status.is_healthy 
 ? "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-md shadow-emerald-900/5" 
 : "bg-rose-50 border-rose-200 text-rose-950 animate-pulse shadow-md shadow-rose-900/10"
 )}>
 <div className={clsx("h-2.5 w-2.5 rounded-full", status.is_healthy ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-rose-500")} />
 <span className="text-xs font-semibold tracking-normal mt-px">
 {status.is_healthy ? 'Sistem Online' : 'Koneksi Terputus'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* --- CORE STATS BENTO ROW --- */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <MetricCore 
 icon={Zap} 
 label="Mesin Intelegensi" 
 value={status.provider} 
 desc={`${status.model_text}`}
 />
 <MetricCore 
 icon={Fingerprint} 
 label="Status Autentikasi" 
 value="TERVERIFIKASI" 
 desc="DashScope Auth Active"
 />
 <MetricCore 
 icon={History} 
 label="Riwayat Pemulihan" 
 value={usage.successful_heals} 
 desc="Tindakan Otonom Tercatat"
 />
 </div>

 {/* --- HIGH DENSITY CONNECTION MAP --- */}
 <div className="bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/5">
 <div className="px-5 py-3 border-b border-emerald-100/40 flex items-center justify-between bg-gradient-to-r from-emerald-50/40 to-transparent">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
 <Activity size={16} strokeWidth={2.5} />
 </div>
 <h2 className="text-sm font-semibold text-emerald-950 tracking-tight ">Diagnostik Sistem</h2>
 </div>
 <span className="text-[11px] font-semibold text-emerald-900 ">Pengecekan Terakhir: {new Date(status.last_check).toLocaleTimeString('id-ID')}</span>
 </div>
 
 <div className="p-5 space-y-5">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="space-y-2 bg-emerald-50/20 p-4 border border-gray-200 rounded-xl">
 <label className="text-[11px] font-semibold text-emerald-900 tracking-normal">Saluran API Endpoint</label>
 <div className="p-3 bg-white border border-emerald-200/60 rounded-lg">
 <code className="text-[11px] font-bold text-emerald-950 break-all leading-relaxed ">
 {status.endpoint}
 </code>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1 bg-emerald-50/20 p-4 border border-gray-200 rounded-xl flex flex-col justify-between">
 <label className="text-[11px] font-semibold text-emerald-900 tracking-normal">Latensi Respons</label>
 <p className="text-xl font-semibold text-emerald-950">1.2s</p>
 <span className="inline-block px-2 py-1 bg-emerald-100/50 text-emerald-950 rounded-md text-[11px] font-semibold mt-2 w-max border border-emerald-200">OPTIMAL</span>
 </div>
 <div className="space-y-1 bg-emerald-50/20 p-4 border border-gray-200 rounded-xl flex flex-col justify-between">
 <label className="text-[11px] font-semibold text-emerald-900 tracking-normal">Akumulasi Request</label>
 <p className="text-xl font-semibold text-emerald-950 tabular-nums">{usage.total_prompts}</p>
 <span className="inline-block px-2 py-1 bg-emerald-100/50 text-emerald-950 rounded-md text-[11px] font-semibold mt-2 w-max border border-emerald-200">TRANSMISI AKTIF</span>
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-emerald-100/40">
 <div className="flex items-center gap-2 mb-3">
 <Layers size={14} strokeWidth={2.5} className="text-emerald-900" />
 <span className="text-[11px] font-semibold text-emerald-900 tracking-normal">Aturan Intelegensi</span>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <ProtocolNode label="Pemulihan Otomatis" />
 <ProtocolNode label="Pengawas Kode" />
 <ProtocolNode label="Audit Log Sistem" />
 <ProtocolNode label="Logika Asisten" />
 </div>
 </div>
 </div>
 </div>

 {/* --- COMPACT GOVERNANCE FOOTER --- */}
 <div className="bg-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-950/20">
 <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5 pointer-events-none" />
 <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 -mr-10 -mt-10 pointer-events-none">
 <ShieldCheck size={200} strokeWidth={0.5} />
 </div>
 <div className="flex items-center gap-5 relative z-10">
 <div className="h-14 w-14 bg-emerald-500 rounded-xl flex shrink-0 items-center justify-center shadow-inner shadow-emerald-400">
 <Cpu size={28} className="text-emerald-950" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-semibold text-white tracking-tight ">Manajemen Digital Aktif</h3>
 <p className="text-[11px] font-bold text-white/80 max-w-4xl tracking-wide">
 Setiap anomali akan dideteksi dan diperbaiki secara otonom melalui protokol pemulihan mandiri untuk kelancaran administrasi KKN.
 </p>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCore({ icon: Icon, label, value, desc }: { icon: any, label: string, value: string | number, desc: string }) {
 return (
 <div className="bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-2xl p-4 flex flex-col justify-between h-32 hover:shadow-lg hover:shadow-emerald-900/5 hover:-translate-y-0.5 hover:border-emerald-300 transition-all group overflow-hidden relative">
 <div className="flex justify-between items-start relative z-10">
 <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
 <Icon size={16} strokeWidth={2.5} />
 </div>
 </div>
 <div className="space-y-1 relative z-10">
 <p className="text-xl font-semibold text-emerald-950 tracking-tight truncate leading-none">{value}</p>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-emerald-950 tracking-normal">{label}</span>
 <span className="text-[10px] font-bold text-emerald-900 truncate opacity-80">{desc}</span>
 </div>
 </div>
 </div>
 );
}

function ProtocolNode({ label }: { label: string }) {
 return (
 <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/60 transition-all hover:bg-emerald-100/50 group">
 <span className="text-[11px] font-semibold text-emerald-950 truncate mr-2">{label}</span>
 <div className="flex items-center gap-1.5 shrink-0">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
 <span className="text-[10px] font-semibold text-emerald-700 ">Aman</span>
 </div>
 </div>
 );
}
