import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    Users,
    Search,
    RefreshCw,
    ArrowRightLeft,
    MapPin,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Student {
    id: number;
    mahasiswa: {
        nim: string;
        nama: string;
        user: { name: string };
    };
    user?: { name?: string };
    kelompok?: {
        id: number;
        nama_kelompok: string;
        code: string;
        location?: {
            district_name: string;
            village_name: string | null;
            regency_name: string;
        };
    };
    status: string;
}

interface TargetGroup {
    id: number;
    nama: string;
    capacity: number | null;
    current_count: number;
    available: number | null;
}

interface Props {
    students: {
        data: Student[];
        meta: PaginationMeta;
    };
    targetPeriods: Array<{ id: number; name: string; periode: number; jenis: string; kuota: number }>;
    filters: { search?: string };
}

export default function StudentTransfer({ students, targetPeriods, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');
    const [targetPeriodId, setTargetPeriodId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [groups, setGroups] = useState<TargetGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.peserta.pindah.index'), { search }, { preserveState: true });
    };

    const fetchGroups = async (periodId: string) => {
        if (!periodId) {
            setGroups([]);
            return;
        }

        setIsLoadingGroups(true);
        try {
            const response = await fetch(route('admin.api.transfer-targets', { target_period_id: periodId }));
            
            if (!response.ok) {
                throw new Error('Failed to fetch transfer targets');
            }

            const data = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleTransfer = () => {
        if (!selectedStudent || !targetPeriodId || !reason.trim()) return;

        if (confirm(`Apakah Anda yakin ingin memindahkan ${selectedStudent.mahasiswa.nama} ke periode/kelompok baru?`)) {
            router.post(route('admin.peserta.pindah'), {
                peserta_kkn_id: selectedStudent.id,
                target_period_id: targetPeriodId,
                target_group_id: targetGroupId || null,
                reason: reason,
            }, {
                onSuccess: () => {
                    setSelectedStudent(null);
                    setTargetGroupId('');
                    setTargetPeriodId('');
                    setReason('');
                }
            });
        }
    };

    const getStudentName = (student: Student) => student.mahasiswa.nama || student.mahasiswa.user.name;
    const getStudentNim = (student: Student) => student.mahasiswa.nim;
    const getGroupName = (student: Student) => student.kelompok?.nama_kelompok || student.kelompok?.code;
    const getLocationLabel = (student: Student) => {
        const loc = student.kelompok?.location;
        if (!loc) return null;
        return loc.village_name ? `${loc.village_name}, ${loc.district_name}` : loc.district_name;
    };

    return (
        <AppLayout title="Transfer Peserta">
            <Head title="Transfer Peserta" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transfer Peserta KKN</h1>
                        <p className="text-sm text-slate-500 mt-1">Pindahkan peserta antar periode atau kelompok secara resmi.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Daftar Peserta */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Cari Peserta</h3>

                            <form onSubmit={handleSearch} className="mb-4 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Nama atau NIM..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </form>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {students.data.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl border text-left transition-all",
                                            selectedStudent?.id === student.id 
                                                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10" 
                                                : "bg-white border-slate-100 hover:bg-slate-50"
                                        )}
                                    >
                                        <p className={clsx(
                                            "text-sm font-bold truncate",
                                            selectedStudent?.id === student.id ? "text-emerald-700" : "text-slate-900"
                                        )}>{getStudentName(student)}</p>
                                        <p className={clsx("text-xs font-semibold mt-0.5", selectedStudent?.id === student.id ? "text-emerald-600" : "text-slate-400")}>{getStudentNim(student)}</p>
                                        {getGroupName(student) && (
                                            <p className={clsx("text-[11px] mt-1.5 flex items-center gap-1.5", selectedStudent?.id === student.id ? "text-emerald-600" : "text-slate-400")}>
                                                <MapPin className="w-3 h-3" />
                                                {getGroupName(student)}
                                            </p>
                                        )}
                                    </button>
                                ))}

                                {students.data.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Tidak ada data peserta.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <Pagination meta={students.meta} />
                            </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-amber-800">Perhatian</h4>
                                <p className="text-xs text-amber-600 mt-1">
                                    Transfer peserta akan tercatat dalam audit trail dan tidak dapat dibatalkan secara otomatis.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Transfer */}
                    <div className="xl:col-span-8">
                        {selectedStudent ? (
                            <div className="bg-white rounded-lg border border-slate-200">
                                <div className="p-6 space-y-6">
                                    {/* Info Peserta */}
                                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-16 h-16 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                                            {(selectedStudent.mahasiswa?.nama || selectedStudent.mahasiswa?.user?.name || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">{getStudentName(selectedStudent)}</p>
                                            <p className="text-sm font-medium text-slate-500">NIM: {getStudentNim(selectedStudent)}</p>
                                        </div>
                                        {getGroupName(selectedStudent) && (
                                            <div className="text-right">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kelompok Saat Ini</p>
                                                <p className="text-sm font-bold text-slate-900">{getGroupName(selectedStudent)}</p>
                                                {getLocationLabel(selectedStudent) && (
                                                    <p className="text-xs text-slate-400">{getLocationLabel(selectedStudent)}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Transfer Config */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Periode Tujuan <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={targetPeriodId}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    setTargetPeriodId(id);
                                                    setTargetGroupId('');
                                                    fetchGroups(id);
                                                }}
                                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            >
                                                <option value="">Pilih Periode</option>
                                                {targetPeriods.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Kelompok Tujuan <span className="text-slate-400 font-normal normal-case">(Opsional)</span>
                                            </label>
                                            <select
                                                value={targetGroupId}
                                                onChange={(e) => setTargetGroupId(e.target.value)}
                                                disabled={!targetPeriodId || isLoadingGroups}
                                                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                                            >
                                                <option value="">{isLoadingGroups ? 'Memuat Kelompok...' : 'Pilih Kelompok'}</option>
                                                {groups
                                                    .filter(g => g.id !== selectedStudent.kelompok?.id)
                                                    .map(g => (
                                                        <option key={g.id} value={g.id.toString()}>
                                                            {g.nama}{g.available != null ? ` (Sisa Kuota: ${g.available})` : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Alasan */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Alasan Transfer <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Tuliskan alasan pemindahan peserta..."
                                            rows={4}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                </div>


                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <button
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setTargetGroupId('');
                                            setTargetPeriodId('');
                                            setReason('');
                                        }}
                                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={!targetPeriodId || !reason.trim()}
                                        className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Simpan Transfer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-slate-200 p-12">
                                <ArrowRightLeft className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="text-base font-medium text-slate-600">Pilih peserta untuk transfer</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Pilih mahasiswa dari daftar di sebelah kiri untuk memulai.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
