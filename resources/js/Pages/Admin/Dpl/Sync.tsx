import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    RefreshCw, 
    Search, 
    UserPlus, 
    CheckCircle2, 
    AlertCircle,
    Info,
    CloudDownload,
    Database,
    Binary
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';

interface ExternalDosen {
    id: number;
    nip: string;
    name: string;
    email?: string;
    organization_id?: number;
    organization_name?: string;
    birth_date?: string;
    gender?: string;
}

interface Props {
    availableDosen: ExternalDosen[];
    filters: {
        search?: string;
    };
    title: string;
}

export default function DplSync({ availableDosen, filters, title }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { post, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.dpl.sinkronisasi-index'), { search }, { preserveState: true });
    };

    const syncDosen = (dosen: ExternalDosen) => {
        router.post(route('admin.dpl.sinkronisasi-eksekusi'), {
            master_id: dosen.id,
            nip: dosen.nip,
            name: dosen.name,
            email: dosen.email,
            organization_id: dosen.organization_id,
            birth_date: dosen.birth_date,
            gender: dosen.gender
        }, {
            preserveScroll: true
        });
    };

    return (
        <AppLayout title={title}>
            <Head title={title} />

            <div className="space-y-8 pb-20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                                <CloudDownload size={20} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">{title}</h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Sinkronisasi master dosen dari API Kampus (Pusat) ke database lokal KKN.</p>
                    </div>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sky-500 shrink-0">
                        <Info size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-sky-900 uppercase italic">Catatan Penting</h3>
                        <p className="text-xs text-sky-700 leading-relaxed">
                            Proses ini hanya menyinkronkan <strong>Identitas Dosen</strong> ke database lokal. Akun login dan penugasan DPL akan dibuat secara terpisah saat Anda mengaktifkan dosen tersebut pada periode KKN tertentu.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan NIP atau Nama Dosen di API Pusat..."
                            className="w-full h-16 bg-white border border-slate-200 rounded-2xl pl-16 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                        />
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableDosen.map((dosen) => (
                            <div key={dosen.nip} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                <div className="absolute -top-4 -right-4 p-8 opacity-[0.02] text-slate-900 group-hover:rotate-12 transition-transform">
                                    <Database size={100} />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{dosen.nip}</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-tight italic uppercase">{dosen.name}</h3>
                                        <p className="text-xs font-bold text-emerald-600">{dosen.organization_name || 'Unit Kerja Umum'}</p>
                                    </div>

                                    <button 
                                        onClick={() => syncDosen(dosen)}
                                        disabled={processing}
                                        className="w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={clsx(processing && "animate-spin")} />
                                        Sinkronkan Sekarang
                                    </button>
                                </div>
                            </div>
                        ))}

                        {availableDosen.length === 0 && (
                            <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 text-center">
                                <Binary className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">
                                    {search ? 'Tidak ditemukan dosen yang sesuai kriteria.' : 'Semua data dosen dari API Pusat sudah tersinkronisasi.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
