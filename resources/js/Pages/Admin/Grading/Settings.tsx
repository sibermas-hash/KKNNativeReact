import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Save, 
    RefreshCw, 
    Info,
    BarChart3,
    ShieldCheck,
    CheckCircle2,
    Zap,
    Binary,
    LayoutGrid,
    ChevronRight,
    Target
} from 'lucide-react';
import { clsx } from 'clsx';

interface GradingItem {
    id: number;
    config_key: string;
    label: string;
    percentage: number;
    description: string;
}

interface Section {
    group: string;
    title: string;
    description: string;
    enforce_total: boolean;
    total: number;
    items: GradingItem[];
}

interface Props {
    sections: Section[];
    programOptions: Array<{ value: string; label: string }>;
    filters: {
        kkn_type: string;
    };
}

export default function GradingSettings({ sections, programOptions, filters }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        configs: sections.flatMap(s => s.items).map(item => ({
            id: item.id,
            percentage: item.percentage
        }))
    });

    const handleTypeChange = (type: string) => {
        router.get(route('admin.konfigurasi-penilaian.index'), { kkn_type: type }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const updatePercentage = (id: number, value: string) => {
        const numValue = parseFloat(value) || 0;
        setData('configs', data.configs.map(c => 
            c.id === id ? { ...c, percentage: numValue } : c
        ));
    };

    const getGroupTotal = (group: string) => {
        const groupItems = sections.find(s => s.group === group)?.items || [];
        const itemIds = groupItems.map(i => i.id);
        return data.configs
            .filter(c => itemIds.includes(c.id))
            .reduce((sum, c) => sum + c.percentage, 0);
    };

    const isGroupValid = (group: string) => {
        const section = sections.find(s => s.group === group);
        if (!section || !section.enforce_total) return true;
        return Math.abs(getGroupTotal(group) - 100) < 0.01;
    };

    const allGroupsValid = sections.every(s => isGroupValid(s.group));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!allGroupsValid) {
            alert('PERHATIAN: Seluruh kelompok bobot wajib berjumlah tepat 100%!');
            return;
        }
        post(route('admin.konfigurasi-penilaian.update'));
    };

    return (
        <AppLayout title="Otoritas Parameter Penilaian">
            <Head title="Aturan Penilaian | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950">
                {/* HEADER TACTICAL */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Assessment Matrix Control Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            ATURAN <span className="text-emerald-500">BOBOT NILAI</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <BarChart3 size={12} className="text-emerald-500" />
                             Manajemen parameter penilaian akademik per skema KKN terintegrasi.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">PILIH SKEMA PROGRAM</span>
                            <select 
                                value={filters.kkn_type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="h-14 px-8 bg-emerald-950 text-emerald-400 font-black text-[11px] uppercase tracking-widest italic border-none focus:ring-0 shadow-2xl cursor-pointer"
                            >
                                {programOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    <div className="bg-emerald-950 p-10 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="h-14 w-14 bg-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse rotate-3 shrink-0">
                                <Target size={28} className="text-white" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-emerald-400 uppercase italic tracking-widest leading-none">Protokol Evaluasi Skema: {filters.kkn_type}</h3>
                                <p className="text-[10px] text-emerald-100/60 leading-relaxed uppercase font-bold tracking-widest mt-2 max-w-4xl">
                                    PENGATURAN BOBOT INI HANYA BERLAKU UNTUK JENIS <strong className="text-emerald-400">{filters.kkn_type}</strong>. 
                                    PASTIKAN SETIAP KELOMPOK PENILAIAN MEMILIKI AKUMULASI <strong className="text-emerald-400">TEPAT 100%</strong> UNTUK MENJAGA INTEGRITAS KALKULASI.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            {sections.map((section) => {
                                const groupTotal = getGroupTotal(section.group);
                                const isValid = isGroupValid(section.group);

                                return (
                                    <div key={section.group} className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all flex flex-col">
                                        <div className="px-8 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                                    <LayoutGrid size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">{section.title}</h3>
                                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">{section.description}</p>
                                                </div>
                                            </div>
                                            <div className={clsx(
                                                "px-4 py-2 text-[10px] font-black italic tracking-widest border shadow-inner",
                                                isValid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                                            )}>
                                                {groupTotal}% / 100%
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <tbody className="divide-y divide-emerald-50">
                                                    {section.items.map((item) => (
                                                        <tr key={item.id} className="group/row hover:bg-emerald-50/20 transition-colors">
                                                            <td className="px-8 py-6">
                                                                <div className="space-y-1">
                                                                    <p className="text-[12px] font-black text-emerald-950 uppercase italic tracking-widest group-hover/row:text-emerald-600 transition-colors">{item.label}</p>
                                                                    <p className="text-[8px] text-emerald-200 font-bold uppercase tracking-widest italic leading-relaxed">{item.description}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 w-40">
                                                                <div className="relative">
                                                                    <input 
                                                                        type="number" 
                                                                        step="0.01"
                                                                        value={data.configs.find(c => c.id === item.id)?.percentage || 0}
                                                                        onChange={e => updatePercentage(item.id, e.target.value)}
                                                                        className="w-full h-12 bg-emerald-50/50 border border-emerald-50 px-4 text-center font-black text-emerald-950 text-base italic focus:bg-white focus:border-emerald-500 transition-all outline-none tabular-nums"
                                                                    />
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none font-black text-[10px] text-emerald-950 italic">%</div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-12 border-t border-emerald-50">
                            <div className="flex items-center gap-4 px-10 py-4 bg-emerald-50/10 border border-emerald-50 text-emerald-300 italic shadow-inner">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                    {allGroupsValid ? 'Seluruh Parameter Valid (100%)' : 'Ada Ketidakseimbangan Bobot'}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !allGroupsValid}
                                className={clsx(
                                    "h-20 px-16 rounded-none font-black text-[12px] uppercase tracking-[0.4em] italic shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group",
                                    recentlySuccessful ? "bg-emerald-500 text-white" : "bg-emerald-950 text-white hover:bg-emerald-600"
                                )}
                            >
                                {processing ? (
                                    <RefreshCw className="animate-spin" size={20} />
                                ) : recentlySuccessful ? (
                                    <CheckCircle2 size={20} />
                                ) : (
                                    <Save size={20} />
                                )}
                                {recentlySuccessful ? 'DATA TERSIMPAN' : 'FINALISASI SEMUA BOBOT'}
                                <Zap size={16} className={clsx("group-hover:animate-pulse", recentlySuccessful ? "hidden" : "block")} />
                            </button>
                        </div>
                    </form>

                    {/* SECURITY FOOTER */}
                    <div className="bg-emerald-950 p-12 flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
                        <div className="flex items-center gap-8 relative z-10">
                            <Binary size={40} className="text-emerald-500/20 animate-pulse" />
                            <div>
                                <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase leading-none mb-3">INTEGRITAS AKADEMIK</h4>
                                <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.3em] italic leading-relaxed max-w-4xl">
                                    SISTEM AKAN MENGGUNAKAN BOBOT INI UNTUK GENERATOR NILAI OTOMATIS PADA SELURUH MAHASISWA YANG TERDAFTAR DALAM SKEMA TERPILIH.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
