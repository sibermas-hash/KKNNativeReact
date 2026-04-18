import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
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
  Search,
  BookOpen,
  Activity,
  Layers,
  FileDigit,
} from 'lucide-react';
import { Modal, Button, ConfirmDialog } from '@/Components/ui';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatCard from '@/Components/Premium/StatCard';
import StatusTag from '@/Components/Premium/StatusTag';
import SearchInput from '@/Components/Premium/SearchInput';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

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

  return (
    <AppLayout title="Workshop & Pembekalan">
      <Head title="Workshop & Pembekalan" />
      
      <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans text-emerald-950">
        
        <PageHeader 
          title="Workshop & Pembekalan"
          subtitle="Manajemen agenda pelatihan terpusat untuk membekali mahasiswa dan DPL sebelum terjun ke lokasi pengabdian."
          icon={GraduationCap}
          groupLabel="Operasional Sistem"
          stats={{
            label: 'Total Peserta',
            value: `${workshops.reduce((acc, w) => acc + (w.registered || 0), 0).toLocaleString()} Data`,
            icon: Users
          }}
        >
          {isAdmin && (
            <button 
              onClick={() => { setSelectedWorkshop(null); reset(); setShowForm(true); }} 
              className="h-10 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Agenda
            </button>
          )}
        </PageHeader>

        {/* --- DYNAMIC STATS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Agenda Aktif" value={workshops.length} icon={GraduationCap} variant="success" />
          <StatCard label="Kuota Global" value="Unlimited" icon={Layers} variant="info" />
          <StatCard label="Total Record" value={workshops.reduce((acc, w) => acc + (w.registered || 0), 0)} icon={FileDigit} variant="gray" />
          <StatCard label="Status Sistem" value="Online" icon={Activity} variant="success" />
        </div>

        {/* SEARCH BAR PANEL */}
        <ContentPanel
          title="Daftar Agenda Pembekalan"
          description="Manajemen Jadwal & Manifest"
          icon={Calendar}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <SearchInput 
                placeholder="Cari agenda..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <button 
                onClick={() => router.get(route('admin.workshops.index'), { search: searchTerm }, { preserveState: true, replace: true })} 
                className="h-10 px-6 bg-[#16a34a] text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all"
              >
                Terapkan
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredWorkshops.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 py-24 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-emerald-50 rounded-xl">
                <Layers size={48} className="text-emerald-700 mb-4" strokeWidth={1} />
                <p className="text-sm font-semibold text-emerald-800">Tidak ada agenda aktif ditemukan.</p>
              </div>
            ) : (
              filteredWorkshops.map((w) => (
                <div key={w.id} className="bg-white rounded-xl border border-emerald-50 overflow-hidden shadow-sm flex flex-col hover:border-emerald-300 transition-colors">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <StatusTag status={w.status === 'scheduled' ? 'active' : 'inactive'} label={w.status === 'scheduled' ? 'AKTIF' : 'DRAFT'} />
                      <div className="text-xs font-bold text-emerald-800 uppercase tabular-nums">ID: {w.id}</div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-950 leading-tight">
                        {w.title}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
                          <Calendar size={14} className="text-[#1a7a4a]" />
                          {w.date}
                        </div>
                        <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
                          <MapPin size={14} className="text-[#1a7a4a]" />
                          <span className="truncate">{w.location || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-800 uppercase leading-none mb-1">Pendaftar</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-emerald-950">{w.registered}</span>
                          <span className="text-xs font-medium text-emerald-800">/ {w.max_participants || '∞'}</span>
                        </div>
                      </div>
                      <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min((w.registered / (w.max_participants || 100)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                    {isAdmin ? (
                      <>
                        <button 
                          onClick={() => handleEdit(w)} 
                          className="h-8 w-8 rounded-lg border border-emerald-50 bg-white flex items-center justify-center text-emerald-800 hover:text-[#1a7a4a] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => setConfirmCancel(w.id)} 
                          className="h-8 w-8 rounded-lg border border-emerald-50 bg-white flex items-center justify-center text-emerald-800 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          onClick={() => { setSelectedWorkshop(w); setShowParticipants(true); }}
                          className="h-8 px-4 bg-white border border-emerald-50 text-[#1a7a4a] rounded-lg text-xs font-bold hover:bg-gray-50"
                        >
                          Manifes
                        </button>
                      </>
                    ) : isParticipant && (
                      w.is_registered ? (
                        <div className="h-8 px-4 rounded-lg bg-[#e8f5ee] border border-emerald-50 flex items-center gap-2 text-[#1a7a4a] font-bold text-xs uppercase">
                          <CheckCircle2 size={12} /> {w.attendance_status === 'attended' ? 'HADIR' : 'TERDAFTAR'}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleRegister(w.id)}
                          disabled={w.is_full}
                          className="h-8 px-4 rounded-lg bg-[#16a34a] text-white font-bold text-xs uppercase disabled:opacity-50"
                        >
                          {w.is_full ? 'PENUH' : 'DAFTAR'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ContentPanel>
      </div>

      {/* FORM MODAL */}
      <Modal show={showForm} onClose={() => setShowForm(false)} title={selectedWorkshop ?"Edit Agenda":"Tambah Agenda Baru"} maxWidth="xl">
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 font-sans text-emerald-950">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#16a34a] text-white rounded-lg flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-tight">Data Konfigurasi Agenda</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="text-emerald-800 hover:text-emerald-800"><Plus className="rotate-45" size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Judul Agenda</label>
                <div className="relative">
                  <SearchInput 
                    placeholder="Contoh: Workshop Pembekalan Angkatan 57..." 
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="w-full"
                  />
                </div>
                {errors.title && <span className="text-rose-600 text-xs font-bold uppercase">{errors.title}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Tanggal</label>
                <input 
                  type="date"
                  value={data.workshop_date}
                  onChange={(e) => setData('workshop_date', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Kuota Maksimal</label>
                <input 
                  type="number"
                  value={data.max_participants}
                  onChange={(e) => setData('max_participants', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all"
                  placeholder="0" required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Waktu Mulai</label>
                <input 
                  type="time"
                  value={data.start_time}
                  onChange={(e) => setData('start_time', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Waktu Selesai</label>
                <input 
                  type="time"
                  value={data.end_time}
                  onChange={(e) => setData('end_time', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">Lokasi</label>
                <input 
                  type="text"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-emerald-950 focus:border-[#f3f4f6]0 outline-none transition-all"
                  placeholder="Contoh: Auditorium Lt. 3..." required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowForm(false)} 
                className="text-xs font-bold text-emerald-800 hover:text-rose-600 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={processing} 
                className="h-10 px-6 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {selectedWorkshop ? 'Simpan Perbarui' : 'Tambah Agenda'}
              </button>
            </div>
          </form>
        </div>
      </Modal>      {/* PARTICIPANTS MODAL */}
      <Modal show={showParticipants} onClose={() => setShowParticipants(false)} title="Manifes Kehadiran Peserta" maxWidth="5xl">
        <div className="max-h-[85vh] flex flex-col font-sans bg-white text-emerald-950">
          <div className="p-8 border-b-2 border-[#f3f4f6] bg-gray-50 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tight">Peserta <span className="text-[#1a7a4a]">Terdata.</span></h3>
              <p className="text-xs font-extrabold text-[#1a7a4a] uppercase tracking-widest">{selectedWorkshop?.title}</p>
            </div>
            <button onClick={() => setShowParticipants(false)} className="h-10 w-10 bg-white border-2 border-[#f3f4f6] text-emerald-950 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
              <Plus className="rotate-45" size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <PremiumTable
              headers={['Data Peserta', 'Presensi', 'Sertifikasi']}
              isEmpty={!selectedWorkshop?.participants?.length}
              emptyText="Belum ada pendaftar yang masuk ke manifes agenda ini."
            >
              {selectedWorkshop?.participants?.map((p) => (
                <PremiumTableRow key={p.id}>
                  <PremiumTableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[#e8f5ee] flex items-center justify-center text-[#1a7a4a] font-black border-2 border-emerald-50 uppercase">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 group-hover:text-[#1a7a4a] transition-colors uppercase tracking-tight">{p.name}</span>
                        <span className="text-xs font-bold text-[#1a7a4a]/40 tabular-nums lowercase">{p.email || 'system@uinsaizu.ac.id'}</span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell align="center">
                    <StatusTag status={p.attendance_status === 'attended' ? 'success' : 'gray'} label={p.attendance_status === 'attended' ? 'HADIR' : 'ABSEN'} size="sm" />
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    {p.certificate_generated ? (
                      <span className="inline-flex items-center gap-2 text-xs font-black text-[#1a7a4a] bg-[#e8f5ee] px-3 py-1.5 rounded-lg border-2 border-emerald-50 shadow-sm tracking-widest uppercase">
                        <CheckCircle2 size={12} strokeWidth={3} /> TERBIT
                      </span>
                    ) : (
                      <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest">BELUM</span>
                    )}
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </div>

          <div className="p-6 bg-emerald-50/10 border-t-2 border-[#f3f4f6] flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest">{selectedWorkshop?.participants?.length || 0} DATA TEREKAM</span>
            <button onClick={() => setShowParticipants(false)} className="h-11 px-8 bg-white border-2 border-[#f3f4f6] text-emerald-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">Tutup Manifes</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        open={confirmCancel !== null} 
        onClose={() => setConfirmCancel(null)}
        onConfirm={handleCancel}
        title="Batalkan Agenda Workshop"
        message="Agenda akan dihentikan dan ditandai sebagai Batal. Peserta yang sudah mendaftar tidak akan mendapatkan notifikasi otomatis hingga manual trigger dilakukan."
        confirmVariant="danger"
        confirmLabel="Ya, Batalkan Agenda"
        cancelLabel="Kembali"
      />
    </AppLayout>
  );
}
