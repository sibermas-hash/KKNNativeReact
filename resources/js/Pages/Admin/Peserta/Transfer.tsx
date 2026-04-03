import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, FormSelect, FormTextarea } from '@/Components/ui';
import {
    ArrowLeftRight,
    Search,
    RefreshCw,
    Users2,
    IdCard,
    Info,
    X,
    ShieldCheck,
    CheckCircle2,
    Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Student {
    id: number;
    mahasiswa: {
        nama: string;
        nim: string;
    };
    status: string;
    kelompok?: {
        id: number;
        nama_kelompok: string;
        code: string;
    } | null;
    periode: {
        id: number;
        name: string;
        angkatan: number;
        jenis: string;
    };
}

interface PeriodOption {
    id: number;
    name: string;
    angkatan: number;
    jenis: string;
    kuota: number | null;
}

interface GroupOption {
    id: number;
    nama: string;
    capacity: number | null;
    current_count: number;
    available: number | null;
}

interface Props {
    students: Student[];
    targetPeriods: PeriodOption[];
}

export default function StudentTransfer({ students, targetPeriods }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroups, setTargetGroups] = useState<GroupOption[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [search, setSearch] = useState('');

    const transferForm = useForm({
        peserta_kkn_id: '',
        target_period_id: '',
        target_group_id: '',
        reason: '',
    });

    const openTransfer = (student: Student) => {
        setSelectedStudent(student);
        transferForm.setData('peserta_kkn_id', String(student.id));
        transferForm.setData('target_period_id', '');
        transferForm.setData('target_group_id', '');
        transferForm.setData('reason', '');
        setTargetGroups([]);
        setShowModal(true);
    };

    const handlePeriodChange = async (value: string) => {
        transferForm.setData('target_period_id', value);
        transferForm.setData('target_group_id', '');
        setTargetGroups([]);

        if (value) {
            setLoadingGroups(true);
            try {
                const res = await fetch(`/admin/api/transfer-targets?current_period_id=${selectedStudent?.periode.id}&target_period_id=${value}`);
                const data = await res.json();
                setTargetGroups(data.groups || []);
            } catch {
                setTargetGroups([]);
            } finally {
                setLoadingGroups(false);
            }
        }
    };

    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        transferForm.post('/admin/peserta/transfer', {
            onSuccess: () => {
                setShowModal(false);
                setSelectedStudent(null);
                transferForm.reset();
            },
        });
    };

    const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
        pending: { variant: 'warning', label: 'MENUNGGU' },
        approved: { variant: 'success', label: 'TERVERIFIKASI' },
        rejected: { variant: 'danger', label: 'DITOLAK' },
        transferred: { variant: 'info', label: 'PINDAH PERIODE' },
        completed: { variant: 'success', label: 'SELESAI' },
    };

    const filtered = students.filter(s =>
        !search ||
        s.mahasiswa.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.mahasiswa.nim.includes(search)
    );

    const transferableStudents = filtered.filter(s => s.status !== 'completed' && s.status !== 'rejected');

    const periodOptions = targetPeriods.map(p => ({
        value: p.id,
        label: `ANGKATAN ${p.angkatan} // ${p.jenis} [${p.name}]${p.kuota ? ` (CAP: ${p.kuota})` : ''}`,
    }));

    const groupOptions = targetGroups.map(g => ({
        value: g.id,
        label: `KELOMPOK ${g.nama} (${g.current_count}/${g.capacity ?? '∞'})${g.available !== null ? ` - SISA: ${g.available}` : ''}`,
    }));

    return (
        <AppLayout title="Transfer Peserta KKN">
            <Head title="Manajemen Re-Deployment" />

            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <ArrowLeftRight className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                STUDENT_TRANSMISSION_VAL_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Transfer <span className="text-emerald-300 text-glow-emerald italic">Peserta</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Manajemen mobilisasi mahasiswa antar periode operasional dan penyesuaian alokasi unit kelompok pengabdian secara terintegrasi dalam ekosistem KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6 transition-all">
                                <Users2 className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Siap Mobilisasi</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{transferableStudents.length} Mahasiswa</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                    <div className="relative group max-w-lg w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari NIM atau Nama Peserta..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-14 pr-8 py-4.5 bg-white border border-slate-100 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-primary/50 transition-all italic
                        />
                    </div>
                </div>

                {/* Data Registry */}
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Identitas Peserta</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic whitespace-nowrap">Siklus Aktif</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Penugasan Unit</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase  text-slate-400 italic">Otorisasi</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-bold uppercase  text-slate-400 italic">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-30">
                                                <IdCard className="h-14 w-14 text-slate-200" />
                                                <p className="text-[11px] font-bold text-slate-400 uppercase  italic">Tidak ada koordinat peserta ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((s) => {
                                        const status = statusMap[s.status] || { variant: 'warning' as const, label: s.status.toUpperCase() };
                                        const canTransfer = s.status !== 'completed' && s.status !== 'rejected';
                                        return (
                                            <tr key={s.id} className="group/row hover:bg-slate-50/30 transition-all">
                                                <td className="px-10 py-7">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[14px] font-black text-slate-400 group-hover/row:bg-primary group-hover/row:text-white transition-all italic leading-none">
                                                            {s.mahasiswa.nama.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[15px] font-black text-slate-900 group-hover/row:text-primary transition-colors italic uppercase leading-tight">{s.mahasiswa.nama}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase  italic">NIM: {s.mahasiswa.nim}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-700 uppercase italic">
                                                        <span>{s.periode.name}</span>
                                                        <span className="text-[8px] font-bold text-slate-300 uppercase  italic opacity-60">Fase {s.periode.angkatan} - {s.periode.jenis}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    {s.kelompok ? (
                                                        <div className="inline-flex items-center gap-3 px-3.5 py-1.5 bg-primary/5 rounded-xl border border-primary/10">
                                                            <Users2 className="w-3.5 h-3.5 text-primary/60" />
                                                            <span className="text-[10px] font-black text-primary uppercase  italic">
                                                                {s.kelompok.nama_kelompok || s.kelompok.code}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase  italic opacity-40">Belum Ditugaskan</span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <Badge variant={status.variant} className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase  italic border-none
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-10 py-7 text-right">
                                                    {canTransfer ? (
                                                        <div className="flex justify-end translate-x-2 group-hover/row:translate-x-0 transition-all opacity-0 group-hover/row:opacity-100">
                                                            <button
                                                                onClick={() => openTransfer(s)}
                                                                className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase   transition-all italic"
                                                            >
                                                                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                                                                Pindahkan
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end grayscale opacity-30">
                                                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                                <CheckCircle2 className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Footer Monitor */}
                <div className="p-10 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">PROTOKOL_MOBILISASI_MAHASISWA</h4>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-70">
                                Setiap perpindahan peserta akan dicatat secara permanen dalam basis data re-deployment. 
                                Seluruh luaran akademik (laporan harian, nilai, logbook) akan dimigrasikan secara otomatis 
                                ke unit kelompok atau periode tujuan untuk menjaga kontinuitas rekam jejak pengabdian.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 border-l border-slate-800 pl-10">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse />
                                <span className="text-[10px] font-black text-slate-100 uppercase  italic">SECURITY_LEDGER_ACTIVE</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-colors cursor-help
                                    <Info className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transfer Modal - V3 Premium */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40">
                    <div className="bg-white rounded-lg w-full max-w-xl border border-slate-200 overflow-hidden zoom-in-95">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-lg bg-slate-900 text-primary flex items-center justify-center
                                    <ArrowLeftRight className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900  leading-none uppercase italic">Re-Deployment</h4>
                                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase  italic">Konfigurasi Transfer Peserta</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="h-12 w-12 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} className="p-10 space-y-10">
                            {selectedStudent && (
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-8
                                    <div className="h-16 w-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-primary italic leading-none">
                                        {selectedStudent.mahasiswa.nama.charAt(0)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xl font-black text-slate-900  leading-none italic uppercase">{selectedStudent.mahasiswa.nama}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-primary  uppercase italic bg-primary/10 px-2.5 py-1 rounded-lg">PROFIL TERVERIFIKASI</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase italic">NIM: {selectedStudent.mahasiswa.nim}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase  ml-4 italic block">Siklus Periode Tujuan</label>
                                    <FormSelect
                                        placeholder="Pilih Siklus Target..."
                                        options={periodOptions}
                                        value={transferForm.data.target_period_id}
                                        onChange={(e) => handlePeriodChange(e.target.value)}
                                        error={transferForm.errors.target_period_id}
                                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-bold h-15 rounded-lg focus:bg-white focus:border-primary/50 italic"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase  ml-4 italic block">Unit Kelompok Tujuan (Opsional)</label>
                                    <FormSelect
                                        placeholder={loadingGroups ? 'Memindai Unit...' : 'Pilih Kelompok (Opsional)...'}
                                        options={groupOptions}
                                        value={transferForm.data.target_group_id}
                                        onChange={(e) => transferForm.setData('target_group_id', e.target.value)}
                                        disabled={loadingGroups || targetGroups.length === 0}
                                        error={transferForm.errors.target_group_id}
                                        className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-bold h-15 rounded-lg focus:bg-white focus:border-primary/50 italic"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase  ml-4 italic block">Justifikasi Re-Deployment</label>
                                    <FormTextarea
                                        value={transferForm.data.reason}
                                        onChange={(e) => transferForm.setData('reason', e.target.value)}
                                        placeholder="Tuliskan alasan pemindahan ke siklus operasional yang baru..."
                                        rows={3}
                                        error={transferForm.errors.reason}
                                        required
                                        className="bg-slate-50 border-slate-200 text-slate-600 text-sm font-medium h-32rounded-lg focus:bg-white focus:border-primary/50 italic"
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-primary/5 rounded-lg border border-primary/10 flex gap-6">
                                <Info className="w-8 h-8 text-primary shrink-0 transition-transform group-hover:rotate-12" />
                                <p className="text-[11px] font-bold text-primary uppercase  leading-relaxed italic">
                                    Otorisasi transfer akan memindahkan profil mahasiswa secara permanen ke siklus target. Pastikan data koordinat dan periode telah benar sebelum eksekusi final.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 text-[11px] font-black text-slate-400 uppercase  rounded-lg hover:bg-slate-50 transition-all italic border border-slate-100"
                                >
                                    BATAL
                                </button>
                                <button
                                    type="submit"
                                    disabled={transferForm.processing}
                                    className="flex-[2] py-5 bg-slate-900 text-white text-[11px] font-black uppercase  rounded-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 italic"
                                >
                                    <RefreshCw className={clsx("w-4 h-4 text-primary", transferForm.processing && "animate-spin")} />
                                    Eksekusi Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
