import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Plus, 
    Settings, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    AlertCircle,
    Info,
    Search,
    RefreshCw,
    ShieldCheck,
    Database,
    Binary
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';

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
        if (confirm('Apakah Anda yakin ingin menghapus syarat ini?')) {
            router.delete(route('admin.kkn-requirements.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AppLayout title="Persyaratan KKN">
            <Head title="Persyaratan KKN Dinamis" />

            <div className="space-y-8 pb-20">
                {/* --- HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                                <Settings size={20} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Mesin Syarat Dinamis</h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Kelola aturan pendaftaran KKN secara real-time tanpa menyentuh kode program.</p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/10 active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Tambah Aturan Baru
                    </button>
                </div>

                {/* --- ALERT INFO --- */}
                <div className="bg-sky-50 border border-sky-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sky-500 shrink-0">
                        <Info size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-sky-900 uppercase italic">Panduan Cepat</h3>
                        <p className="text-xs text-sky-700 leading-relaxed">
                            Sistem akan mengevaluasi profil mahasiswa terhadap semua aturan <strong>AKTIF</strong> di bawah ini saat proses pendaftaran (plotting). 
                            Gunakan operator <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold">in</code> untuk mengecek daftar status (misal: LULUS, PASSED).
                        </p>
                    </div>
                </div>

                {/* --- GRID PERSYARATAN --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {requirements.map((req) => (
                        <div key={req.id} className={clsx(
                            "group relative bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden",
                            req.is_active ? "border-slate-100" : "border-slate-200 opacity-70 grayscale-[0.5]"
                        )}>
                            {/* Decorative Icon */}
                            <div className="absolute -top-4 -right-4 p-10 opacity-[0.03] text-slate-900 group-hover:rotate-12 transition-transform">
                                <Binary size={120} />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Aturan ID: #{req.id}</p>
                                        <h2 className="text-lg font-black text-slate-900 leading-tight italic uppercase">{req.name}</h2>
                                    </div>
                                    <button 
                                        onClick={() => toggleStatus(req.id)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                            req.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                                        )}
                                    >
                                        {req.is_active ? 'AKTIF' : 'NON-AKTIF'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                            <Database size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Logika Cek</p>
                                            <p className="text-xs font-bold text-slate-700 truncate">
                                                <span className="text-emerald-600">[{req.column_name}]</span> {req.operator} <span className="text-emerald-600">"{req.expected_value}"</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1 leading-none">Pesan Kesalahan</p>
                                        <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">"{req.error_message}"</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                    <button 
                                        onClick={() => openEditModal(req)}
                                        className="flex-1 h-12 bg-white border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        Ubah Aturan
                                    </button>
                                    <button 
                                        onClick={() => deleteItem(req.id)}
                                        className="h-12 w-12 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {requirements.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 text-center">
                            <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-spin-slow" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Belum ada persyaratan dinamis yang dikonfigurasi.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL CREATE/EDIT --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
                        <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic uppercase tracking-tight">
                                    {editingItem ? 'Edit Aturan' : 'Buat Aturan Baru'}
                                </h3>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic">Konfigurasi Mesin Validasi</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Syarat</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="Misal: Minimal 100 SKS"
                                        required
                                    />
                                    {errors.name && <p className="text-[10px] text-rose-500 font-bold italic px-2">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kolom Data (Database)</label>
                                    <select 
                                        value={data.column_name}
                                        onChange={e => setData('column_name', e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                                        required
                                    >
                                        <option value="">Pilih kolom...</option>
                                        {availableColumns.map(col => (
                                            <option key={col.value} value={col.value}>{col.label}</option>
                                        ))}
                                    </select>
                                    {errors.column_name && <p className="text-[10px] text-rose-500 font-bold italic px-2">{errors.column_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator</label>
                                    <select 
                                        value={data.operator}
                                        onChange={e => setData('operator', e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                                        required
                                    >
                                        {operators.map(op => (
                                            <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nilai Harapan</label>
                                    <input 
                                        type="text" 
                                        value={data.expected_value}
                                        onChange={e => setData('expected_value', e.target.value)}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="Misal: 100 atau LULUS"
                                        required
                                    />
                                    {errors.expected_value && <p className="text-[10px] text-rose-500 font-bold italic px-2">{errors.expected_value}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesan Penolakan (Error Message)</label>
                                <textarea 
                                    rows={3}
                                    value={data.error_message}
                                    onChange={e => setData('error_message', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none italic leading-relaxed"
                                    placeholder="Jelaskan kenapa pendaftaran ditolak jika syarat ini tidak terpenuhi..."
                                    required
                                />
                                {errors.error_message && <p className="text-[10px] text-rose-500 font-bold italic px-2">{errors.error_message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                            >
                                {processing ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}
                                {editingItem ? 'Simpan Perubahan' : 'Terbitkan Aturan Baru'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
