import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import {
  GraduationCap,
  Plus,
  Calendar,
  MapPin,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  Layers,
  FileDigit,
  Activity,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react';
import { Modal, ConfirmDialog } from '@/Components/UI';
import { motion } from 'framer-motion';

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
  identity_number: string;
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
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  registered: number;
  max_participants: number | null;
  status: string;
  period: { id: number; name: string } | null;
  participants: Participant[];
}

interface Props {
  workshops: Workshop[];
  periods?: Array<{ id: number; name: string; periode: string }>;
  filters: { period_id?: string | number };
}

export default function WorkshopIndex({ workshops = [], periods = [], filters }: Props) {
  const { auth } = usePage<PageProps>().props;
  const userRoles = Array.isArray(auth.user?.roles)
    ? auth.user.roles.map((r) => (typeof r === 'string' ? r : (r as any).name))
    : [];

  const isAdmin = userRoles.includes('superadmin') || userRoles.includes('admin');
  const isParticipant = userRoles.includes('dpl');

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState(filters.period_id || '');
  const [attendedIds, setAttendedIds] = useState<number[]>([]);

  const { data, setData, post, patch, processing, errors, reset } = useForm({
    periode_id: '',
    title: '',
    description: '',
    workshop_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
  });

  const applyFilters = (pid: string) => {
    router.get(
      route('admin.workshops.index'),
      { period_id: pid || undefined },
      { preserveState: true, replace: true },
    );
  };

  const filteredWorkshops = workshops.filter(
    (w) =>
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setData({
      periode_id: workshop.period?.id.toString() || '',
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
        },
      });
    } else {
      post(route('admin.workshops.store'), {
        onSuccess: () => {
          setShowForm(false);
          reset();
        },
      });
    }
  };

  const handleCancel = () => {
    if (confirmCancel) {
      patch(route('admin.workshops.cancel', confirmCancel), {
        onSuccess: () => setConfirmCancel(null),
      });
    }
  };

  const handleRegister = (workshopId: number) => {
    router.post(
      route('dosen.workshops.register', workshopId),
      {},
      {
        onFinish: () => reset(),
      },
    );
  };

  const handleOpenParticipants = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    const initialAttended = (workshop.participants || [])
      .filter((p) => p.attendance_status === 'attended')
      .map((p) => p.user_id);
    setAttendedIds(initialAttended);
    setShowParticipants(true);
  };

  const toggleAttendance = (userId: number) => {
    setAttendedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const saveAttendance = () => {
    if (!selectedWorkshop) return;
    router.post(
      route('admin.workshops.mark-attendance', selectedWorkshop.id),
      {
        user_ids: attendedIds,
      },
      {
        onSuccess: () => {
          setShowParticipants(false);
        },
      },
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  return (
    <AppLayout title="Workshop & Pembekalan">
      <Head title="Workshop & Pembekalan" />
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="space-y-8 pb-24 font-sans text-emerald-950"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Workshop & Pembekalan."
            subtitle="Manajemen agenda pelatihan terpusat untuk membekali mahasiswa dan Dosen Pembimbing Lapangan sebelum terjun ke lokasi pengabdian."
          icon={GraduationCap}
          groupLabel="Operasional Sistem"
          stats={{
            label: 'Total Peserta',
            value: `${workshops.reduce((acc, w) => acc + (w.registered || 0), 0).toLocaleString()} Peserta`,
            icon: Users,
          }}
        >
          {isAdmin && (
            <button
              onClick={() => {
                setSelectedWorkshop(null);
                reset();
                setShowForm(true);
              }}
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest font-display"
            >
              <Plus size={18} strokeWidth={3} /> Tambah Agenda
            </button>
          )}
        </PageHeader>
        </motion.div>

        {/* --- DYNAMIC STATS --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Agenda Aktif"
            value={workshops.length}
            icon={GraduationCap}
            variant="success"
          />
          <StatCard label="Kuota Global" value="Unlimited" icon={Layers} variant="info" />
          <StatCard
            label="Total Record"
            value={workshops.reduce((acc, w) => acc + (w.registered || 0), 0)}
            icon={FileDigit}
            variant="gray"
          />
          <StatCard label="Status Sistem" value="Online" icon={Activity} variant="success" />
        </motion.div>

        {/* PERIOD FILTER */}
        <motion.div variants={itemVariants}>
        <ContentPanel title="Konfigurasi Konteks Periode" icon={Filter} padding={true}>
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1 max-w-sm space-y-3">
              <label className="text-[10px] font-black text-emerald-950/40 uppercase tracking-[0.2em] pl-1 font-display">
                Target Periode KKN
              </label>
              <div className="relative group">
                <select
                  value={selectedPeriodId}
                  onChange={(e) => {
                    setSelectedPeriodId(e.target.value);
                    applyFilters(e.target.value);
                  }}
                  className="w-full h-12 pl-6 pr-12 rounded-2xl border-2 border-emerald-50 bg-white text-[11px] font-black text-emerald-950 focus:border-emerald-600 appearance-none shadow-sm transition-all outline-none uppercase tracking-widest font-display"
                >
                  <option value="">SEMUA PERIODE</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none group-focus-within:rotate-180 transition-transform"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPeriodId('');
                applyFilters('');
              }}
              className="h-12 px-6 text-[10px] font-black text-emerald-600 hover:text-rose-600 uppercase tracking-widest transition-all border-2 border-emerald-50 hover:border-rose-100 rounded-2xl bg-white font-display"
            >
              Reset Filter
            </button>
          </div>
        </ContentPanel>
        </motion.div>

        {/* SEARCH BAR PANEL */}
        <motion.div variants={itemVariants}>
        <ContentPanel
          title="Daftar Agenda Pembekalan"
          description="Manajemen Jadwal & Daftar Peserta"
          icon={Calendar}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <SearchInput
                placeholder="Cari judul atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredWorkshops.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 py-24 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-emerald-50 rounded-xl">
                <Layers size={48} className="text-emerald-700 mb-4" strokeWidth={1} />
                <p className="text-sm font-semibold text-emerald-800">
                  Tidak ada agenda ditemukan untuk periode ini.
                </p>
              </div>
            ) : (
              filteredWorkshops.map((w) => (
                <div
                  key={w.id}
                  className="bg-white rounded-xl border border-emerald-50 overflow-hidden shadow-sm flex flex-col hover:border-emerald-300 transition-colors"
                >
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        {new Date(w.workshop_date_value) <
                        new Date(new Date().setHours(0, 0, 0, 0)) ? (
                          <StatusTag status="gray" label="SELESAI" />
                        ) : (
                          <StatusTag
                            status={w.status === 'scheduled' ? 'active' : 'inactive'}
                            label={w.status === 'scheduled' ? 'AKTIF' : 'DRAFT'}
                          />
                        )}
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          {w.period?.name || 'UMUM'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-emerald-800 uppercase tabular-nums">
                        ID: {w.id}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-emerald-950 leading-tight">
                        {w.title}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
                          <Calendar size={14} className="text-[#0d9488]" />
                          {w.date}
                        </div>
                        <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs">
                          <MapPin size={14} className="text-[#0d9488]" />
                          <span className="truncate">{w.location || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-emerald-50/50 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-[0.2em] font-display">
                          Okupansi Peserta
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-emerald-950 tabular-nums font-display">
                            {w.registered}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 font-display">
                            / {w.max_participants || '∞'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={clsx(
                            'h-full transition-all duration-1000 shadow-sm',
                            w.registered / (w.max_participants || 100) > 0.8
                              ? 'bg-rose-500'
                              : 'bg-emerald-500',
                          )}
                          style={{
                            width: `${Math.min((w.registered / (w.max_participants || 100)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleEdit(w)}
                          className="h-8 w-8 rounded-lg border border-emerald-50 bg-white flex items-center justify-center text-emerald-800 hover:text-[#0d9488] transition-colors"
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
                          onClick={() => handleOpenParticipants(w)}
                          className="h-8 px-4 bg-white border border-emerald-50 text-[#0d9488] rounded-lg text-xs font-bold hover:bg-gray-50"
                        >
                          Daftar Peserta
                        </button>
                      </>
                    ) : (
                      isParticipant &&
                      (w.is_registered ? (
                        <div className="h-8 px-4 rounded-lg bg-[#f0fdfa] border border-emerald-50 flex items-center gap-2 text-[#0d9488] font-bold text-xs uppercase">
                          <CheckCircle2 size={12} />{' '}
                          {w.attendance_status === 'attended' ? 'HADIR' : 'TERDAFTAR'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(w.id)}
                          disabled={w.is_full}
                          className="h-8 px-4 rounded-lg bg-[#0d9488] text-white font-bold text-xs uppercase disabled:opacity-50"
                        >
                          {w.is_full ? 'PENUH' : 'DAFTAR'}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ContentPanel>
        </motion.div>
      </motion.div>
      {/* FORM MODAL */}
      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title={selectedWorkshop ? 'Edit Agenda' : 'Tambah Agenda Baru'}
        maxWidth="xl"
      >
        <div className="bg-white rounded-xl shadow-sm border border-emerald-50 font-sans text-emerald-950">
          <div className="px-6 py-4 border-b border-emerald-50 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#0d9488] text-white rounded-lg flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-tight">
                Data Konfigurasi Agenda
              </h3>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-emerald-800 hover:text-emerald-800"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Target Periode KKN
                </label>
                <select
                  value={data.periode_id}
                  onChange={(e) => setData('periode_id', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-xs font-bold text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  required
                >
                  <option value="">PILIH PERIODE...</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.periode_id && (
                  <span className="text-rose-600 text-xs font-bold uppercase">
                    {errors.periode_id}
                  </span>
                )}
              </div>

              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Judul Agenda
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Workshop Pembekalan Angkatan 57..."
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  required
                />
                {errors.title && (
                  <span className="text-rose-600 text-xs font-bold uppercase">{errors.title}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={data.workshop_date}
                  onChange={(e) => setData('workshop_date', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Kuota Maksimal
                </label>
                <input
                  type="number"
                  value={data.max_participants}
                  onChange={(e) => setData('max_participants', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Waktu Mulai
                </label>
                <input
                  type="time"
                  value={data.start_time}
                  onChange={(e) => setData('start_time', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Waktu Selesai
                </label>
                <input
                  type="time"
                  value={data.end_time}
                  onChange={(e) => setData('end_time', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-medium text-emerald-950 focus:border-emerald-600 outline-none transition-all"
                  placeholder="Contoh: Auditorium Lt. 3..."
                  required
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
                className="h-11 px-8 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {selectedWorkshop ? 'Simpan Perbarui' : 'Tambah Agenda'}
              </button>
            </div>
          </form>
        </div>
      </Modal>{' '}
      {/* PARTICIPANTS MODAL */}
      <Modal
        show={showParticipants}
        onClose={() => setShowParticipants(false)}
        title="Daftar Kehadiran Peserta"
        maxWidth="5xl"
      >
        <div className="max-h-[85vh] flex flex-col font-sans bg-white text-emerald-950">
          <div className="p-8 border-b-2 border-[#f3f4f6] bg-gray-50 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tight">
                Peserta <span className="text-[#0d9488]">Terdata.</span>
              </h3>
              <p className="text-xs font-extrabold text-[#0d9488] uppercase tracking-widest">
                {selectedWorkshop?.title}
              </p>
            </div>
            <button
              onClick={() => setShowParticipants(false)}
              className="h-10 w-10 bg-white border-2 border-[#f3f4f6] text-emerald-950 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"
            >
              <X size={24} />
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
                      <div className="h-10 w-10 rounded-xl bg-[#f0fdfa] flex items-center justify-center text-[#0d9488] font-black border-2 border-emerald-50 uppercase">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-950 group-hover:text-[#0d9488] transition-colors uppercase tracking-tight">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-black bg-emerald-50 text-[#0d9488] px-1.5 py-0.5 rounded border border-emerald-100 tabular-nums">
                            {p.identity_number}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#0d9488]/40 tabular-nums lowercase">
                          {p.email || 'system@uinsaizu.ac.id'}
                        </span>
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell align="center">
                    <input
                      type="checkbox"
                      checked={attendedIds.includes(p.user_id)}
                      onChange={() => toggleAttendance(p.user_id)}
                      className="w-5 h-5 rounded border-gray-300 text-[#0d9488] focus:ring-[#0d9488] transition-all cursor-pointer"
                    />
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    {p.certificate_generated ? (
                      <span className="inline-flex items-center gap-2 text-[10px] font-black text-[#0d9488] bg-[#f0fdfa] px-2 py-1 rounded border border-emerald-100 tracking-widest uppercase">
                        <CheckCircle2 size={10} strokeWidth={3} /> TERBIT
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-widest">
                        BELUM
                      </span>
                    )}
                  </PremiumTableCell>
                </PremiumTableRow>
              ))}
            </PremiumTable>
          </div>

          <div className="p-6 bg-emerald-50/10 border-t-2 border-[#f3f4f6] flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest">
              {selectedWorkshop?.participants?.length || 0} DATA TEREKAM
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setShowParticipants(false)}
                className="h-11 px-6 bg-white border-2 border-[#f3f4f6] text-emerald-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                Tutup
              </button>
              <button
                onClick={saveAttendance}
                disabled={processing}
                className="h-11 px-8 bg-[#0d9488] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#0f766e] transition-all active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {processing ? 'Menyimpan...' : 'Simpan Presensi'}
              </button>
            </div>
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
