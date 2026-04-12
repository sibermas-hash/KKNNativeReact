import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus,
    Settings,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    ShieldCheck,
    Database,
    X,
    Edit2,
    Save,
    Search,
    ClipboardCheck,
    ToggleLeft,
    ToggleRight,
    Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';

interface Requirement {
    id: number;
    name: string;
    column_name: string;
    operator: string;
    expected_value: string;
    error_message: string;
    is_active: boolean;
}

interface Option {
    value: string;
    label: string;
}

interface Props {
    requirements: Requirement[];
    availableColumns: Option[];
    operators: Option[];
}

export default function KknRequirementsIndex({ requirements, availableColumns, operators }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Requirement | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        column_name: '',
        operator: '>=',
        expected_value: '',
        error_message: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingItem(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (requirement: Requirement) => {
        setEditingItem(requirement);
        setData({
            name: requirement.name,
            column_name: requirement.column_name,
            operator: requirement.operator,
            expected_value: requirement.expected_value,
            error_message: requirement.error_message,
            is_active: requirement.is_active,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            put(route('admin.kkn-requirements.update', editingItem.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.kkn-requirements.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const toggleStatus = (id: number) => {
        router.patch(route('admin.kkn-requirements.toggle', id), {}, {
            preserveScroll: true
        });
    };

    const deleteItem = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus aturan syarat ini? Proses evaluasi pendaftaran akan terpengaruh.')) {
            router.delete(route('admin.kkn-requirements.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const activeCount = requirements.filter(r => r.is_active).length;

    const formatOperator = (op: string) => {
        const map: Record<string, string> = {
            '>=': '≥ (lebih dari atau sama)',
            '<=': '≤ (kurang dari atau sama)',
            '=': '= (sama dengan)',
            '!=': '≠ (tidak sama)',
            '>': '> (lebih dari)',
            '<': '< (kurang dari)',
            'in': '∈ (termasuk dalam)',
        };
        return map[op] || op;
    };

    const formatOperatorShort = (op: string) => {
        const map: Record<string, string> = { '>=': '≥', '<=': '≤', '=': '=', '!=': '≠', '>': '>', '<': '<', 'in': '∈' };
        return map[op] || op;
    };

    return (
        <AppLayout title="Persyaratan KKN">
            <Head title="Persyaratan KKN | POS-KKN" />

            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-8 py-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Validasi & Persyaratan</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Aturan <span className="text-emerald-600">Persyaratan KKN</span>
                                </h1>
                                <p className="text-slate-500 max-w-2xl text-lg font-medium">
                                    Kelola syarat-syarat yang harus dipenuhi mahasiswa untuk mendaftar KKN. Sistem secara otomatis memvalidasi setiap pendaftaran berdasarkan aturan aktif.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Stats */}
                                <div className="hidden xl:flex items-center gap-6">
                                    <div className="flex flex-col items-end px-6 border-r border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Aturan</span>
                                        <span className="text-2xl font-black text-slate-900 tabular-nums">{requirements.length}</span>
                                    </div>
                                    <div className="flex flex-col items-end px-6 border-r border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktif</span>
                                        <span className="text-2xl font-black text-emerald-600 tabular-nums">{activeCount}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={openCreateModal}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-3 group active:scale-95"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    Tambah Aturan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="max-w-[1600px] mx-auto px-8 mt-8">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Info size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-emerald-900">Cara Kerja Validasi Otomatis</h3>
                            <p className="text-sm text-emerald-800/70 leading-relaxed">
                                Setiap aturan yang berstatus <span className="font-bold text-emerald-700">Aktif</span> akan dievaluasi secara otomatis saat mahasiswa mendaftar KKN.
                                Jika data mahasiswa tidak memenuhi syarat, sistem akan menampilkan pesan penolakan yang telah ditentukan.
                                Gunakan operator <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-200 text-emerald-700">in</code> untuk memvalidasi terhadap beberapa nilai sekaligus (misal: status kelulusan).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="max-w-[1600px] mx-auto px-8 mt-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-12">#</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Syarat</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kondisi Validasi</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pesan Penolakan</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {requirements.map((req, idx) => (
                                        <tr key={req.id} className={clsx(
                                            "transition-all group",
                                            req.is_active ? "hover:bg-slate-50/50" : "opacity-50 bg-slate-50/30"
                                        )}>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-300 tabular-nums">{idx + 1}</td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1.5">
                                                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{req.name}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {req.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                                                    <Database size={14} className="text-emerald-500" />
                                                    <span className="text-sm font-bold text-slate-700">{req.column_name}</span>
                                                    <span className="text-emerald-600 font-black text-base mx-1">{formatOperatorShort(req.operator)}</span>
                                                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">"{req.expected_value}"</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm text-slate-500 max-w-xs leading-relaxed line-clamp-2">{req.error_message}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => toggleStatus(req.id)}
                                                    className="group/toggle inline-flex items-center gap-2 transition-all active:scale-90"
                                                    title={req.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                                                >
                                                    {req.is_active ? (
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-xl border border-emerald-200 uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-xl border border-slate-200 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                                                            <div className="w-2 h-2 bg-slate-300 rounded-full" /> Nonaktif
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(req)}
                                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90 border border-slate-100"
                                                        title="Ubah Aturan"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteItem(req.id)}
                                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all active:scale-90 border border-slate-100"
                                                        title="Hapus Aturan"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {requirements.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <ClipboardCheck size={64} strokeWidth={1.5} />
                                                    <p className="text-lg font-bold">Belum Ada Aturan</p>
                                                    <p className="text-sm text-slate-400">Klik "Tambah Aturan" untuk membuat persyaratan baru</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                            {editingItem ? 'Ubah Aturan' : 'Tambah Aturan Baru'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Konfigurasi Persyaratan Pendaftaran KKN</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nama Syarat */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama Syarat</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 h-14 rounded-2xl px-5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-base font-semibold"
                                            placeholder="Contoh: Minimal SKS Pendaftaran"
                                            required
                                        />
                                        {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
                                    </div>

                                    {/* Kolom Target */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kolom Data</label>
                                        <select
                                            value={data.column_name}
                                            onChange={e => setData('column_name', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 h-14 rounded-2xl px-5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-sm font-semibold appearance-none"
                                            required
                                        >
                                            <option value="">Pilih kolom data...</option>
                                            {availableColumns.map(col => (
                                                <option key={col.value} value={col.value}>{col.label}</option>
                                            ))}
                                        </select>
                                        {errors.column_name && <p className="text-xs text-rose-500">{errors.column_name}</p>}
                                    </div>

                                    {/* Operator */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Operator</label>
                                        <select
                                            value={data.operator}
                                            onChange={e => setData('operator', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 h-14 rounded-2xl px-5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-sm font-semibold appearance-none"
                                            required
                                        >
                                            {operators.map(op => (
                                                <option key={op.value} value={op.value}>{formatOperator(op.value)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Nilai Ekspektasi */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nilai yang Diharapkan</label>
                                        <input
                                            type="text"
                                            value={data.expected_value}
                                            onChange={e => setData('expected_value', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 h-14 rounded-2xl px-5 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-base font-semibold tabular-nums"
                                            placeholder="Contoh: 100 atau LULUS,PASSED"
                                            required
                                        />
                                        {errors.expected_value && <p className="text-xs text-rose-500">{errors.expected_value}</p>}
                                    </div>

                                    {/* Status Toggle */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                                        <div className="bg-slate-50 border border-slate-100 h-14 rounded-2xl px-5 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {data.is_active ? 'Aturan Aktif' : 'Aturan Nonaktif'}
                                            </span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_active}
                                                    onChange={e => setData('is_active', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-12 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-emerald-500 transition-colors duration-300 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Pesan Penolakan */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={12} className="text-amber-500" /> Pesan Penolakan (ditampilkan ke mahasiswa)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.error_message}
                                        onChange={e => setData('error_message', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-sm font-medium leading-relaxed"
                                        placeholder="Contoh: Syarat minimal SKS untuk mendaftar KKN adalah 100."
                                        required
                                    />
                                    {errors.error_message && <p className="text-xs text-rose-500">{errors.error_message}</p>}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-8 py-4 text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-xs transition-colors"
                                    >
                                        Batalkan
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-slate-900 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl active:scale-95"
                                    >
                                        {processing ? (
                                            <><RefreshCw size={18} className="animate-spin" /> Menyimpan...</>
                                        ) : (
                                            <><Save size={18} /> {editingItem ? 'Simpan Perubahan' : 'Simpan Aturan'}</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
