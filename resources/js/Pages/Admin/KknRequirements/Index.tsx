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
    Binary,
    Fingerprint,
    Zap,
    Cpu,
    Target,
    Layers,
    Command,
    AlertTriangle,
    ShieldAlert,
    Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';

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
        if (confirm('KONFIRMASI TERMINASI: Apakah Anda yakin ingin menghapus aturan syarat ini? Evaluasi pendaftaran mahasiswa akan terdampak.')) {
            router.delete(route('admin.kkn-requirements.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AppLayout title="Otoritas Persyaratan Dinamis">
            <Head title="Persyaratan KKN | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL: SIERRA VALIDATION ENGINE */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Dynamic Requirement Engine</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            MESIN <span className="text-emerald-500">SYARAT DINAMIS</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Settings size={12} className="text-emerald-500" />
                             Konfigurasi parameter pendaftaran KKN secara real-time melalui pangkalan data prasyarat terpusat.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <button
                            onClick={openCreateModal}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group rounded-none"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            REGISTRASI ATURAN BARU
                        </button>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* TACTICAL ALERT BANNER */}
                    <div className="bg-emerald-50/30 border border-emerald-100 p-10 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all flex flex-col md:flex-row items-center gap-10">
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-500/5 skew-x-12 translate-x-20 pointer-events-none" />
                        <div className="h-16 w-16 bg-emerald-950 text-emerald-400 flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                            <ShieldAlert size={32} />
                        </div>
                        <div className="space-y-2 flex-1 relative z-10">
                            <h3 className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.3em] italic">Protokol Evaluasi Pendaftaran</h3>
                            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest leading-relaxed italic">
                                Sistem secara otomatis mengevaluasi profil mahasiswa terhadap setiap parameter <span className="text-emerald-950 underline underline-offset-4 decoration-emerald-500 decoration-2">AKTIF</span> saat plotting lokasi. <br/>
                                Gunakan operator <code className="bg-white px-2 py-0.5 border border-emerald-100 font-black text-emerald-600 tabular-nums lowercase">in</code> untuk validasi terhadap himpunan status spesifik.
                            </p>
                        </div>
                        <div className="flex items-center gap-6 text-emerald-950 font-black text-[11px] uppercase tracking-[0.4em] italic opacity-30 hover:opacity-100 transition-opacity">
                             <Activity size={18} className="text-emerald-500 animate-pulse" />
                             VALIDATION ENGINE ONLINE
                        </div>
                    </div>

                    {/* DYNAMIC REQUIREMENTS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {requirements.map((req, idx) => (
                            <motion.div 
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={clsx(
                                    "bg-white border p-10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col",
                                    req.is_active ? "border-emerald-100" : "border-emerald-50 border-dashed opacity-60 grayscale-[0.5]"
                                )}
                            >
                                <div className="absolute -right-8 -top-8 p-16 opacity-[0.03] text-emerald-950 group-hover:rotate-12 transition-transform pointer-events-none">
                                    <Binary size={160} strokeWidth={1} />
                                </div>

                                <div className="relative z-10 flex-1 space-y-8">
                                    <div className="flex items-start justify-between border-b border-emerald-50 pb-6">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-emerald-200 uppercase tracking-widest italic flex items-center gap-3">
                                                <Target size={12} className="text-emerald-300" />
                                                RULE_ID: #{req.id}
                                            </span>
                                            <h2 className="text-[14px] font-black text-emerald-950 uppercase italic tracking-widest leading-tight group-hover:text-emerald-600 transition-colors uppercase">{req.name}</h2>
                                        </div>
                                        <button 
                                            onClick={() => toggleStatus(req.id)}
                                            className={clsx(
                                                "h-10 px-4 text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all active:scale-95 shadow-sm",
                                                req.is_active ? "bg-emerald-950 text-white border-emerald-900" : "bg-white text-emerald-100 border-emerald-50"
                                            )}
                                        >
                                            {req.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-emerald-50/30 p-6 border border-emerald-50 group-hover:border-emerald-500 transition-all">
                                            <div className="flex items-center gap-4 mb-3">
                                                <Database size={12} className="text-emerald-300" />
                                                <span className="text-[8px] font-black text-emerald-950 uppercase tracking-widest italic opacity-40">LOGIC COMMAND</span>
                                            </div>
                                            <div className="text-[11px] font-black text-emerald-950 uppercase tracking-widest italic tabular-nums leading-none">
                                                DB:<span className="text-emerald-500">[{req.column_name}]</span> {req.operator} <span className="text-emerald-500">"{req.expected_value}"</span>
                                            </div>
                                        </div>

                                        <div className="bg-rose-50/30 p-6 border border-rose-50 border-dashed">
                                            <div className="flex items-center gap-4 mb-3">
                                                <AlertTriangle size={12} className="text-rose-300" />
                                                <span className="text-[8px] font-black text-rose-300 uppercase tracking-widest italic leading-none">THROWN_ERROR_OUTPUT</span>
                                            </div>
                                            <p className="text-[10.5px] font-black text-emerald-950/60 uppercase tracking-widest italic leading-relaxed italic">"{req.error_message}"</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-8 mt-auto border-t border-emerald-50">
                                        <button 
                                            onClick={() => openEditModal(req)}
                                            className="h-14 bg-white border border-emerald-100 text-emerald-100 hover:text-emerald-950 hover:border-emerald-500 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest italic shadow-sm transition-all active:scale-95 flex-1"
                                        >
                                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                                            MODIFY RULE
                                        </button>
                                        <button 
                                            onClick={() => deleteItem(req.id)}
                                            className="h-14 w-14 bg-rose-50 text-rose-300 border border-rose-50 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {requirements.length === 0 && (
                            <div className="col-span-full py-56 bg-emerald-50/10 border-4 border-dashed border-emerald-50 text-center opacity-20">
                                <Cpu size={80} className="mx-auto mb-8 text-emerald-950 animate-pulse" strokeWidth={0.5} />
                                <p className="text-[12px] font-black uppercase tracking-[0.6em] italic text-emerald-950">REQUIREMENT ENGINE NIHIL</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL COMMANDER TACTICAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/80 backdrop-blur-md italic font-black">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white"
                        >
                            <div className="px-10 py-12 bg-emerald-950 text-white flex items-center justify-between relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 -skew-x-12 translate-x-16 pointer-events-none" />
                                <div className="space-y-1 relative z-10">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                                        {editingItem ? 'MODIFIKASI ATURAN' : 'REGISTRASI ATURAN'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic mt-2">CONFIGURE VALIDATION ENGINE PARAMETER</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 bg-white/10 text-white flex items-center justify-center hover:bg-rose-600 transition-all z-10">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-12 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-emerald-900 uppercase tracking-widest italic ml-1">Nama Syarat / Identifier</label>
                                        <input 
                                            type="text" 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[12px] font-black italic tracking-widest text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all uppercase"
                                            placeholder="MISAL: STATUS_MINIMAL_SKS"
                                            required
                                        />
                                        {errors.name && <p className="text-[8px] text-rose-500 font-black italic uppercase tracking-widest mt-1 ml-1">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-emerald-900 uppercase tracking-widest italic ml-1">Kolom Target (DB Registry)</label>
                                        <select 
                                            value={data.column_name}
                                            onChange={e => setData('column_name', e.target.value)}
                                            className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[11px] font-black italic tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none uppercase"
                                            required
                                        >
                                            <option value="">PILIH ATRIBUT DATABASE...</option>
                                            {availableColumns.map(col => (
                                                <option key={col.value} value={col.value}>{col.label.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        {errors.column_name && <p className="text-[8px] text-rose-500 font-black italic uppercase tracking-widest mt-1 ml-1">{errors.column_name}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-emerald-900 uppercase tracking-widest italic ml-1">Operator Logika</label>
                                        <select 
                                            value={data.operator}
                                            onChange={e => setData('operator', e.target.value)}
                                            className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[11px] font-black italic tracking-widest text-emerald-950 focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none uppercase tabular-nums"
                                            required
                                        >
                                            {operators.map(op => (
                                                <option key={op.value} value={op.value}>{op.label.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-emerald-900 uppercase tracking-widest italic ml-1">Nilai Ekspektasi</label>
                                        <input 
                                            type="text" 
                                            value={data.expected_value}
                                            onChange={e => setData('expected_value', e.target.value)}
                                            className="w-full h-16 bg-emerald-50/20 border border-emerald-50 px-6 text-[12px] font-black italic tracking-widest text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all uppercase tabular-nums"
                                            placeholder="MISAL: 100 / LULUS"
                                            required
                                        />
                                        {errors.expected_value && <p className="text-[8px] text-rose-500 font-black italic uppercase tracking-widest mt-1 ml-1">{errors.expected_value}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-emerald-900 uppercase tracking-widest italic ml-1">Pesan Penolakan (Audit Failed Message)</label>
                                    <textarea 
                                        rows={3}
                                        value={data.error_message}
                                        onChange={e => setData('error_message', e.target.value)}
                                        className="w-full bg-emerald-50/20 border border-emerald-50 p-6 text-[11px] font-black italic tracking-widest text-emerald-950 placeholder:text-emerald-100 focus:bg-white focus:border-emerald-500 outline-none transition-all uppercase leading-loose"
                                        placeholder="MENJELASKAN PENYEBAB KEGAGALAN AUDIT KEPADA MAHASISWA..."
                                        required
                                    />
                                    {errors.error_message && <p className="text-[8px] text-rose-500 font-black italic uppercase tracking-widest mt-1 ml-1">{errors.error_message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-20 bg-emerald-950 text-white text-[12px] font-black uppercase tracking-[0.4em] italic shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-6"
                                >
                                    {processing ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={20} />}
                                    {editingItem ? 'EXECUTE: SAVE_MODIFICATION' : 'EXECUTE: PUBLISH_NEW_RULE'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* SECURITY FOOTER MONITOR TACTICAL */}
                <div className="bg-emerald-950 p-16 text-white shadow-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                            <div className="space-y-8 flex-1">
                                <div className="flex items-center gap-8">
                                <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-2xl font-black text-white italic tracking-[0.4em] uppercase leading-none">Integritas Audit Dinamis</h4>
                                    <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest italic leading-relaxed max-w-3xl">
                                        Mesin syarat dinamis menjamin fleksibilitas operasional pendaftaran tanpa membutuhkan intervensi kode program. 
                                        Setiap perubahan pada aturan ini akan segera berlaku secara universal bagi seluruh antrian pendaftaran aktif.
                                    </p>
                                </div>
                            </div>
                        </div>
                            
                        <div className="flex flex-col items-center xl:items-end gap-6 text-emerald-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-4">
                                    <Fingerprint className="w-6 h-6" />
                                    <span className="text-xl tracking-tighter italic">RULE_ENGINE_STAMP_{new Date().getFullYear()}</span>
                                </div>
                                <span className="text-[8px] tracking-[0.8em] opacity-40">POS-KKN CENTRAL MISSION CONTROL</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
