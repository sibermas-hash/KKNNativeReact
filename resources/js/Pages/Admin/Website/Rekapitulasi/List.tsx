import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { 
  FileSearch, 
  MapPin, 
  ChevronRight, 
  Trophy, 
  Search, 
  Database, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useState } from 'react';

interface KelompokSummary {
  id: number;
  nama_kelompok: string;
  desa?: string;
  kecamatan?: string;
  periode?: string;
  total_dana: number;
  jumlah_kegiatan: number;
}

interface Props {
  kelompokList: KelompokSummary[];
}

export default function RekapitulasiList({ kelompokList }: Props) {
  const [search, setSearch] = useState('');

  const filteredList = kelompokList.filter(k => 
    k.nama_kelompok.toLowerCase().includes(search.toLowerCase()) ||
    (k.desa && k.desa.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout title="Arsip Rekapitulasi Finansial">
      <Head title="Rekapitulasi | SIKKKN" />

      <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- HEADER COMPACT --- */}
        <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
               <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950 tracking-tight leading-none uppercase">
                Rekapitulasi <span className="text-emerald-500">Anggaran</span>
              </h1>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 italic">Financial Disclosure & Economic Impact</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white border border-emerald-100 rounded-xl p-2 pr-5 shadow-sm">
             <div className="h-10 px-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 border border-emerald-100/50">
                <Trophy size={16} className="text-emerald-500" />
                <span className="text-lg font-black tabular-nums">{kelompokList.length}</span>
             </div>
             <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Unit Terverifikasi</span>
          </div>
        </div>

        {/* --- SEARCH STRIP --- */}
        <div className="relative group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-500">
              <Search size={18} strokeWidth={2.5} />
           </div>
           <input 
             type="text"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Cari Unit Kelompok atau Wilayah Desa..."
             className="w-full h-12 pl-12 pr-4 bg-white border border-emerald-100 rounded-2xl text-sm font-semibold focus:border-emerald-500 shadow-sm outline-none transition-all placeholder:text-emerald-300"
           />
        </div>

        {/* --- DATA CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {filteredList.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-white border border-dashed border-emerald-200 rounded-3xl">
                <FileSearch size={48} className="mx-auto text-emerald-100 mb-4" />
                <p className="text-sm font-bold text-emerald-950 uppercase tracking-widest">Data Audit Nihil</p>
             </div>
           ) : (
             filteredList.map((k) => (
               <Link 
                 key={k.id} 
                 href={route('admin.rekapitulasi.index', { kelompok_id: k.id })}
                 className="group bg-white border border-emerald-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 rounded-3xl p-6 transition-all relative overflow-hidden flex flex-col justify-between"
               >
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500">
                    <ClipboardList size={120} strokeWidth={1} />
                 </div>

                 <div className="space-y-4 relative z-10">
                   <div className="flex items-start justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">{k.periode}</span>
                        <h3 className="text-lg font-black text-emerald-950 leading-tight group-hover:text-emerald-600 transition-colors uppercase">{k.nama_kelompok}</h3>
                     </div>
                     <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                        <ArrowRight size={20} />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-emerald-900/60 font-bold text-xs uppercase tracking-tight">
                        <MapPin size={12} className="text-emerald-400" />
                        <span>{k.desa}, {k.kecamatan}</span>
                     </div>
                     <div className="flex items-center gap-2 text-emerald-900/60 font-bold text-xs uppercase tracking-tight">
                        <Activity size={12} className="text-emerald-400" />
                        <span>{k.jumlah_kegiatan} Inisiatif Program</span>
                     </div>
                   </div>
                 </div>

                 <div className="mt-8 pt-4 border-t border-emerald-50 flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Total Anggaran Terkelola</span>
                       <span className="text-xl font-black text-emerald-950 tabular-nums leading-none tracking-tight">
                          Rp {k.total_dana.toLocaleString('id-ID')}
                       </span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ShieldCheck size={14} className="text-emerald-500" />
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Audited</span>
                    </div>
                 </div>
               </Link>
             ))
           )}
        </div>

        {/* --- MINI GOVERNANCE FOOTER --- */}
        <div className="bg-white rounded-3xl p-8 text-emerald-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-emerald-100 relative overflow-hidden group/footer">
          <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover/footer:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
             <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                <ShieldCheck size={32} className="text-emerald-600" />
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight leading-none text-emerald-950">Protokol Akuntabilitas</h3>
                <p className="text-[10px] font-bold text-emerald-800/60 leading-tight uppercase tracking-widest max-w-xl">
                   Transparansi finansial dalam pengabdian masyarakat. <span className="text-emerald-400">Rekapitulasi ini merupakan agregasi dari swadaya mhs, masyarakat, dan bantuan pemerintah secara real-time.</span>
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 relative z-10 px-6 py-2 bg-emerald-50 rounded-full border border-emerald-100">
             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[10px] font-black tracking-[0.2em] text-emerald-600 uppercase">Live Audit Engine</span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
