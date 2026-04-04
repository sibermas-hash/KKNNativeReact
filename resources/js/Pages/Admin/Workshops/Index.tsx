import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';

interface WorkshopParticipant {
 id: number;
 user_id: number;
 name: string;
 email?: string | null;
 attendance_status: 'registered' | 'attended' | 'absent';
 certificate_generated: boolean;
 checked_in_at?: string | null;
}

interface Workshop {
 id: number;
 title: string;
 description: string;
 methodology: string;
 date: string;
 workshop_date_value: string;
 time: string;
 start_time?: string | null;
 end_time?: string | null;
 location: string;
 registered: number;
 max_participants: number | null;
 status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
 is_full: boolean;
 can_edit: boolean;
 can_cancel: boolean;
 participants: WorkshopParticipant[];
}

interface Props {
 workshops: Workshop[];
}

const emptyWorkshopForm = {
 title: '',
 description: '',
 workshop_date: '',
 methodology: '',
 start_time: '',
 end_time: '',
 location: '',
 max_participants: '',
};

export default function WorkshopIndex({ workshops }: Props) {
 const workshopForm = useForm(emptyWorkshopForm);
 const attendanceForm = useForm({
 user_ids: [] as number[],
 });

 const [showForm, setShowForm] = useState(false);
 const [editingWorkshopId, setEditingWorkshopId] = useState<number | null>(null);
 const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
 const [modalMode, setModalMode] = useState<'kehadiran' | 'peserta'>('peserta');

 const selectedParticipants = selectedWorkshop?.participants ?? [];

 const totalAttended = useMemo(
 () => selectedParticipants.filter((participant) => participant.attendance_status === 'attended').length,
 [selectedParticipants],
 );

 const openCreateForm = () => {
 setEditingWorkshopId(null);
 setShowForm(true);
 workshopForm.reset();
 workshopForm.clearErrors();
 };

 const openEditForm = (workshop: Workshop) => {
 setEditingWorkshopId(workshop.id);
 setShowForm(true);
 workshopForm.clearErrors();
 workshopForm.setData({
 title: workshop.title,
 description: workshop.description ?? '',
 workshop_date: workshop.workshop_date_value,
 methodology: workshop.methodology ?? '',
 start_time: workshop.start_time ?? '',
 end_time: workshop.end_time ?? '',
 location: workshop.location ?? '',
 max_participants: workshop.max_participants ? String(workshop.max_participants) : '',
 });
 };

 const closeWorkshopForm = () => {
 setShowForm(false);
 setEditingWorkshopId(null);
 workshopForm.reset();
 workshopForm.clearErrors();
 };

 const openParticipants = (workshop: Workshop) => {
 setSelectedWorkshop(workshop);
 setModalMode('peserta');
 };

 const openAttendance = (workshop: Workshop) => {
 setSelectedWorkshop(workshop);
 setModalMode('kehadiran');
 attendanceForm.setData(
 'user_ids',
 workshop.participants
 .filter((participant) => participant.attendance_status === 'attended')
 .map((participant) => participant.user_id),
 );
 };

 const closeModal = () => {
 setSelectedWorkshop(null);
 attendanceForm.reset();
 };

 const toggleAttendance = (userId: number) => {
 const current = attendanceForm.data.user_ids;
 attendanceForm.setData(
 'user_ids',
 current.includes(userId)
 ? current.filter((id) => id !== userId)
 : [...current, userId],
 );
 };

 const submitWorkshop = (event: React.FormEvent) => {
 event.preventDefault();

 if (editingWorkshopId) {
 workshopForm.patch(`/admin/workshops/${editingWorkshopId}`, {
 preserveScroll: true,
 onSuccess: () => closeWorkshopForm(),
 });
 return;
 }

 workshopForm.post('/admin/workshops', {
 preserveScroll: true,
 onSuccess: () => closeWorkshopForm(),
 });
 };

 const submitAttendance = (event: React.FormEvent) => {
 event.preventDefault();
 if (!selectedWorkshop) {
 return;
 }

 attendanceForm.post(`/admin/workshops/${selectedWorkshop.id}/attendance`, {
 preserveScroll: true,
 onSuccess: () => closeModal(),
 });
 };

 const cancelWorkshop = (workshop: Workshop) => {
 if (!window.confirm(`Batalkan workshop "${workshop.title}"?`)) {
 return;
 }

 router.patch(`/admin/workshops/${workshop.id}/cancel`, {}, { preserveScroll: true });
 };

 return (
 <AppLayout title="Pembekalan">
 <Head title="Manajemen Workshop" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Manajemen Workshop</h1>
 <p className="mt-2 text-sm text-slate-500">
 Kelola agenda pembekalan, peserta, presensi, dan status sertifikat workshop mahasiswa.
 </p>
 </div>

 <button
 type="button"
 onClick={() => (showForm ? closeWorkshopForm() : openCreateForm())}
 className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
 >
 {showForm ? 'Tutup form' : 'Tambah workshop'}
 </button>
 </div>
 </section>

 {showForm && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">
 {editingWorkshopId ? 'Ubah workshop' : 'Tambah workshop'}
 </h2>

 <form onSubmit={submitWorkshop} className="mt-6 grid gap-6 md:grid-cols-2">
 <div className="md:col-span-2">
 <FormInput
 label="Judul"
 required
 value={workshopForm.data.title}
 onChange={(event) => workshopForm.setData('title', event.target.value)}
 error={workshopForm.errors.title}
 />
 </div>
 <FormInput
 type="tanggal"
 label="Tanggal"
 required
 value={workshopForm.data.workshop_date}
 onChange={(event) => workshopForm.setData('workshop_date', event.target.value)}
 error={workshopForm.errors.workshop_date}
 />
 <FormInput
 label="Lokasi"
 value={workshopForm.data.location}
 onChange={(event) => workshopForm.setData('location', event.target.value)}
 error={workshopForm.errors.location}
 />
 <FormInput
 type="time"
 label="Waktu mulai"
 value={workshopForm.data.start_time}
 onChange={(event) => workshopForm.setData('start_time', event.target.value)}
 error={workshopForm.errors.start_time}
 />
 <FormInput
 type="time"
 label="Waktu selesai"
 value={workshopForm.data.end_time}
 onChange={(event) => workshopForm.setData('end_time', event.target.value)}
 error={workshopForm.errors.end_time}
 />
 <FormInput
 type="number"
 label="Kuota peserta"
 value={workshopForm.data.max_participants}
 onChange={(event) => workshopForm.setData('max_participants', event.target.value)}
 error={workshopForm.errors.max_participants}
 />
 <div className="md:col-span-2">
 <FormTextarea
 label="Metode pelaksanaan"
 value={workshopForm.data.methodology}
 onChange={(event) => workshopForm.setData('methodology', event.target.value)}
 error={workshopForm.errors.methodology}
 />
 </div>
 <div className="md:col-span-2">
 <FormTextarea
 label="Deskripsi"
 value={workshopForm.data.description}
 onChange={(event) => workshopForm.setData('deskripsi', event.target.value)}
 error={workshopForm.errors.description}
 />
 </div>

 <div className="md:col-span-2 flex justify-end gap-3">
 <button
 type="button"
 onClick={closeWorkshopForm}
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </button>
 <button
 type="submit"
 disabled={workshopForm.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {workshopForm.processing ? 'Menyimpan...' : editingWorkshopId ? 'Simpan perubahan' : 'Simpan workshop'}
 </button>
 </div>
 </form>
 </section>
 )}

 <section className="grid gap-6 xl:grid-cols-2">
 {workshops.length > 0 ? (
 workshops.map((workshop) => (
 <article key={workshop.id} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <h2 className="text-xl font-semibold text-slate-900">{workshop.title}</h2>
 <p className="mt-1 text-sm text-slate-500">{workshop.description || 'Tidak ada deskripsi.'}</p>
 </div>
 <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
 {workshop.status}
 </span>
 </div>

 <dl className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.date}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waktu</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.time}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lokasi</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.location || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kuota</dt>
 <dd className="mt-1 text-sm text-slate-700">
 {workshop.registered} / {workshop.max_participants || 'Tanpa batas'}
 </dd>
 </div>
 </dl>

 <div className="mt-6 flex flex-wrap gap-3">
 <button
 type="button"
 onClick={() => openParticipants(workshop)}
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Lihat peserta
 </button>
 <button
 type="button"
 onClick={() => openAttendance(workshop)}
 disabled={workshop.participants.length === 0 || workshop.status === 'cancelled'}
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary disabled:opacity-50"
 >
 Input presensi
 </button>
 <button
 type="button"
 onClick={() => openEditForm(workshop)}
 disabled={!workshop.can_edit}
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary disabled:opacity-50"
 >
 Ubah
 </button>
 <button
 type="button"
 onClick={() => cancelWorkshop(workshop)}
 disabled={!workshop.can_cancel}
 className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
 >
 Batalkan
 </button>
 </div>
 </article>
 ))
 ) : (
 <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 xl:col-span-2">
 Belum ada workshop yang terdaftar.
 </div>
 )}
 </section>

 {selectedWorkshop && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
 <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
 <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">
 {modalMode === 'kehadiran' ? 'Presensi workshop' : 'Daftar peserta'}
 </h2>
 <p className="mt-1 text-sm text-slate-500">{selectedWorkshop.title}</p>
 </div>
 <button
 type="button"
 onClick={closeModal}
 className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-primary hover:text-primary"
 >
 Tutup
 </button>
 </div>

 <div className="px-6 py-4">
 <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
 Total peserta: {selectedParticipants.length}. Hadir: {totalAttended}. Sertifikat dibuat:{' '}
 {selectedParticipants.filter((participant) => participant.certificate_generated).length}.
 </div>

 <form onSubmit={submitAttendance}>
 <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 {modalMode === 'kehadiran' && (
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Hadir
 </th>
 )}
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Nama
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Email
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Sertifikat
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {selectedParticipants.length > 0 ? (
 selectedParticipants.map((participant) => {
 const checked = attendanceForm.data.user_ids.includes(participant.user_id);

 return (
 <tr key={participant.id}>
 {modalMode === 'kehadiran' && (
 <td className="px-4 py-3">
 <input
 type="checkbox"
 checked={checked}
 onChange={() => toggleAttendance(participant.user_id)}
 className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
 />
 </td>
 )}
 <td className="px-4 py-3 text-sm font-medium text-slate-900">{participant.name}</td>
 <td className="px-4 py-3 text-sm text-slate-600">{participant.email || '-'}</td>
 <td className="px-4 py-3 text-sm text-slate-600">{participant.attendance_status}</td>
 <td className="px-4 py-3 text-sm text-slate-600">
 {participant.certificate_generated ? 'Sudah dibuat' : 'Belum'}
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td
 colSpan={modalMode === 'kehadiran' ? 5 : 4}
 className="px-4 py-8 text-center text-sm text-slate-500"
 >
 Belum ada peserta pada workshop ini.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {modalMode === 'kehadiran' && (
 <div className="mt-4 flex justify-end gap-3">
 <button
 type="button"
 onClick={closeModal}
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </button>
 <button
 type="submit"
 disabled={attendanceForm.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {attendanceForm.processing ? 'Menyimpan...' : 'Simpan presensi'}
 </button>
 </div>
 )}
 </form>
 </div>
 </div>
 </div>
 )}
 </div>
 </AppLayout>
 );
}
