import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    ShieldCheck,
    Database,
    X,
    Edit2,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Target,
    Zap,
    Scale,
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/Components/ui';

interface Requirement { id: number; name: string; column_name: string; operator: string; expected_value: string; error_message: string; is_active: boolean; }
interface Option { value: string; label: string; }
interface Props { requirements: Requirement[]; availableColumns: Option[]; operators: Option[]; }

export default function KknRequirementsIndex({ requirements, availableColumns, operators }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Requirement | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '', column_name: '', operator: '>=', expected_value: '', error_message: '', is_active: true,
    });

    const openCreateModal = () => { setEditingItem(null); reset(); clearErrors(); setIsModalOpen(true); };
    const openEditModal = (r: Requirement) => { setEditingItem(r); setData({ name: r.name, column_name: r.column_name, operator: r.operator, expected_value: r.expected_value, error_message: r.error_message, is_active: r.is_active }); clearErrors(); setIsModalOpen(true); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const config = { onSuccess: () => { setIsModalOpen(false); reset(); } };
        editingItem ? put(route('admin.kkn-requirements.update', editingItem.id), config) : post(route('admin.kkn-requirements.store'), config);
    };

    const toggleStatus = (id: number) => router.patch(route('admin.kkn-requirements.toggle', id), {}, { preserveScroll: true });
    const deleteItem = (id: number) => confirm('Hapus aturan ini?') && router.delete(route('admin.kkn-requirements.destroy', id), { preserveScroll: true });

    return (
        <AppLayout title="Persyaratan KKN">
            <Head title="System Validation Registry" />

            <div className="space-y-4 font-sans text-slate-900">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">System Validation Registry</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Security Node / Enrollment Requirement Protocol</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-10 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Rules:</span>
                                <span className="text-sm font-black italic">{requirements.filter(r => r.is_active).length}</span>
                            </div>
                         </div>
                         <Button onClick={openCreateModal} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 group">
                            <Plus size={16} className="text-emerald-500 transition-transform group-hover:rotate-90" />
                            <span className="text-[10px] font-black uppercase tracking-widest">New Protocol</span>
                         </Button>
                    </div>
                </div>

                {/* --- LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Scale size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Validation Logic Database</span>
                         </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center text-slate-200">ID</th>
                                    <th className="px-6 py-4">Protocol Identity</th>
                                    <th className="px-6 py-4">Logic Condition</th>
                                    <th className="px-6 py-4">Error Return Message</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requirements.map((r) => (
                                    <tr key={r.id} className={clsx('group hover:bg-slate-50/50 transition-all', !r.is_active && 'opacity-60 grayscale-[0.5]')}>
                                        <td className="px-6 py-4 text-center">
                                             <span className="text-[10px] font-black text-slate-200 font-mono italic">#{r.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900 uppercase italic group-hover:text-emerald-700 transition-colors">{r.name}</span>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-1">NODE_ID_AFFIRMED</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                                <Database size={12} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-700 font-mono">{r.column_name}</span>
                                                <span className="text-emerald-600 font-black italic">{r.operator}</span>
                                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 rounded">"{r.expected_value}"</span>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight line-clamp-1 max-w-[200px]">{r.error_message}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <button onClick={() => toggleStatus(r.id)} className={clsx('inline-flex h-7 items-center px-4 rounded-full text-[8px] font-black tracking-widest italic border transition-all active:scale-95', r.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100')}>
                                                {r.is_active ? 'ENABLED' : 'DISABLED'}
                                             </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <button onClick={() => openEditModal(r)} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-lg flex items-center justify-center transition-all"><Edit2 size={14} /></button>
                                                <button onClick={() => deleteItem(r.id)} className="h-8 w-8 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Zap size={200} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0 text-emerald-500"><AlertTriangle size={28} /></div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black uppercase tracking-tight leading-none italic">Automatic Validation Kernel</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xl">Setiap aturan yang berstatus ENABLED dievaluasi otomatis saat pendaftaran. Kegagalan validasi akan memicu pesan penolakan instan kepada calon peserta.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden font-sans border border-slate-100">
                             <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black uppercase tracking-widest italic">{editingItem ? 'Edit Protocol' : 'New Validation Node'}</h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Requirement configuration panel</span>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                             </div>
                             <form onSubmit={submit} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Name</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-4 text-[12px] font-black uppercase italic focus:border-emerald-500 outline-none transition-all" placeholder="MINIMAL_SKS_ELIGIBILITY" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Column</label>
                                        <select value={data.column_name} onChange={e => setData('column_name', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[11px] font-bold uppercase tracking-tight italic" required>
                                            <option value="">SELECT SOURCE</option>
                                            {availableColumns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</label>
                                        <select value={data.operator} onChange={e => setData('operator', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[11px] font-black italic">
                                            {operators.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Value</label>
                                    <input type="text" value={data.expected_value} onChange={e => setData('expected_value', e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-100 rounded-lg px-4 text-[12px] font-black italic tabular-nums" placeholder="VAL_000" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Violation Return Message</label>
                                    <textarea value={data.error_message} onChange={e => setData('error_message', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-[11px] font-bold italic h-24" placeholder="RETURN_PROTOCOL_FAILED_REASON" required />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-slate-100 text-emerald-600 focus:ring-emerald-500" />
                                    <label htmlFor="is_active" className="text-[10px] font-black uppercase text-slate-600 tracking-widest cursor-pointer">Protocol Active</label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold uppercase text-slate-300 hover:text-slate-900 transition-colors">Abort</button>
                                    <Button type="submit" disabled={processing} className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-2">{processing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} SAVE_NODE</Button>
                                </div>
                             </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
