import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { Filter, Layers, FileSpreadsheet, FileText, Download, MapPin, User, ChevronRight, Activity, Zap, Cpu, Database, Archive, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface Period { id: number; name: string; grading_start?: string | null; grading_end?: string | null; }
interface Group { id: number; period_id: number; code: string; name: string; desa: string; kecamatan: string; kabupaten: string; dpl: string; }
interface Props { periods: Period[]; groups: Group[]; }

import type { LucideIcon } from '@/types';

export default function GradeGeneratorIndex({ periods, groups }: Props) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const activeGroups = useMemo(() => selectedPeriodId ? groups.filter(g => String(g.period_id) === selectedPeriodId) : groups, [groups, selectedPeriodId]);

    return (
    <AppLayout title="Generator Blanko Nilai">
      <Head title="Generator Nilai KKN" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <FileText size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Akademik & Penilaian</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Generator <span className="text-emerald-500">Nilai.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Otoritas Ekstraksi Blanko Penilaian dan Manajemen Berkas Lapangan Terpadu Mahasiswa KKN
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                        <Archive size={18} className="text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Unit Aktif</span>
                            <span className="text-sm font-black text-slate-900 tabular-nums leading-none tracking-tight">{activeGroups.length} KELOMPOK</span>
                        </div>
                    </div>
                    <a 
                        href={selectedPeriodId ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}` : '/admin/generator-nilai/export-zip'} 
                        className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Download size={18} />
                        UNDUH SEMUA (ZIP)
                    </a>
                </div>
            </div>
        </div>

                {/* --- METRIC STRIP --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <GeneratorMetric label="Authority Status" value="ACTIVE_SYNC" icon={Zap} />
                    <GeneratorMetric label="IOPS Status" value="LATENCY_LOW" icon={Activity} />
                    <GeneratorMetric label="Data Points" value={groups.length * 12} icon={Database} />
                    <GeneratorMetric label="Encryption" value="vAES 256" icon={Cpu} />
                </div>

                {/* --- LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                            <Layers size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Grading Logic Manifest</span>
                         </div>
                         <div className="relative w-full md:w-64 group">
                             <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                             <select value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)} className="w-full h-8 pl-8 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase italic outline-none focus:bg-white transition-all appearance-none cursor-pointer">
                                 <option value="">GLOBAL_PERIOD_VIEW</option>
                                 {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                             </select>
                         </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Group Identification</th>
                                    <th className="px-6 py-4">Territory Node</th>
                                    <th className="px-6 py-4 text-center">Assigned Overseer</th>
                                    <th className="px-6 py-4 text-right">Binary Extraction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeGroups.map((group) => (
                                    <tr key={group.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[14px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors italic uppercase leading-tight font-mono">{group.code}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">{group.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shadow-sm shrink-0"><MapPin size={14} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-700 uppercase leading-tight italic">{group.desa}</span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{group.kecamatan}, {group.kabupaten}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                <User size={10} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic truncate max-w-[150px]">{group.dpl || 'NULL_OVERSEER'}</span>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <Link href={`/admin/grades?group_id=${group.id}`} className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 group/btn">
                                                    Grade_Auth <ChevronRight size={12} className="text-white group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                                <a href={`/admin/generator-nilai/${group.id}/export`} className="h-8 w-8 bg-white border border-slate-200 text-emerald-500 hover:bg-emerald-50 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90" title="Export XLSX"><FileSpreadsheet size={14} /></a>
                                                <a href={`/admin/generator-nilai/${group.id}/export-pdf`} className="h-8 w-8 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90" title="Export PDF"><FileText size={14} /></a>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeGroups.length === 0 && (
                                    <tr><td colSpan={4} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Logic buffer null. Select period node.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Transmission Nominal • Binary Sync Stable.</span>
                        <div className="text-[10px] font-black text-slate-800 uppercase italic">Manifest Count: {activeGroups.length} Units</div>
                    </div>
                </section>

                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><Cpu size={350} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md text-white"><Download size={48} strokeWidth={1.5} /></div>
                            <div className="space-y-3">
                                <h1 className="text-2xl font-black uppercase tracking-tight italic text-white leading-none">Institutional Grade Authority</h1>
                                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl italic opacity-80">Modul ini memfasilitasi ekstraksi blanko penilaian operasional ke dalam format binary (PDF/XLSX) untuk verifikasi lapangan oleh Dewan Pembimbing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function GeneratorMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col z-10">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
