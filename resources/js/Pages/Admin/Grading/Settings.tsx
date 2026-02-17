import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import {
    CpuChipIcon,
    ShieldCheckIcon,
    AdjustmentsHorizontalIcon,
    BeakerIcon,
    CubeTransparentIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Props {
    settings: {
        weight_main: number;
        weight_dpl: number;
        weight_village: number;
        weight_lppm: number;
    };
}

export default function GradingSettings({ settings }: Props) {
    const form = useForm({
        weight_main: settings.weight_main,
        weight_dpl: settings.weight_dpl,
        weight_village: settings.weight_village,
        weight_lppm: settings.weight_lppm,
    });

    const total = Number(form.data.weight_main) +
        Number(form.data.weight_dpl) +
        Number(form.data.weight_village) +
        Number(form.data.weight_lppm);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/grading-settings');
    }

    return (
        <AppLayout title="Merit Algorithm Forge">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">LOGIC CALIBRATION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Merit <span className="text-accent-gold text-glow-gold">Algorithm</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Fine-tuning the weighted vectors for scholar assessment.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={`px-8 py-5 glass rounded-[2rem] flex items-center gap-6 transition-colors duration-500 ${total === 100 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                            <CpuChipIcon className={`h-6 w-6 ${total === 100 ? 'text-emerald-500' : 'text-rose-500'}`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">TOTAL WEIGHT</span>
                                <span className={`text-xl font-black mt-1 tabular-nums ${total === 100 ? 'text-white' : 'text-rose-500'}`}>{total}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Calibration Panel */}
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-white pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <AdjustmentsHorizontalIcon className="h-64 w-64" />
                            </div>

                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-10 flex items-center gap-4">
                                <BeakerIcon className="w-7 h-7 text-accent-gold" />
                                Vector Calibration
                            </h3>

                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormInput
                                        id="weight_main" label="Core Academic Weight (%)" type="number"
                                        value={form.data.weight_main} onChange={(e) => form.setData('weight_main', Number(e.target.value))}
                                        error={form.errors.weight_main} required
                                        className="bg-black/40 border-white/10 text-white text-base font-black h-16 rounded-2xl p-6"
                                    />
                                    <FormInput
                                        id="weight_dpl" label="Field Supervisor Weight (%)" type="number"
                                        value={form.data.weight_dpl} onChange={(e) => form.setData('weight_dpl', Number(e.target.value))}
                                        error={form.errors.weight_dpl} required
                                        className="bg-black/40 border-white/10 text-white text-base font-black h-16 rounded-2xl p-6"
                                    />
                                    <FormInput
                                        id="weight_village" label="Regional Authority Weight (%)" type="number"
                                        value={form.data.weight_village} onChange={(e) => form.setData('weight_village', Number(e.target.value))}
                                        error={form.errors.weight_village} required
                                        className="bg-black/40 border-white/10 text-white text-base font-black h-16 rounded-2xl p-6"
                                    />
                                    <FormInput
                                        id="weight_lppm" label="Institutional Oversight Weight (%)" type="number"
                                        value={form.data.weight_lppm} onChange={(e) => form.setData('weight_lppm', Number(e.target.value))}
                                        error={form.errors.weight_lppm} required
                                        className="bg-black/40 border-white/10 text-white text-base font-black h-16 rounded-2xl p-6"
                                    />
                                </div>

                                {total !== 100 && (
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-rose-500 shrink-0" />
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-loose">
                                            ALGORITHM CRITICAL ERROR: TOTAL WEIGHT VECTOR MUST EQUAL EXACTLY 100%. CURRENT DEVIATION DETECTED.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing || total !== 100}
                                className="px-16 py-6 bg-primary text-white text-xs font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 flex items-center gap-4 disabled:opacity-30 disabled:grayscale"
                            >
                                <CheckBadgeIcon className="w-6 h-6 text-accent-gold" />
                                COMMIT ALGORITHM
                            </button>
                        </div>
                    </form>

                    {/* Operational Docs */}
                    <div className="space-y-10">
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                            <div className="absolute -top-10 -right-10 p-10 opacity-10 text-primary-light">
                                <AcademicCapIcon className="w-48 h-48" />
                            </div>

                            <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-10 border-b border-white/10 pb-6 flex items-center gap-3">
                                <CubeTransparentIcon className="w-5 h-5 text-accent-gold" />
                                Assessment Logic Hub
                            </h3>

                            <div className="space-y-10 relative z-10">
                                <LogicNote title="Core Academic" desc="System-generated metrics from digital presence and submission timelines." />
                                <LogicNote title="Field Supervisor" desc="Qualitative assessment from designated command officers on-site." />
                                <LogicNote title="Regional Authority" desc="Impact factor based on village-level integration and leadership." />
                                <LogicNote title="Institutional Oversight" desc="Final audit and strategic alignment by LPPM directorate." />
                            </div>
                        </div>

                        <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <ShieldCheckIcon className="h-24 w-24" />
                            </div>
                            <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                                <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                                Security Protocol
                            </h4>
                            <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8">
                                CHANGES TO THE MERIT ALGORITHM WILL RETROACTIVELY IMPACT ALL NON-FINALIZED GRADE CALCULATIONS. COMMIT WITH EXTREME CAUTION.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function LogicNote({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="group/note">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 group-hover/note:text-accent-gold transition-colors">{title}</h4>
            <p className="text-sm font-bold text-white/60 uppercase tracking-widest leading-relaxed border-l border-white/10 pl-6 group-hover/note:border-primary transition-all italic">{desc}</p>
        </div>
    );
}
