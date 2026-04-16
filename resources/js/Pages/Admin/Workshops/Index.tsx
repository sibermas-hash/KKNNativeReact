import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Search,
  BookOpen,
  ChevronRight,
  Activity,
  Layers,
  FileDigit,
  Archive,
  Edit
} from 'lucide-react';
import { Modal, Button, ConfirmDialog } from '@/Components/ui';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';

interface Participant {
  id: number;
  user_id: number;
  name: string;
  email: string;
  attendance_status: string;
  certificate_generated: boolean;
  checked_in_at: string | null;
}

interface Workshop {
  id: number;
  title: string;
  description: string;
  date: string;
  workshop_date_value: string;
  time: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  registered: number;
  peserta_count?: number;
  max_participants: number | null;
  status: string;
  category?: string;
  period: { id: number; name: string } | null;
  participants: Participant[];
  can_edit: boolean;
  can_cancel: boolean;
  is_registered?: boolean;
  is_full?: boolean;
  attendance_status?: string;
}

interface Props {
  workshops: Workshop[];
}

export default function WorkshopIndex({ workshops = [] }: Props) {
  const { auth } = usePage<PageProps>().props;
  const userRoles = Array.isArray(auth.user?.roles) 
    ? auth.user.roles.map(r => typeof r === 'string' ? r : (r as any).name)
    : [];
    
  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');
  const isStudent = userRoles.includes('student');
  const isDpl = userRoles.includes('dpl');
  const isParticipant = isStudent || isDpl;

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, setData, post, patch, processing, errors, reset } = useForm({
    title: '',
    description: '',
    workshop_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
  });

  const filteredWorkshops = workshops.filter(w => 
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setData({
      title: workshop.title,
      description: workshop.description || '',
      workshop_date: workshop.workshop_date_value,
      start_time: workshop.start_time || '',
      end_time: workshop.end_time || '',
      location: workshop.location || '',
      max_participants: workshop.max_participants?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkshop) {
      patch(route('admin.workshops.update', selectedWorkshop.id), {
        onSuccess: () => {
          setShowForm(false);
          reset();
        }
      });
    } else {
      post(route('admin.workshops.store'), {
        onSuccess: () => {
          setShowForm(false);
          reset();
        }
      });
    }
  };

  const handleCancel = () => {
    if (confirmCancel) {
      patch(route('admin.workshops.cancel', confirmCancel), {
        onSuccess: () => setConfirmCancel(null)
      });
    }
  };

  const handleRegister = (workshopId: number) => {
    const rolePrefix = isStudent ? 'student' : 'dpl';
    router.post(route(`${rolePrefix}.workshops.register`, workshopId), {}, {
      onFinish: () => reset(),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
      router.delete(route('admin.workshops.destroy', id));
    }
  };

  return (
    <>
      <Head title="Workshop & Pembekalan" />
      
      <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans text-emerald-950">
        {/* --- PREMIUM HEADER --- */}
        <div className="bg-white rounded-[2.5rem] border border-emerald-100 p-8 lg:p-12 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-12 bg-emerald-600 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 opacity-80">Pelatihan & Kapasitas</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-black text-emerald-950 tracking-tighter uppercase leading-none">
                  Workshop <span className="text-emerald-500">&</span> <br />
                  <span className="text-emerald-600">Pembekalan.</span>
                </h1>
                <p className="text-sm font-bold text-emerald-900/70 leading-relaxed max-w-xl">
                  Manajemen agenda pelatihan terpusat untuk membekali mahasiswa dan DPL sebelum terjun ke lokasi pengabdian. Pastikan setiap personil telah tervalidasi kehadirannya.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4 min-w-[300px]">
               <div className="relative w-full group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full h-14 pl-12 pr-6 bg-emerald-50/30 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-200 focus:bg-white transition-all outline-none uppercase tracking-wider" 
                    placeholder="CARI WORKSHOP..." 
                  />
               </div>
               {isAdmin && (
                  <button onClick={() => { setSelectedWorkshop(null); reset(); setShowForm(true); }} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3 w-full justify-center">
                    <Plus size={18} strokeWidth={3} />
                    Buat Agenda Baru
                  </button>
               )}
            </div>
          </div>
        </div>

        {/* --- DYNAMIC STATS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           <PremiumStat label="Active Agenda" value={workshops.length} icon={GraduationCap} trend="+2 New" />
           <PremiumStat label="Participant Cap" value="Unlimited" icon={Users} trend="Global" />
           <PremiumStat label="Valid Records" value={workshops.reduce((acc, w) => acc + (w.registered || 0), 0)} icon={FileDigit} trend="Realtime" />
           <PremiumStat label="System Status" value="Online" icon={Activity} trend="Verified" />
        </div>

        {/* WORKSHOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
          {filteredWorkshops.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-emerald-100 rounded-[3rem]">
               <Layers size={64} className="text-emerald-100 mb-6" strokeWidth={1} />
               <p className="text-[11px] font-black text-emerald-900/40 uppercase tracking-[0.3em] italic">No active agendas found in this cycle.</p>
            </div>
          ) : (
            filteredWorkshops.map((w) => (
              <div key={w.id} className="bg-white rounded-[3rem] border border-emerald-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-300 transition-all group flex flex-col border-b-[6px] border-b-emerald-600/10 hover:border-b-emerald-600">
                <div className="p-8 lg:p-10 flex-1 space-y-8">
                  <div className="flex justify-between items-start gap-4">
                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 ${
                      w.status === 'scheduled' ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20" : "bg-white text-emerald-900 border-emerald-100"
                    }`}>
                      {w.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-emerald-950 uppercase leading-tight group-hover:text-emerald-600 transition-colors">
                      {w.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                        <Calendar size={14} className="text-emerald-600" />
                        {w.date}
                      </div>
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                        <Clock size={14} className="text-emerald-600" />
                        {w.time}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                        <Users size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kapasitas Peserta</span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-emerald-950 tabular-nums leading-none">{w.registered}</span>
                          <span className="text-sm font-bold text-emerald-800 pb-0.5">/ {w.max_participants || '∞'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-100 flex items-center justify-center font-black text-xs text-emerald-950 relative overflow-hidden">
                       <div className="absolute inset-0 bg-emerald-500/20 origin-bottom transition-all duration-1000" style={{ height: `${Math.min((w.registered / (w.max_participants || 100)) * 100, 100)}%` }} />
                       <span className="relative z-10">{w.max_participants ? Math.round((w.registered / w.max_participants) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-emerald-50/30 border-t border-emerald-100 flex items-center justify-center gap-3">
                    {isAdmin ? (
                      <>
                        <button 
                          onClick={() => handleEdit(w)} 
                          className="h-12 w-12 rounded-2xl border border-emerald-200 bg-white flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm group/btn"
                          title="Edit Agenda"
                        >
                          <Pencil size={18} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => setConfirmCancel(w.id)} 
                          className="h-12 w-12 rounded-2xl border border-rose-200 bg-white flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm group/btn"
                          title="Batalkan Agenda"
                        >
                          <Trash2 size={18} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <Button 
                          onClick={() => { setSelectedWorkshop(w); setShowParticipants(true); }}
                          className="rounded-2xl h-12 px-6 uppercase text-[10px] font-black tracking-[0.1em] shadow-lg shadow-emerald-900/5 bg-emerald-950 hover:bg-emerald-900 border-none ml-2"
                        >
                          Manifest & Penilaian
                        </Button>
                      </>
                    ) : isParticipant && (
                      w.is_registered ? (
                        <div className="h-12 px-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest">
                           <CheckCircle2 size={16} strokeWidth={3} />
                           {w.attendance_status === 'attended' ? 'Hadir Pelatihan' : 'Sudah Terdaftar'}
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleRegister(w.id)}
                          disabled={w.is_full}
                          className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest border-none transition-all active:scale-95"
                        >
                          {w.is_full ? 'Kuota Penuh' : 'Daftar Sekarang'}
                        </Button>
                      )
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={() => setShowForm(false)} title={selectedWorkshop ? "Institutional Agenda Core" : "Create Training Node"} maxWidth="xl">
        <div className="p-12 lg:p-16 space-y-12 max-h-[90vh] overflow-y-auto scrollbar-hide font-sans">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-[1.25rem] bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30">
                <GraduationCap size={28} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tight">Agenda <span className="text-emerald-600">Configuration.</span></h2>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Institutional Training Repository</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3 col-span-full">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Judul Agenda Pelatihan</label>
                <div className="relative">
                  <BookOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="text" 
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-[13px] font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    placeholder="MISAL: WORKSHOP PEMBEKALAN DPL ANGKATAN 56..." required
                  />
                </div>
                {errors.title && <span className="text-rose-600 text-[10px] font-bold uppercase ml-1">{errors.title}</span>}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Tanggal Pelaksanaan</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="date" 
                    value={data.workshop_date}
                    onChange={(e) => setData('workshop_date', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Kapasitas Maksimal</label>
                <div className="relative">
                  <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="number" 
                    value={data.max_participants}
                    onChange={(e) => setData('max_participants', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-[13px] font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Waktu Mulai</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="time" 
                    value={data.start_time}
                    onChange={(e) => setData('start_time', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Waktu Selesai</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="time" 
                    value={data.end_time}
                    onChange={(e) => setData('end_time', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 col-span-full">
                <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest ml-1">Lokasi Pelaksanaan</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input 
                    type="text" 
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-emerald-50/40 border-2 border-emerald-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    placeholder="MISAL: AUDITORIUM UTAMA LT. 3..." required
                  />
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-emerald-100 flex items-center justify-end gap-8">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-950 uppercase tracking-[0.3em] transition-all"
              >
                Batalkan Perubahan
              </button>
              <Button 
                type="submit" 
                loading={processing} 
                className="h-16 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest border-none shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all"
              >
                {selectedWorkshop ? 'Perbarui Agenda' : 'Publikasikan Agenda'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* PARTICIPANTS MODAL */}
      <Modal show={showParticipants} onClose={() => setShowParticipants(false)} title="Audit Ledger: Manifest Peserta" maxWidth="5xl">
        <div className="max-h-[85vh] flex flex-col font-sans bg-white overflow-hidden">
          <div className="p-8 border-b border-emerald-100 bg-emerald-50/20">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Peserta <span className="text-emerald-600">Terdaftar.</span></h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Workshop ID: {selectedWorkshop?.id} • {selectedWorkshop?.title}</p>
                </div>
                <button 
                  onClick={() => setShowParticipants(false)}
                  className="h-10 w-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-hide py-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-emerald-50 border-b border-emerald-100 z-20">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Data Peserta</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-center">Presensi</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-right">E-Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {selectedWorkshop?.participants && selectedWorkshop.participants.length > 0 ? (
                  selectedWorkshop.participants.map((p) => (
                    <tr key={p.id} className="group hover:bg-emerald-50/30 transition-all">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shadow-sm border border-emerald-200">
                            {p.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-emerald-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{p.name}</span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest tabular-nums mt-0.5">{p.email || 'REGISTRATION_NODE'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={clsx(
                          "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          p.attendance_status === 'attended' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10' : 'bg-white text-emerald-950 border-emerald-100'
                        )}>
                          {p.attendance_status === 'attended' ? 'HADIR' : 'ABSEN'}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                          <div className="flex justify-center">
                            {p.attendance_status === 'attended' ? (
                              <CheckCircle2 size={18} className="text-emerald-500" />
                            ) : (
                              <Clock size={18} className="text-emerald-200" />
                            )}
                          </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                         {p.certificate_generated ? (
                           <span className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                             ISSUED
                           </span>
                         ) : (
                           <span className="text-[9px] font-black text-emerald-950/20 uppercase tracking-widest">NONE</span>
                         )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center gap-4 text-emerald-100 font-black">
                         <Users size={64} strokeWidth={1} />
                         <span className="text-[10px] uppercase tracking-[0.3em] mt-4 text-emerald-900/40">Z-BUFFER EMPTY: No Participants</span>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest leading-none">Transmission Stable • {selectedWorkshop?.participants?.length || 0} Records</span>
            <button 
              onClick={() => setShowParticipants(false)} 
              className="h-12 px-8 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/10 border-none"
            >
              Close Ledger
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        open={confirmCancel !== null} 
        onClose={() => setConfirmCancel(null)}
        onConfirm={handleCancel}
        title="Batalkan Agenda Workshop"
        message="Apakah Anda yakin ingin membatalkan jadwal workshop ini? Seluruh pendaftaran peserta akan tetap tersimpan namun status agenda menjadi tidak aktif. Tindakan ini permanen."
        confirmVariant="danger"
        confirmLabel="Ya, Batalkan Agenda"
        cancelLabel="Kembali"
      />
    </>
  );
}

WorkshopIndex.layout = AppLayout.layout;

function PremiumStat({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white border-2 border-emerald-100/40 rounded-[2rem] p-7 flex items-center gap-6 shadow-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/30 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-100/50 transition-colors" />
      <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm relative z-10">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col relative z-10">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-950 tracking-tighter tabular-nums leading-none">{value}</span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
    </div>
  );
}
