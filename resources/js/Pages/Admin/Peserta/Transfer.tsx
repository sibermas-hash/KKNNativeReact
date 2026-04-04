import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    ArrowRightLeft,
    ChevronRight,
    MapPin,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ShieldAlert,
    Cpu,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';

interface Student {
    id: number;
    nim: string;
    user: { name: string; };
    group?: {
        id: number;
        name: string;
        location?: {
            kecamatan: string;
            kabupaten: string;
        };
    };
}

interface Group {
    id: number;
    name: string;
    location?: {
        kecamatan: string;
        kabupaten: string;
    };
}

interface Props {
    students: {
        data: Student[];
        meta: Record<string, unknown>;
    };
    groups: Group[];
    filters: { search?: string };
}

export default function StudentTransfer({ students, groups, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.peserta.transfer'), { search }, { preserveState: true });
    };

    const handleTransfer = () => {
        if (!selectedStudent || !targetGroupId) return;
        
        if (confirm(`Apakah Anda yakin ingin memindahkan mahasiswa ${selectedStudent.user.name} ke kelompok baru?`)) {
            router.post(route('admin.peserta.transfer.store'), {
                student_id: selectedStudent.id,
                target_group_id: targetGroupId,
            }, {
                onSuccess: () => {
                    setSelectedStudent(null);
                    setTargetGroupId('');
                }
            });
        }
    };

    return (
        <AppLayout title="Transfer Peserta">
            <Head title="Mobilitas Mahasiswa" />

            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transfer Peserta</h1>
                        <p className="text-sm text-slate-500 mt-1">Sistem pemindahan personel mahasiswa antar unit kelompok KKN.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={() => router.reload()}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            RESCAN_LEDGER
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Select Personel Section */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shadow-sm border border-emerald-100/50">
                                    <Search className="w-5 h-5 shadow-sm shadow-emerald-500/20" />
                                </div>
                                <h3 className="font-bold text-slate-900 tracking-tight">Cari Mahasiswa</h3>
                            </div>
                            
                            <form onSubmit={handleSearch} className="relative group mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="search"
                                    placeholder="Cari NIM atau Nama..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                                />
                            </form>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {students.data.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl border text-left transition-all group flex items-center justify-between",
                                            selectedStudent?.id === student.id 
                                                ? "bg-slate-900 border-slate-800 shadow-xl" 
                                                : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "h-10 w-10 flex items-center justify-center rounded-lg font-bold text-xs italic",
                                                selectedStudent?.id === student.id ? "bg-primary text-slate-900" : "bg-slate-900 text-primary"
                                            )}>
                                                {student.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={clsx(
                                                    "text-xs font-bold  mb-1.5 truncate max-w-[150px]",
                                                    selectedStudent?.id === student.id ? "text-white" : "text-slate-900"
                                                )}>{student.user.name}</p>
                                                <p className={clsx(
                                                    "text-xs font-bold uppercase tracking-wider",
                                                    selectedStudent?.id === student.id ? "text-primary/50" : "text-slate-400"
                                                )}>{student.nim}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={clsx(
                                            "w-4 h-4 transition-transform",
                                            selectedStudent?.id === student.id ? "text-primary" : "text-slate-200"
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute top-0 right-0 p-8 text-emerald-500 opacity-5  transition-transform">
                                <ShieldAlert className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <AlertTriangle className="w-8 h-8 text-emerald-500 mb-2 shadow-sm shadow-emerald-500/20" />
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Peringatan Transmisi</h4>
                                    <p className="text-sm text-slate-500 font-medium italic">
                                        Pemindahan ini bersifat permanen dan akan memicu audit pembaruan logistik unit kelompok tujuan secara otomatis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Execution Section */}
                    <div className="xl:col-span-8">
                        {selectedStudent ? (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                                <div className="p-10 border-b border-slate-50 space-y-10">
                                    <div className="flex items-center gap-8 justify-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asal Unit</span>
                                            <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-primary text-3xl font-bold shadow-2xl  transition-transform italic">
                                                {selectedStudent.user.name.charAt(0)}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-slate-900 text-sm mb-1">{selectedStudent.user.name}</p>
                                                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-400 italic">#{selectedStudent.nim}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-4 px-10">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-8 bg-slate-100 rounded-full" />
                                                <div className="h-12 w-12 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center animate-pulse">
                                                    <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="h-1 w-8 bg-slate-100 rounded-full" />
                                            </div>
                                            <div className="px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-widest italic animate-pulse">Transmisi_Aktif</div>
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Unit</span>
                                            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center animate-pulse">
                                                <ArrowRight className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 italic">SIAP_INJEKSI</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 pt-6">
                                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status Saat Ini</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 tracking-tight  mb-2 italic uppercase">{selectedStudent.group?.name || 'BELUM_ADA_UNIT'}</h4>
                                                <p className="text-xs font-bold text-slate-400 italic">
                                                    {selectedStudent.group?.location ? `${selectedStudent.group.location.kecamatan}` : 'LOKASI_TIDAK_TERDETEKSI'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <RefreshCw className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Tujuan Baru</span>
                                            </div>
                                            <select
                                                value={targetGroupId}
                                                onChange={(e) => setTargetGroupId(e.target.value)}
                                                className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm italic"
                                            >
                                                <option value="">-- Pilih Kelompok Tujuan --</option>
                                                {groups.filter(g => g.id !== selectedStudent.group?.id).map(g => (
                                                    <option key={g.id} value={g.id.toString()}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-slate-50 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-4 text-slate-400 italic">
                                        <ShieldAlert className="w-8 h-8" />
                                        <p className="text-sm font-medium  max-w-lg">Pastikan koordinasi internal antar unit telah terpenuhi sebelum mengeksekusi perpindahan personel.</p>
                                    </div>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={!targetGroupId}
                                        className="h-16 px-10 bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Laksanakan Pemindahan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 p-10 space-y-8 italic">
                                <div className="p-10 bg-slate-50 rounded-3xl text-slate-900 border border-slate-100 shadow-inner">
                                    <ArrowRightLeft className="w-24 h-24" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold tracking-widest italic ">AWAITING_PERSONNEL_SELECT</h3>
                                    <p className="text-sm font-bold tracking-[0.2em] italic  uppercase">PILIH_MAHASISWA_DARI_LEDGER_UNTUK_PENUGASAN_UNIT_BARU</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
        </AppLayout>
    );
}
