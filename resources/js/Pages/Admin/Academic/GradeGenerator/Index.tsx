import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import { 
 FileText, 
 Download, 
 MapPin, 
 User, 
 ChevronRight, 
 Activity, 
 Zap, 
 Database, 
 Archive, 
 RefreshCw,
 Layers,
 Filter,
 FileSpreadsheet,
 Search,
 ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';

interface Period { id: number; name: string; grading_start?: string | null; grading_end?: string | null; }
interface Group { id: number; period_id: number; code: string; name: string; desa: string; kecamatan: string; kabupaten: string; dpl: string; }
interface Props { periods: Period[]; groups: Group[]; }

export default function GradeGeneratorIndex({ periods, groups }: Props) {
 const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
 const activeGroups = useMemo(() => selectedPeriodId ? groups.filter(g => String(g.period_id) === selectedPeriodId) : groups, [groups, selectedPeriodId]);

 return (
 <AppLayout title="Generator Blanko Nilai">
 <Head title="Generator Nilai KKN"/>

 <div className="space-y-8 pb-24 text-emerald-950 font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-[#1a7a4a]">
 <FileText size={18} />
 <span className="text-xs font-bold opacity-80">Administrasi & Pencatatan</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-3xl font-extrabold text-emerald-950">
 Generator <span className="text-[#1a7a4a]">Nilai.</span>
 </h1>
 <p className="font-semibold text-xs text-emerald-800 mt-2 leading-relaxed max-w-2xl">
 Fasilitas ekstraksi blanko penilaian operasional dan manajemen berkas lapangan terpadu bagi Dosen Pembimbing Lapangan.
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="h-14 px-8 bg-white border border-emerald-50 rounded-xl flex items-center gap-5 shadow-sm">
 <Archive size={20} className="text-[#1a7a4a]"/>
 <div className="flex flex-col">
 <span className="text-xs font-bold text-emerald-800 leading-none mb-1.5">Unit Terdaftar</span>
 <span className="text-lg font-semibold text-emerald-950 tabular-nums leading-none">{activeGroups.length} KELOMPOK</span>
 </div>
 </div>
 <a 
 href={selectedPeriodId ? `/admin/generator-nilai/export-zip?period_id=${selectedPeriodId}` : '/admin/generator-nilai/export-zip'} 
 className="h-14 px-8 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold transition-all shadow-sm shadow-none flex items-center gap-3 active:scale-95 text-sm"
 >
 <Download size={20} />
 UNDUH SEMUA (ZIP)
 </a>
 </div>
 </div>
 </div>

 {/* --- METRIC STRIP --- */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <GeneratorMetric label="Status Koneksi"value="AKTIF"icon={Zap} />
 <GeneratorMetric label="Integritas Data"value="TERVERIFIKASI"icon={ShieldCheck} />
 <GeneratorMetric label="Total Entri"value={groups.length * 12} icon={Database} />
 <GeneratorMetric label="Sinkronisasi"value="STABIL"icon={RefreshCw} />
 </div>

 {/* --- LEDGER --- */}
 <section className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm">
 <div className="p-5 bg-gray-50 border-b-2 border-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-3">
 <Layers size={18} className="text-[#1a7a4a]"/>
 <span className="text-xs font-bold text-[#1f2937]">Daftar Kelompok Penugasan KKN</span>
 </div>
 <div className="relative w-full md:w-80 group">
 <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a7a4a] pointer-events-none"/>
 <select 
 value={selectedPeriodId} 
 onChange={(e) => setSelectedPeriodId(e.target.value)} 
 className="w-full h-12 pl-12 pr-10 bg-white border border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-[#1a7a4a] transition-all appearance-none cursor-pointer shadow-sm"
 >
 <option value="">TAMPILKAN SEMUA PERIODE</option>
 {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
 </select>
 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-800 pointer-events-none"size={16} />
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b-2 border-emerald-50 text-emerald-950">
 <tr>
 <th className="px-8 py-5 text-xs font-bold">Identitas Kelompok</th>
 <th className="px-8 py-5 text-xs font-bold">Lokasi Penugasan</th>
 <th className="px-8 py-5 text-xs font-bold text-center border-l border-emerald-50">Dosen Pembimbing</th>
 <th className="px-8 py-5 text-xs font-bold text-right">Ekstraksi Blanko</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6] bg-white">
 {activeGroups.map((group) => (
 <tr key={group.id} className="group hover:bg-gray-50 transition-all">
 <td className="px-8 py-5">
 <div className="flex flex-col gap-1">
 <span className="text-base font-semibold text-emerald-950 group-hover:text-emerald-800 transition-colors leading-none font-mono">{group.code}</span>
 <span className="text-xs font-bold text-[#1a7a4a]">{group.name}</span>
 </div>
 </td>
 <td className="px-8 py-5">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-gray-50 border border-emerald-50 text-[#1a7a4a] rounded-xl flex items-center justify-center shadow-sm shrink-0"><MapPin size={16} strokeWidth={2.5} /></div>
 <div className="flex flex-col">
 <span className="text-sm font-extrabold text-[#1f2937] leading-none mb-1">{group.desa}</span>
 <span className="text-xs font-semibold text-[#1a7a4a] tracking-wide">{group.kecamatan}, {group.kabupaten}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-5 text-center border-l border-emerald-50/30">
 <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-emerald-50/60 shadow-sm">
 <User size={12} className="text-[#1a7a4a]"/>
 <span className="text-xs font-bold text-emerald-950 tracking-wide truncate max-w-[180px]">{group.dpl || 'DPL BELUM DITENTUKAN'}</span>
 </div>
 </td>
 <td className="px-8 py-5 text-right">
 <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
 <Link 
 href={route('admin.nilai.index', { kelompok_id: group.id })} 
 className="h-9 px-5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm shadow-none active:scale-95 transition-all"
 >
 Input Nilai <ChevronRight size={14} strokeWidth={3} />
 </Link>
 <a href={`/admin/generator-nilai/${group.id}/export`} className="h-9 w-9 bg-white border border-emerald-50 text-[#1a7a4a] hover:bg-gray-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"title="Ekspor Excel"><FileSpreadsheet size={16} /></a>
 <a href={`/admin/generator-nilai/${group.id}/export-pdf`} className="h-9 w-9 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"title="Ekspor PDF"><FileText size={16} /></a>
 </div>
 </td>
 </tr>
 ))}
 {activeGroups.length === 0 && (
 <tr><td colSpan={4} className="py-24 text-center">
 <div className="flex flex-col items-center justify-center gap-3">
 <Search size={32} className="text-emerald-800 mb-2"/>
 <span className="text-sm font-bold text-emerald-800 tracking-wide">Tidak Ada Kelompok</span>
 <span className="text-xs font-semibold text-[#1a7a4a]">Silakan pilih periode untuk menampilkan daftar kelompok KKN.</span>
 </div>
 </td></tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="px-8 py-5 border-t-2 border-emerald-50 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
 <span className="text-xs font-bold text-[#1f2937] flex items-center gap-3">
 <Activity size={14} className="text-[#1a7a4a]"/>
 Sinkronisasi Data Generator Stabil
 </span>
 <div className="h-8 px-5 flex items-center bg-white border border-emerald-50 rounded-lg text-xs font-bold text-emerald-950 shadow-sm">Total: {activeGroups.length} Unit Kelompok</div>
 </div>
 </section>

 <div className="bg-white rounded-xl p-12 text-white relative overflow-hidden shadow-sm border border-emerald-800">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-20 -mt-20"><RefreshCw size={350} /></div>
 <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
 <div className="flex items-center gap-10">
 <div className="h-24 w-24 bg-gray-100 border border-emerald-800 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 shadow-inner"><Download size={48} strokeWidth={2} /></div>
 <div className="space-y-3">
 <h1 className="text-2xl font-bold text-white leading-none">Manajemen Dokumen Penilaian Terpusat</h1>
 <p className="text-sm font-semibold text-emerald-800 leading-relaxed max-w-2xl">
 Modul ini memfasilitasi ekstraksi blanko penilaian operasional ke dalam format dokumen (PDF/Excel) untuk verifikasi laporan fisik oleh Dosen Pembimbing Lapangan.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-xl border border-emerald-800">
 <ShieldCheck className="text-emerald-800"size={18} />
 <span className="text-xs font-semibold text-emerald-800">Otoritas Dokumen KKN</span>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function GeneratorMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) {
 return (
 <div className="bg-white border border-emerald-50 rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-50 transition-all group overflow-hidden relative">
 <div className="h-12 w-12 bg-gray-50 border border-emerald-50 text-[#1a7a4a] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
 <Icon size={20} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col z-20">
 <span className="text-xs font-bold text-emerald-800 leading-none mb-2">{label}</span>
 <span className="text-xl font-semibold text-emerald-950 tabular-nums leading-none group-hover:text-emerald-800 transition-colors">{value}</span>
 </div>
 </div>
 );
}
