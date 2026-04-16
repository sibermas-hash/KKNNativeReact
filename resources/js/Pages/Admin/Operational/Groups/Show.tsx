import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Users,
  Activity,
  Target,
  Zap,
  Briefcase,
  Building2,
  LayoutDashboard,
  Globe,
  Camera,
  Info,
  CheckCircle2,
  UserCheck,
  Lock,
  Search,
  ChevronRight,
  UserPlus,
  Cpu,
  ArrowRight,
  CheckCircle,
  X,
  MapPinned
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps, LucideIcon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface GroupLecturer {
  id: number;
  nama?: string | null;
  nip?: string | null;
  pivot?: {
    role?: string | null;
  } | null;
}

interface GroupStudent {
  id: number;
  status: string;
  role?: string | null;
  mahasiswa?: {
    nim?: string | null;
    nama?: string | null;
    fakultas?: {
      nama?: string | null;
    } | null;
    prodi?: {
      nama?: string | null;
    } | null;
  } | null;
}

interface WorkProgram {
  id: number;
  title?: string | null;
  status?: string | null;
}

interface GroupData {
  id: number;
  code?: string | null;
  nama_kelompok?: string | null;
  token?: string | null;
  capacity?: number | null;
  status: string;
  periode?: {
    name?: string | null;
  } | null;
  lokasi?: {
    village_name?: string | null;
    district_name?: string | null;
    regency_name?: string | null;
    full_name?: string | null;
    address?: string | null;
  } | null;
  dosen?: GroupLecturer[];
  peserta?: GroupStudent[];
  program_kerja?: WorkProgram[];
  posko?: {
    id?: number;
    latitude?: number | string | null;
    longitude?: number | string | null;
    gmaps_link?: string | null;
    photo_url?: string | null;
    photo_name?: string | null;
    updated_at?: string | null;
  } | null;
}

interface Props extends PageProps {
  group: GroupData;
  members?: GroupStudent[];
}

