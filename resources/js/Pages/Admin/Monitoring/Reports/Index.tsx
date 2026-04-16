import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Layers, 
  Activity, 
  FileCheck,
  Cpu,
  Target,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  MoreVertical,
  FileSearch,
  ShieldCheck,
  Archive,
  Zap,
  RefreshCw,
  SearchCode,
  Trophy,
  History,
  Briefcase,
  FilePlus,
  ArrowDownToLine
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { LucideIcon } from '@/types';

interface ReportRow {
  id: number; title: string; type: string; status: string; file_name: string; submitted_at: string | null; user: { name: string; }; group: { name: string; village: string; };
}
interface Props { reports: { data: ReportRow[]; meta?: Record<string, any>; }; summary: { total_reports: number; pending_review: number; }; }

const typeLabels: Record<string, string> = {
  final_report: 'LAPORAN_AKHIR', 
  book_anthology: 'ANTOLOGI_KKN', 
  scholarly_article: 'ARTIKEL_PENGABDIAN', 
  village_map: 'PETA_ASET_DESA', 
  video_documentation: 'DOKUMENTASI_VIDEO', 
  photo_documentation: 'DOKUMENTASI_FOTO', 
  attendance_sheet: 'DAFTAR_HADIR', 
  activity_proposal: 'PROPOSAL_DESIGN', 
  evaluation_report: 'EVALUASI_REFLEKSI',
};

