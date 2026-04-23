import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Camera,
  MapPin,
  Activity,
  Layers,
  LayoutGrid,
  CornerDownRight,
  Search,
  ArrowUpDown,
  Filter,
  List as ListIcon,
  Calendar as CalendarIconLucide,
  ChevronDown,
  ClipboardList,
  BadgeCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';
import PremiumCalendar from '@/Components/Premium/PremiumCalendar';

interface Report {
  id: number;
  date: string;
  title: string;
  status: string;
  activity: string;
  reflection: string | null;
  file_kegiatan: FileKegiatan[];
  ai_summary?: string;
  ai_analysis?: {
    summary: string;
    abcd_compliance: number;
    quality_score: number;
    feedback: string;
    tags: string[];
  };
}

interface Props {
  reports: {
    data: Report[];
    total: number;
    links: Array<{ name: string; label?: string; url?: string; icon?: LucideIcon; active?: boolean }>;
    current_page: number;
    last_page: number;
  };
  flash: {
    success?: string;
    error?: string;
  };
}

interface FileKegiatan {
  id: number;
  file_path: string;
  file_name?: string;
  preview_url: string;
}

export default function DailyReportIndex({ reports, flash }: Props) {
  const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'calendar'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Report; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const statusColors: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    submitted: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200/50',
      dot: 'bg-amber-500',
    },
    approved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      ring: 'ring-emerald-200/50',
      dot: 'bg-emerald-500',
    },
    revision: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200/50',
      dot: 'bg-rose-500',
    },
  };

  const statusLabels: Record<string, string> = {
    submitted: 'Menunggu Review',
    approved: 'Lulus Verifikasi',
    revision: 'Instruksi Revisi',
  };

  const processedReports = useMemo(() => {
    let filtered = reports.data.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.activity.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal !== 'string' || typeof bVal !== 'string') return 0;
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [reports.data, searchQuery, statusFilter, sortConfig]);

  const toggleSort = (key: keyof Report) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <AppLayout title="Operational Logbook">
      <Head title="Logbook Harian | SIBERDAYA" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* --- DYNAMIC HEADER & CONTROLS --- */}
        <div className="bg-white rounded-[3rem] p-10 border border-emerald-50 shadow-sm space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="h-16 w-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                 <ClipboardList size={32} />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-emerald-950 tracking-tight uppercase leading-none mb-1">Logbook Harian</h1>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manajemen Aktivitas & Pelaporan</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setViewMode('timeline')}
                  className={clsx("p-3 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest", viewMode === 'timeline' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-emerald-900")}
                >
                  <Activity size={16} /> Timeline
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={clsx("p-3 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest", viewMode === 'table' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-emerald-900")}
                >
                  <ListIcon size={16} /> Tabel
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={clsx("p-3 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest", viewMode === 'calendar' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-emerald-900")}
                >
                  <CalendarIconLucide size={16} /> Kalender
                </button>
              </div>

              <Link
                href={route('student.laporan-harian.create')}
                className="px-8 py-4 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-3"
              >
                <Plus size={16} strokeWidth={3} /> Tambah Laporan
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-8 border-t border-emerald-50">
             <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari aktivitas atau judul laporan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                />
             </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-6 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                >
                   <option value="all">Semua Status</option>
                   <option value="submitted">Menunggu</option>
                   <option value="approved">Diterima</option>
                   <option value="revision">Revisi</option>
                </select>
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                   <Filter size={20} />
                </div>
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT DISPLAY --- */}
        <div className="relative">
          <AnimatePresence mode="wait">
            
            {viewMode === 'calendar' && (
              <motion.div 
                key="calendar-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto"
              >
                <PremiumCalendar 
                  currentDate={calendarDate}
                  onDateChange={setCalendarDate}
                  reports={reports.data.map(r => ({ date: r.date, status: r.status as any }))}
                  onSelectDate={(date) => {
                    setSearchQuery(date.toISOString().split('T')[0]);
                    setViewMode('timeline');
                  }}
                />
              </motion.div>
            )}

            {viewMode === 'table' && (
              <motion.div 
                key="table-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] overflow-hidden border border-emerald-50 shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-50/50">
                        <th 
                          onClick={() => toggleSort('date')}
                          className="p-6 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] cursor-pointer hover:bg-emerald-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">Tanggal <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="p-6 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Judul Aktivitas</th>
                        <th className="p-6 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Status</th>
                        <th className="p-6 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Analisis AI</th>
                        <th className="p-6 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {processedReports.map((report) => (
                        <React.Fragment key={report.id}>
                          <tr className={clsx("group hover:bg-emerald-50/20 transition-all", expandedId === report.id && "bg-emerald-50/10")}>
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-emerald-950">
                                  {new Date(report.date).getDate()} {new Date(report.date).toLocaleDateString('id-ID', { month: 'short' })}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(report.date).getFullYear()}</span>
                              </div>
                            </td>
                            <td className="p-6 max-w-md">
                               <p className="text-sm font-black text-emerald-950 mb-1 truncate">{report.title}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate opacity-70">
                                 {report.activity.substring(0, 80)}...
                               </p>
                            </td>
                            <td className="p-6">
                               <span className={clsx(
                                 "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                                 statusColors[report.status].bg,
                                 statusColors[report.status].text
                               )}>
                                 <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[report.status].dot)} />
                                 {statusLabels[report.status]}
                               </span>
                            </td>
                            <td className="p-6">
                               {report.ai_analysis ? (
                                 <div className="flex items-center gap-2">
                                   <div className="h-2 w-12 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500" 
                                        style={{ width: `${report.ai_analysis.abcd_compliance * 10}%` }} 
                                      />
                                   </div>
                                   <span className="text-[10px] font-black text-emerald-600">{report.ai_analysis.abcd_compliance}/10</span>
                                 </div>
                               ) : '-'}
                            </td>
                            <td className="p-6">
                               <div className="flex items-center gap-2">
                                 <button 
                                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                                  className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                 >
                                   <ChevronDown size={16} className={clsx("transition-transform", expandedId === report.id && "rotate-180")} />
                                 </button>
                                 <Link 
                                  href={route('student.laporan-harian.edit', report.id)}
                                  className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                 >
                                   <ChevronRight size={16} />
                                 </Link>
                               </div>
                            </td>
                          </tr>
                          {expandedId === report.id && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="p-8 bg-[#F8FAF9] border-y border-emerald-50/50"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                     <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                           <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                           <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Narasi Aktivitas</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                          "{report.activity}"
                                        </p>
                                        <div className="pt-4 flex gap-2">
                                           {report.file_kegiatan.map((file, i) => (
                                              <img key={i} src={file.preview_url} alt={`Foto Kegiatan ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-sm" />
                                           ))}
                                        </div>
                                     </div>
                                     <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                           <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                           <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Analisis & Feedback</span>
                                        </div>
                                        {report.ai_analysis ? (
                                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50/50">
                                             <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                               {report.ai_analysis.feedback}
                                             </p>
                                          </div>
                                        ) : (
                                          <p className="text-xs font-bold text-slate-400 uppercase italic">Belum ada feedback dari DPL.</p>
                                        )}
                                     </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {viewMode === 'timeline' && (
              <motion.div 
                key="timeline-view"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-6"
              >
                {processedReports.map((report) => (
                  <motion.div
                    key={report.id}
                    variants={cardVariants}
                    className="group bg-white rounded-[3rem] p-8 border border-emerald-50 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 flex flex-col md:flex-row gap-8 overflow-hidden relative"
                  >
                    <div className="absolute left-[39px] top-0 bottom-0 w-px bg-emerald-50 hidden md:block" />

                    <div className="relative z-10 shrink-0">
                       <div className="h-20 w-20 rounded-[1.5rem] bg-white border-2 border-emerald-50 flex flex-col items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-all duration-500">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {new Date(report.date).toLocaleDateString('id-ID', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-black leading-none">{new Date(report.date).getDate()}</span>
                       </div>
                    </div>

                    <div className="flex-1 space-y-6">
                       <div className="flex flex-wrap items-center gap-3">
                          <span className={clsx(
                             "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2",
                             statusColors[report.status].bg,
                             statusColors[report.status].text
                          )}>
                             <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[report.status].dot)} />
                             {statusLabels[report.status]}
                          </span>
                          {report.reflection && (
                             <span className="px-4 py-1.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={10} /> Refleksi Aktif
                             </span>
                          )}
                       </div>

                       <div className="space-y-3">
                          <h2 className="text-2xl font-black text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-none">
                            {report.title}
                          </h2>
                          <div className="flex items-start gap-4 p-4 bg-[#F8FAF9] rounded-2xl border border-emerald-50/50">
                             <CornerDownRight size={20} className="text-emerald-200 shrink-0" />
                             <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                               "{report.activity}"
                             </p>
                          </div>
                       </div>

                       {report.ai_analysis && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                   <LayoutGrid size={18} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kepatuhan ABCD</p>
                                   <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-emerald-500" style={{ width: `${report.ai_analysis.abcd_compliance * 10}%` }} />
                                      </div>
                                      <span className="text-xs font-black text-emerald-950">{report.ai_analysis.abcd_compliance}/10</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                   <BadgeCheck size={18} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Skor Kualitas</p>
                                   <span className="text-xs font-black text-emerald-950">{report.ai_analysis.quality_score}% Excellent</span>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="md:w-64 shrink-0 flex items-center justify-center md:justify-end">
                       <div className="flex -space-x-4">
                          {report.file_kegiatan.slice(0, 3).map((file, i) => (
                             <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              className="h-24 w-24 rounded-[1.5rem] border-4 border-white bg-slate-100 overflow-hidden shadow-lg"
                             >
                                <img src={file.preview_url} alt={`Pratinjau Foto ${i + 1}`} className="h-full w-full object-cover" />
                             </motion.div>
                          ))}
                          {report.file_kegiatan.length > 3 && (
                             <div className="h-24 w-24 rounded-[1.5rem] border-4 border-white bg-emerald-950 flex items-center justify-center text-white text-xs font-black shadow-lg">
                                +{report.file_kegiatan.length - 3}
                             </div>
                          )}
                          {report.file_kegiatan.length === 0 && (
                             <div className="h-24 w-24 rounded-[1.5rem] border-2 border-dashed border-emerald-100 bg-slate-50 flex items-center justify-center text-slate-200">
                                <Camera size={24} />
                             </div>
                          )}
                       </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* --- DYNAMIC PAGINATION --- */}
        {reports.links.length > 3 && viewMode !== 'calendar' && (
          <div className="flex justify-center pt-10">
            <div className="bg-white p-2 rounded-[2rem] border border-emerald-50 shadow-sm flex items-center gap-2">
               {reports.links.map((link, i) => (
                 <Link
                   key={i}
                   href={link.url}
                   dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                   className={clsx(
                     'h-12 min-w-[48px] px-4 flex items-center justify-center rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all',
                     link.active
                       ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-900/20'
                       : 'text-slate-400 hover:bg-slate-50 hover:text-emerald-950',
                   )}
                 />
               ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