export default function GroupShow({ group, members = [] }: Props) {
  const memberRows = members.length > 0 ? members : (group.peserta ?? []);
  const lecturerRows = group.dosen ?? [];
  const workPrograms = group.program_kerja ?? [];
  const mainLecturer = lecturerRows.find((l) => l.pivot?.role === 'Ketua') ?? lecturerRows[0] ?? null;
  const approvedCount = memberRows.filter((m) => m.status === 'approved').length;
  const pendingCount = memberRows.filter((m) => m.status === 'pending').length;
  const availableSlots = Math.max((group.capacity ?? 0) - approvedCount, 0);

  return (
    <AppLayout title={`Spesifikasi Unit: ${group.code || ''}`}>
      <Head title={`Audit Unit ${group.nama_kelompok || ''}`} />

      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-8 pt-12">
           <div className="flex items-center gap-4">
              <Link
                href="/admin/kelompok"
                className="h-14 w-14 bg-white border-2 border-emerald-50 rounded-2xl flex items-center justify-center text-emerald-300 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group/back active:scale-90"
              >
                <ArrowLeft size={24} strokeWidth={3} className="group-hover/back:-translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 text-emerald-600">
                <Users size={18} />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Audit Struktur & Operasional Unit</span>
              </div>
           </div>

           <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                     Unit <span className="text-emerald-500">{group.code || 'NULL'}.</span>
                   </h1>
                   <div className="h-10 px-5 bg-emerald-600 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      {group.status.toUpperCase()}
                   </div>
                </div>
                <p className="text-2xl font-black text-emerald-950/40 tracking-tight leading-tight uppercase max-w-2xl">
                   {group.nama_kelompok}
                </p>
                <div className="flex items-center gap-6 pt-4">
                   <div className="flex items-center gap-3 bg-white border-2 border-emerald-50 px-5 py-2.5 rounded-xl shadow-sm">
                      <Lock size={16} className="text-emerald-400" />
                      <span className="text-[11px] font-black text-emerald-950 tracking-widest font-mono uppercase">TOKEN: {group.token || 'MISSING'}</span>
                   </div>
                   <div className="flex items-center gap-3 bg-white border-2 border-emerald-50 px-5 py-2.5 rounded-xl shadow-sm uppercase">
                      <Briefcase size={16} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-950 tracking-widest leading-none">{group.periode?.name || 'UMUM'}</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* --- STRATEGIC METRICS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
           <MetricCard label="Manifest Peserta" value={approvedCount} icon={CheckCircle2} desc="Peserta Terverifikasi" />
           <MetricCard label="Audit Pending" value={pendingCount} icon={Activity} type={pendingCount > 0 ? 'warning' : 'success'} desc="Antrean Validasi" />
           <MetricCard label="Slot Tersedia" value={availableSlots} icon={UserPlus} desc="Kapasitas Sisa" />
           <MetricCard label="Program Kerja" value={workPrograms.length} icon={ClipboardList} desc="Rencana Operasional" />
           <MetricCard label="Pembimbing" value={lecturerRows.length} icon={UserCheck} desc="Delegasi DPL" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
           {/* LEFT CONTENT: ATTENDEES & PROKERS */}
           <div className="xl:col-span-8 space-y-12">
              {/* PERSONNEL LEDGER */}
              <section className="bg-white border-2 border-emerald-50 rounded-[3rem] overflow-hidden shadow-sm flex flex-col">
                 <div className="px-10 py-10 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 bg-emerald-900 border border-emerald-800 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                          <Users size={32} className="text-emerald-400" strokeWidth={2.5} />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">Manifest Personel</h3>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Daftar Mahasiswa Terdaftar Dalam Unit</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Entitas</span>
                       <span className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">{memberRows.length}</span>
                    </div>
                 </div>

                 <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full text-left border-collapse whitespace-nowrap">
                       <thead className="bg-emerald-50/50 text-emerald-950 border-b border-emerald-100">
                          <tr>
                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Data Peserta [NIM]</th>
                             <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Afiliasi Akademik</th>
                             <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Peran Otoritas</th>
                             <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest">Validasi</th>
                             <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest">Aksi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-emerald-50">
                          {memberRows.length === 0 ? (
                             <EmptyTable icon={Users} label="Manifest Personel Kosong" desc="Belum ada mahasiswa yang terdaftar pada unit ini." />
                          ) : (
                             memberRows.map((m) => (
                                <tr key={m.id} className="group hover:bg-emerald-50/30 transition-all">
                                   <td className="px-10 py-8">
                                      <div className="flex flex-col gap-3">
                                         <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tight leading-none group-hover:text-emerald-700 transition-colors">{m.mahasiswa?.nama || 'PESERTA'}</span>
                                         <span className="text-[10px] font-black text-emerald-500 tracking-widest font-mono uppercase">NIM: {m.mahasiswa?.nim || 'UNKNOWN'}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-8">
                                      <div className="flex flex-col gap-2">
                                         <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight leading-tight">{m.mahasiswa?.prodi?.nama || '-'}</span>
                                         <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">{m.mahasiswa?.fakultas?.nama || '-'}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-8 text-center">
                                      <div className={clsx(
                                         "h-10 px-6 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest border-2 shadow-sm inline-flex mx-auto",
                                         m.role === 'Ketua' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-emerald-50 text-emerald-400'
                                      )}>
                                         {m.role === 'Ketua' && <ShieldCheck size={14} strokeWidth={3} />}
                                         {m.role ? m.role.toUpperCase() : 'ANGGOTA'}
                                      </div>
                                   </td>
                                   <td className="px-8 py-8 text-center text-center">
                                      <div className="scale-110">
                                         <StatusBadge status={m.status} />
                                      </div>
                                   </td>
                                   <td className="px-10 py-8 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 gap-3">
                                         <Link 
                                            href={`/admin/pendaftaran/${m.id}`}
                                            className="h-10 px-5 bg-white border-2 border-emerald-50 text-emerald-950 hover:bg-emerald-950 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                         >
                                            AUDIT
                                         </Link>
                                         {m.role !== 'Ketua' && m.status === 'approved' && (
                                            <Link 
                                              href={`/admin/pendaftaran/${m.id}/jadikan-ketua`}
                                              method="post"
                                              className="h-10 w-10 bg-white border-2 border-emerald-50 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                                              title="Tetapkan Ketua"
                                            >
                                               <ChevronRight size={18} strokeWidth={3} />
                                            </Link>
                                         )}
                                      </div>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </section>

              {/* WORK PROGRAM INVENTORY */}
              <section className="bg-white border-2 border-emerald-50 rounded-[3rem] overflow-hidden shadow-sm flex flex-col">
                 <div className="px-10 py-10 bg-emerald-50/20 border-b-2 border-emerald-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 bg-white border-2 border-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-sm">
                          <ClipboardList size={32} strokeWidth={2.5} />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">Manifest Program Kerja</h3>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Rencana Operasional & Pengabdian</p>
                       </div>
                    </div>
                    <div className="h-14 w-24 bg-emerald-950 text-emerald-400 rounded-2xl flex flex-col items-center justify-center shadow-xl border border-emerald-800">
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">PROKER</span>
                       <span className="text-xl font-black text-white leading-none">{workPrograms.length}</span>
                    </div>
                 </div>
                 
                 <div className="p-10 space-y-6">
                    {workPrograms.length === 0 ? (
                       <EmptyBox icon={ClipboardList} label="Data Proker Kosong" desc="Unit belum melakukan unggah rencana program kerja." />
                    ) : (
                       workPrograms.map((p) => (
                          <div key={p.id} className="group/pro p-8 bg-emerald-50/20 border-2 border-emerald-50 rounded-[2rem] hover:bg-white hover:border-emerald-500 transition-all duration-500 flex items-center justify-between gap-8 shadow-sm">
                             <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-white border-2 border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-300 group-hover/pro:bg-emerald-600 group-hover/pro:text-white transition-all duration-500 scale-90 group-hover/pro:scale-100">
                                   <Zap size={28} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col gap-3">
                                   <span className="text-lg font-black text-emerald-950 uppercase tracking-tight group-hover/pro:text-emerald-700 transition-colors leading-tight truncate max-w-[400px]">{p.title || 'Draft Proker'}</span>
                                   <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase font-mono">ID: #{p.id.toString().padStart(6, '0')}</span>
                                </div>
                             </div>
                             <div className="scale-125 group-hover/pro:scale-135 transition-all">
                                <StatusBadge status={p.status || 'draft'} />
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </section>
           </div>

           {/* RIGHT SIDEBAR: DOSEN & LOKASI */}
           <div className="xl:col-span-4 space-y-12">
              {/* DOSEN PEMBIMBING */}
              <section className="bg-emerald-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-2 border-emerald-500 group/dpl">
                 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16 group-hover/dpl:rotate-45 transition-transform duration-1000">
                    <ShieldCheck size={200} strokeWidth={1} />
                 </div>
                 
                 <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 bg-emerald-900 border border-emerald-800 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                          <UserCheck size={32} className="text-emerald-400" strokeWidth={2.5} />
                       </div>
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">Otoritas DPL</h3>
                          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest leading-none">Dosen Pembimbing Lapangan</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       {lecturerRows.length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center opacity-40">
                             <span className="text-[10px] font-black uppercase tracking-widest">DPL Belum Terplot</span>
                          </div>
                       ) : (
                          lecturerRows.map((l) => (
                             <div key={l.id} className="p-8 bg-emerald-700/50 border border-emerald-500 rounded-2xl hover:bg-white hover:text-emerald-950 transition-all duration-500 group/card shadow-sm">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Ketua Pembimbing</span>
                                <h4 className="text-lg font-black uppercase leading-tight tracking-tight mb-4">{l.nama || '-'}</h4>
                                <div className="h-px w-full bg-emerald-600 group-hover/card:bg-emerald-100 mb-4 transition-colors" />
                                <div className="flex items-center justify-between">
                                   <span className="text-[11px] font-black font-mono tracking-widest opacity-60 group-hover/card:text-emerald-500">NIP: {l.nip || '-'}</span>
                                   <CheckCircle size={18} className="text-emerald-400" />
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </section>

              {/* LOKASI POSKO */}
              <section className="bg-white border-2 border-emerald-50 rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden group/loc">
                 <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-emerald-50 text-rose-500 border-2 border-emerald-50 rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover/loc:bg-emerald-600 group-hover/loc:text-white group-hover/loc:rotate-12 transition-all duration-500">
                       <MapPinned size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                       <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1.5">Pusat Navigasi</h3>
                       <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Geo-Intelligence Posko</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="p-8 bg-emerald-50/20 border-2 border-emerald-50 rounded-2xl space-y-4">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">ZONA PENEMPATAN</span>
                       <div className="flex flex-col gap-2">
                          <span className="text-xl font-black text-emerald-950 uppercase leading-tight tracking-tighter">{group.lokasi?.full_name || group.lokasi?.village_name || 'BELUM TERPETAKAN'}</span>
                          {group.lokasi?.address && (
                             <p className="text-[11px] font-bold text-emerald-700 leading-relaxed uppercase opacity-60">{group.lokasi.address}</p>
                          )}
                       </div>
                    </div>

                    {group.posko ? (
                       <div className="space-y-6">
                          {group.posko.photo_url && (
                             <div className="relative h-64 rounded-2xl overflow-hidden border-2 border-emerald-50 shadow-lg group/img">
                                <img src={group.posko.photo_url} alt="Foto posko" className="absolute inset-0 w-full h-full object-cover grayscale group-hover/img:grayscale-0 group-hover/img:scale-110 transition-all duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent flex items-end p-6">
                                   <div className="flex items-center gap-3">
                                      <Camera size={16} className="text-emerald-400" />
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">VISUAL INFRASTRUKTUR</span>
                                   </div>
                                </div>
                             </div>
                          )}
                          <div className="p-8 bg-emerald-950 text-white rounded-2xl space-y-8 shadow-2xl relative overflow-hidden group/gmaps">
                             <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 -mr-12 -mt-12 group-hover/gmaps:rotate-[45deg] transition-all duration-1000"><Globe size={150} /></div>
                             <div className="grid grid-cols-2 gap-6 relative z-10 opacity-60">
                                <div>
                                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-2">LINTANG</span>
                                   <span className="text-sm font-black font-mono tracking-widest uppercase">{group.posko.latitude || '0.000'}</span>
                                </div>
                                <div>
                                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-2">BUJUR</span>
                                   <span className="text-sm font-black font-mono tracking-widest uppercase">{group.posko.longitude || '0.000'}</span>
                                </div>
                             </div>
                             {group.posko.gmaps_link && (
                                <a 
                                  href={group.posko.gmaps_link} 
                                  target="_blank" 
                                  className="h-14 w-full bg-emerald-600 hover:bg-white hover:text-emerald-950 rounded-xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/50 transition-all active:scale-95 no-underline relative z-10"
                                >
                                   <ArrowRight size={18} strokeWidth={3} /> BUKA GOOGLE MAPS
                                </a>
                             )}
                          </div>
                       </div>
                    ) : (
                       <div className="py-20 border-2 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 opacity-30">
                          <MapPin size={40} className="text-emerald-200" strokeWidth={1} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Audit GPS Nihil</span>
                       </div>
                    )}
                 </div>
              </section>
           </div>
        </div>

        {/* --- GOVERNANCE FOOTER --- */}
        <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-800 group/governance">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
             <Cpu size={500} strokeWidth={0.5} />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-emerald-900/50 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
                  <ShieldCheck size={40} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Manifest Audit Unit</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">Protokol Akuntabilitas Lapangan</span>
                </div>
              </div>
              <p className="text-[12px] font-bold text-emerald-400/80 uppercase tracking-widest leading-relaxed max-w-4xl">
                 Seluruh parameter yang terdata pada unit operasional ini merupakan representasi entitas valid dari program KKN UIN SAIZU. Perubahan pada struktur kepemimpinan, proker, maupun titik koordinat posko akan terekam dalam audit trail transparan untuk menjamin integritas monitoring dan evaluasi terpusat.
              </p>
            </div>
            <div className="h-20 w-px bg-white/10 hidden lg:block" />
            <div className="flex flex-col items-end shrink-0 hidden lg:flex">
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 opacity-60">KEAMANAN DATA</span>
               <span className="text-2xl font-black text-white italic tracking-tighter uppercase uppercase">TEROTORISASI</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, type, desc }: { label: string; value: any; icon: any; type?: 'success' | 'warning'; desc: string }) {
  return (
    <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
      <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border-2", 
        type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-50'
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

function EmptyTable({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-10 py-32 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-100 mb-2">
              <Icon size={48} strokeWidth={1} />
            </div>
            <span className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">{label}</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none opacity-60">{desc}</p>
          </div>
      </td>
    </tr>
  );
}

function EmptyBox({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
   return (
      <div className="py-24 border-2 border-dashed border-emerald-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group/none hover:border-emerald-200 transition-all">
         <Icon size={64} className="text-emerald-50 group-hover/none:text-emerald-100 transition-colors" strokeWidth={1} />
         <div className="text-center space-y-2">
            <span className="text-sm font-black text-emerald-950 uppercase tracking-widest block">{label}</span>
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest opacity-60">{desc}</p>
         </div>
      </div>
   );
}