export default function ReportsIndex({ reports, summary }: Props) {
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return reports.data;
    return reports.data.filter((report) => {
      const haystack = [report.title, report.type, report.user.name, report.group.name, report.group.village, report.file_name].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [reports.data, search]);

  return (
    <AppLayout title="Audit Pustaka Aset Akademik">
      <Head title="Pustaka Laporan" />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-6 pt-12">
           <div className="flex items-center gap-3 text-emerald-600">
              <Archive size={20} />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Digital Asset Vault</span>
           </div>
           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                  Pustaka <span className="text-emerald-500">Aset.</span>
                </h1>
                <p className="text-sm font-semibold text-emerald-700/80 tracking-tight leading-relaxed max-w-2xl mt-4">
                  Repositori terpusat luaran akademik dan dokumentasi pengabdian masyarakat. Audit seluruh aset digital untuk memastikan kelengkapan portofolio institusi.
                </p>
              </div>
              <div className="shrink-0">
                  <div className="h-20 px-10 bg-emerald-600 border-2 border-emerald-500 rounded-[2rem] flex items-center gap-8 text-white shadow-2xl shadow-emerald-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-2">Total Aset KKN</span>
                      <span className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">{(summary.total_reports || 0).toLocaleString('id-ID')} FILES</span>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <Trophy size={28} className="text-white drop-shadow-lg" />
                  </div>
              </div>
           </div>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricCard label="Vault Status" value="ONLINE_SYNC" icon={Zap} desc="Cloud Storage Active" />
           <MetricCard label="Audit Pending" value={summary.pending_review} icon={Activity} type={summary.pending_review > 0 ? 'warning' : 'success'} desc="Awaiting Verification" />
           <MetricCard label="Library Node" value="vLIB 2.0" icon={Cpu} desc="Security Architecture" />
           <MetricCard label="Asset Security" value="SIGNED_OFF" icon={ShieldCheck} desc="Integrity Verified" />
        </div>

        {/* --- DATA TABLE CARD --- */}
        <section className="bg-white border-2 border-emerald-50 rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
           <div className="px-10 py-10 bg-emerald-50/20 border-b-2 border-emerald-50 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 bg-white rounded-[1.5rem] border-2 border-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Layers size={32} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-1.5">Manifest Komponen Riset</h3>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Direktori Inventori Produk Akademik KKN</p>
                 </div>
              </div>

              <div className="flex items-center gap-4 w-full lg:w-auto">
                 <div className="relative flex-1 lg:w-72 group">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-300 group-focus-within:text-emerald-500 transition-colors" strokeWidth={3} />
                    <input 
                       value={search} 
                       onChange={e => setSearch(e.target.value)} 
                       className="w-full h-14 pl-14 pr-6 bg-white border-2 border-emerald-50 rounded-2xl text-[11px] font-black text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-200 uppercase tracking-widest shadow-sm" 
                       placeholder="CARI IDENTIFIER ASET..." 
                    />
                 </div>
                 <button className="h-14 w-14 bg-emerald-950 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all active:scale-90 shadow-xl">
                    <Filter size={20} strokeWidth={3} />
                 </button>
              </div>
           </div>

           <div className="overflow-x-auto min-h-[500px]">
             <table className="min-w-full text-left border-collapse whitespace-nowrap">
               <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                 <tr>
                   <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Identitas Aset Digital</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Unit / Dosen</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Kategori Aset</th>
                   <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Integritas</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Kontrol Biner</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-emerald-50">
                 {filteredReports.length === 0 ? (
                    <EmptyState />
                 ) : (
                   filteredReports.map((report) => (
                    <tr key={report.id} className="group hover:bg-emerald-50/30 transition-all font-sans">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 bg-white border-2 border-emerald-50 text-emerald-200 rounded-[1.25rem] flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                             <FileText size={22} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-tight group-hover:text-emerald-700 transition-colors max-w-[400px] truncate mb-2">{report.title}</span>
                            <span className="text-[9px] font-black text-emerald-300 tracking-widest font-mono uppercase leading-none">{report.file_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           <span className="text-[11px] font-black text-emerald-950 uppercase leading-none">{report.group.name}</span>
                           <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">{report.user.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <span className="inline-flex px-4 py-1.5 bg-white border-2 border-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm">
                           {typeLabels[report.type] || report.type}
                        </span>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <div className="scale-110 flex justify-center">
                           <StatusBadge status={report.status} />
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all gap-4">
                           <Link 
                             href={`/admin/laporan/${report.id}/unduh`}
                             className="h-10 px-5 bg-white border-2 border-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-sm group-hover:border-emerald-200"
                           >
                              INJECT_ASSET <ArrowDownToLine size={14} strokeWidth={3} />
                           </Link>
                           <button className="h-10 w-10 bg-white border-2 border-emerald-50 text-emerald-300 hover:text-emerald-950 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border-2">
                             <MoreVertical size={16} strokeWidth={3} />
                           </button>
                        </div>
                      </td>
                    </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>

           {/* PAGINATION */}
           <div className="px-10 py-8 border-t-2 border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                 Data Halaman <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{reports.meta?.current_page || 1}</strong> Per <strong className="text-emerald-950 text-xs tabular-nums tracking-tight">{(summary.total_reports || 0).toLocaleString('id-ID')}</strong> Entitas Pustaka
              </span>
              {reports.meta && <Pagination meta={reports.meta as any} />}
           </div>
        </section>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
             <BookOpen size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <ShieldCheck size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Pengawasan Aset Akademis</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Protokol Verifikasi Produk Digital</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                 Seluruh berkas yang terunggah dalam pustaka aset ini melewati protokol verifikasi integritas data berlapis untuk akuntabilitas operasional UIN SAIZU. Arsip digital ini merupakan aset intelektual publik yang merepresentasikan kontribusi nyata sivitas akademika dalam pemberdayaan masyarakat.
              </p>
            </div>
            <div className="h-20 w-px bg-white/10 hidden lg:block" />
            <div className="flex flex-col items-end shrink-0 hidden lg:flex">
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 opacity-60">STORAGE SECURITY</span>
               <span className="text-2xl font-black text-white italic tracking-tighter uppercase uppercase text-emerald-400">AMANKAN</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, desc, type }: { label: string; value: any; icon: any; desc: string; type?: 'success' | 'warning' }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx(
         "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2",
         type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-emerald-50 border-emerald-50 text-emerald-600'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-20">
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase leading-none mb-3">{label}</span>
        <span className="text-2xl font-black text-emerald-950 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors uppercase mb-1.5">{value}</span>
        <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest opacity-60 leading-none">{desc}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={10} className="px-10 py-32 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <SearchCode size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">Vault Buffer Nihil</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">Tidak ditemukan aliran data aset untuk parameter filter saat ini.</p>
          </div>
      </td>
    </tr>
  );
}
