import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { 
 FileSearch, 
 MapPin, 
 Trophy, 
 Search, 
 Database, 
 Activity, 
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
 <AppLayout title="Rekapitulasi Finansial">
 <Head title="Rekapitulasi Anggaran"/>

 <div className="space-y-6 font-sans pb-12">
 {/* HEADER SECTION */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <Database size={16} className="text-[#1a7a4a]"/>
 <span className="text-sm font-medium text-emerald-800">Website Publik</span>
 </div>
 <h1 className="text-2xl font-bold text-emerald-950 leading-tight">Rekapitulasi Anggaran</h1>
 <p className="text-sm text-emerald-800 max-w-2xl mt-1">
 Laporan penggunaan dana swadaya dan kegiatan per kelompok KKN.
 </p>
 </div>

 <div className="flex items-center gap-4 shrink-0">
 <div className="px-4 py-2 bg-white border border-emerald-50 rounded-lg shadow-sm flex items-center gap-3">
 <Trophy size={18} className="text-[#1a7a4a]"/>
 <div className="flex flex-col">
 <span className="text-xs font-medium text-emerald-800">Total Kelompok</span>
 <span className="text-sm font-semibold text-emerald-950">{kelompokList.length} Unit Tersedia</span>
 </div>
 </div>
 </div>
 </div>

 {/* SEARCH BAR */}
 <div className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800"/>
 <input 
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Cari kelompok atau wilayah..."
 className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-md text-sm text-emerald-950 focus:border-[#1a7a4a] focus:ring-[#1a7a4a] shadow-sm transition-all"
 />
 </div>

 {/* DATA CARDS */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredList.length === 0 ? (
 <div className="col-span-full py-16 text-center bg-gray-50 border border-emerald-50 rounded-lg">
 <FileSearch size={32} className="mx-auto text-emerald-800 mb-3"/>
 <p className="text-sm font-medium text-emerald-800">Tidak ada data rekapitulasi ditemukan.</p>
 </div>
 ) : (
 filteredList.map((k) => (
 <div key={k.id} className="bg-white border border-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden relative">
 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
 <ClipboardList size={100} />
 </div>
 
 <div className="p-5 flex-grow z-10 space-y-4">
 <div className="flex items-start justify-between">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-[#1a7a4a] mb-1">{k.periode || '-'}</span>
 <h3 className="text-lg font-bold text-emerald-950 leading-tight">{k.nama_kelompok}</h3>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center gap-2 text-sm text-emerald-800">
 <MapPin size={14} className="text-emerald-800"/>
 <span>{k.desa}, {k.kecamatan}</span>
 </div>
 <div className="flex items-center gap-2 text-sm text-emerald-800">
 <Activity size={14} className="text-emerald-800"/>
 <span>{k.jumlah_kegiatan} Laporan Kegiatan</span>
 </div>
 </div>
 </div>

 <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex items-center justify-between z-10 mt-auto">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-emerald-800">Total Dana Dikelola</span>
 <span className="text-base font-bold text-emerald-950">
 Rp {k.total_dana.toLocaleString('id-ID')}
 </span>
 </div>
 
 <Link 
 href={route('admin.rekapitulasi.index', { kelompok_id: k.id })}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-emerald-800 hover:bg-[#e8f5ee] border border-gray-300 rounded-md text-sm font-medium transition-colors"
 >
 Detail <ArrowRight size={14} />
 </Link>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </AppLayout>
 );
}
