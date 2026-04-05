import { useState } from 'react';
import { useForm, router, Link, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    CloudDownload,
    UserPlus,
    Search,
    RefreshCw,
    Cpu,
    Fingerprint,
    ShieldCheck,
    Terminal,
    ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AvailableStudent {
    id?: number | null;
    nim: string;
    name: string;
    email: string | null;
}

interface Props {
    availableStudents: AvailableStudent[];
    filters: {
        search?: string;
    };
}

export default function StudentSync({ availableStudents, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { processing } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.mahasiswa.sinkron'), { search }, { preserveState: true });
    };

    const handleSync = (student: AvailableStudent) => {
        router.post(route('admin.mahasiswa.sinkron.store'), {
            master_id: student.id,
            nim: student.nim,
            name: student.name,
            email: student.email,
        });
    };

    return (
        <AppLayout title="Protokol Sinkronisasi">
            <Head title="Integrasi Data Mahasiswa" />
            
            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrasi Data Mahasiswa</h1>
                        <p className="text-sm text-slate-500 mt-1">Injeksi relasi data mahasiswa dari kanal feeder eksternal.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative group flex-1 w-full max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Cari Identitas (NIM / Nama)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10 italic"
                        />
                    </div>
                    <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 shadow-sm flex items-center gap-3">
                        <CloudDownload className="w-4 h-4" />
                        {availableStudents.length} Data Terdeteksi
                    </div>
                </form>

                {/* Main Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Identitas Feeder</th>
                                    <th className="px-8 py-6 text-right text-xs font-bold text-slate-500 uppercase tracking-widest pr-12">Inisialisasi_Aksesi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic">
                                {availableStudents.map((student) => (
                                    <tr key={student.nim} className="group/row hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-base font-black flex items-center justify-center italic shadow-sm group-hover/row:scale-110 transition-transform">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-emerald-900 uppercase tracking-tighter truncate max-w-[450px] group-hover/row:text-emerald-600 transition-colors  mb-1.5">{student.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NIM: {student.nim}</span>
                                                         <span className="text-xs font-bold text-slate-300 lowercase">[{student.email || 'TANPA_SALURAN_SUREL'}]</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right pr-12">
                                            <button
                                                onClick={() => handleSync(student)}
                                                disabled={processing}
                                                className="group/btn h-12 px-8 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-black uppercase italic tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 ml-auto"
                                            >
                                                <UserPlus className="w-4 h-4 text-emerald-400 group-hover/btn:text-white transition-colors" />
                                                 Impor_Data
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {availableStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-8 py-32 text-center italic font-bold">
                                             <CloudDownload className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                             <span className="text-xs uppercase tracking-[0.4em]">DATA_TIDAK_TERDETEKSI</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info Section */}
                <div className="p-8 bg-emerald-50 rounded-xl border border-emerald-100 text-slate-900 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 text-center xl:text-left">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 justify-center xl:justify-start">
                                <div className="p-2.5 bg-emerald-600 rounded-xl border border-emerald-500 shadow-lg shadow-emerald-600/20">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="text-sm font-black text-emerald-900 italic tracking-widest uppercase ">Akuisisi_Identitas_V3.2</h4>
                            </div>
                            <p className="text-sm text-slate-600 font-bold  max-w-4xl italic uppercase">
                                Protokol Sinkronisasi: Data yang diinjeksi akan melewati validasi integritas repositori mahasiswa. Unit pendaftaran lokal akan otomatis terhubung dengan profil feeder.
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center xl:justify-end">
                            <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-600/20 text-xs font-bold">
                                SALURAN_SINKRON_AMAN
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
