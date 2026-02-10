import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { CalendarIcon, MapPinIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Workshop {
    id: number;
    title: string;
    description: string;
    methodology: string;
    date: string;
    time: string;
    location: string;
    registered: number;
    max_participants: number;
    is_full: boolean;
}

interface Props {
    workshops: Workshop[];
}

declare function route(name: string, params?: any): string;

export default function WorkshopIndex({ workshops }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        workshop_date: '',
        methodology: '',
        location: '',
    });

    const [showForm, setShowForm] = React.useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = React.useState<Workshop | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = React.useState(false);

    const attendForm = useForm({
        user_ids: [] as number[],
    });

    const openAttendance = (workshop: Workshop) => {
        setSelectedWorkshop(workshop);
        setShowAttendanceModal(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.workshops.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const submitAttendance = (e: React.FormEvent) => {
        e.preventDefault();
        attendForm.post(route('admin.mark-attendance', selectedWorkshop?.id), {
            onSuccess: () => {
                setShowAttendanceModal(false);
                attendForm.reset();
            },
        });
    };

    return (
        <AppLayout title="Workshop Pembekalan">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Workshop Pembekalan</h1>
                        <p className="text-sm text-slate-500">Kelola pelatihan persiapan KKN bagi mahasiswa.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Tambah Workshop
                    </button>
                </div>

                {showForm && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in">
                        <form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Judul Workshop</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary"
                                    placeholder="Contoh: Metodologi ABCD dalam KKN"
                                />
                                {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Tanggal</label>
                                <input
                                    type="date"
                                    value={data.workshop_date}
                                    onChange={e => setData('workshop_date', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Lokasi / Ruangan</label>
                                <input
                                    type="text"
                                    value={data.location}
                                    onChange={e => setData('location', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary"
                                    placeholder="Contoh: Aula Gedung C"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-3 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                                >
                                    Simpan Workshop
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {workshops.map((workshop) => (
                        <div key={workshop.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg">
                            <div className="p-6">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">{workshop.title}</h3>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workshop.is_full ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {workshop.is_full ? 'Penuh' : 'Tersedia'}
                                    </span>
                                </div>
                                <p className="mb-6 text-sm text-slate-600 line-clamp-2">{workshop.description}</p>

                                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span className="text-[10px] font-medium">{workshop.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPinIcon className="h-4 w-4" />
                                        <span className="text-[10px] font-medium truncate">{workshop.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <UsersIcon className="h-4 w-4" />
                                        <span className="text-[10px] font-medium">{workshop.registered} / {workshop.max_participants || '∞'}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">
                                        Detail Peserta
                                    </button>
                                    <button
                                        onClick={() => openAttendance(workshop)}
                                        className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition"
                                    >
                                        Presensi
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {showAttendanceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8">
                            <h3 className="text-xl font-bold mb-4">Input Presensi: {selectedWorkshop?.title}</h3>
                            <p className="text-sm text-slate-500 mb-6">Pilih mahasiswa yang hadir untuk menerbitkan sertifikat otomatis.</p>

                            <form onSubmit={submitAttendance}>
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 mb-6">
                                    Fitur presensi real akan menampilkan daftar mahasiswa terdaftar. Klik tombol di bawah untuk simulasi presensi.
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 py-3 font-bold text-slate-500">Tutup</button>
                                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Lakukan Presensi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
