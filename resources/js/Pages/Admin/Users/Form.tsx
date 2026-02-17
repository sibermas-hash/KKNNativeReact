import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';
import type { PageProps, Faculty, Program } from '@/types';
import {
    UserPlusIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    KeyIcon,
    UserCircleIcon,
    ArrowUturnLeftIcon,
    FingerPrintIcon
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    faculties: Faculty[];
    programs: Program[];
}

export default function UserForm({ faculties, programs }: Props) {
    const form = useForm({
        username: '',
        name: '',
        email: '',
        password: '',
        role: '',
        nim: '',
        nip: '',
        faculty_id: '',
        program_id: '',
        batch_year: '',
        gender: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/users');
    }

    const isStudent = form.data.role === 'student';
    const isDpl = form.data.role === 'dpl';

    return (
        <AppLayout title="Identity Genesis Terminal">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">AUTHORITY INITIALIZATION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Identity <span className="text-accent-gold text-glow-gold">Genesis</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Provisioning new authority assets into the central registry.</p>
                    </div>

                    <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6">
                        <FingerPrintIcon className="h-6 w-6 text-accent-gold" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">SECURITY LEVEL</span>
                            <span className="text-xl font-black text-white mt-1 uppercase tracking-widest">ALPHA-7</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Core Credentials */}
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-white pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <KeyIcon className="h-64 w-64" />
                            </div>

                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-10 flex items-center gap-4">
                                <UserCircleIcon className="w-7 h-7 text-accent-gold" />
                                Core Credentials
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
                                <div className="md:col-span-2 max-w-sm">
                                    <FormSelect
                                        id="role" label="Authority Role Selection" required
                                        options={[
                                            { value: 'superadmin', label: 'SYSTEM ADMINISTRATOR' },
                                            { value: 'dpl', label: 'FIELD SUPERVISOR (DPL)' },
                                            { value: 'student', label: 'SCHOLAR PARTICIPANT' }
                                        ]}
                                        placeholder="SELECT ACCESS ROLE..."
                                        value={form.data.role}
                                        onChange={(e) => form.setData('role', e.target.value)}
                                        error={form.errors.role}
                                        className="bg-black/40 border-white/10 text-white text-[10px] font-black uppercase tracking-widest h-14 rounded-2xl"
                                    />
                                </div>

                                <FormInput id="username" label="System Username" placeholder="E.G. JDOE_ALPHA" value={form.data.username} onChange={(e) => form.setData('username', e.target.value)} error={form.errors.username} required className="bg-black/40 border-white/10 text-white text-xs font-bold tracking-widest h-14 rounded-2xl" />
                                <FormInput id="name" label="Legal Full Identity" placeholder="E.G. JOHN DOE, M.PD." value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} required className="bg-black/40 border-white/10 text-white text-xs font-bold tracking-widest h-14 rounded-2xl" />
                                <FormInput id="email" label="Verified Email Channel" type="email" placeholder="JOHN@ACADEMIA.EDU" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} required className="bg-black/40 border-white/10 text-white text-xs font-bold tracking-widest h-14 rounded-2xl" />
                                <FormInput id="password" label="Secure Access Cipher" type="password" placeholder="••••••••" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} required className="bg-black/40 border-white/10 text-white text-xs font-bold tracking-widest h-14 rounded-2xl" />
                            </div>
                        </div>

                        {/* Role-Specific Intel */}
                        {isStudent && (
                            <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent animate-in slide-in-from-bottom duration-500">
                                <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-8 border-b border-white/10 pb-6 flex items-center gap-3">
                                    <IdentificationIcon className="w-5 h-5 text-accent-gold" />
                                    Scholar Specification
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <FormInput id="nim" label="Scholar NIM" placeholder="20210001" value={form.data.nim} onChange={(e) => form.setData('nim', e.target.value)} error={form.errors.nim} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                    <FormSelect id="gender" label="Gender Vector" options={[{ value: 'L', label: 'STRENGTH (MALE)' }, { value: 'P', label: 'GRACE (FEMALE)' }]} placeholder="SELECT..." value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)} error={form.errors.gender} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                    <FormSelect id="faculty_id" label="Academic Sector" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="SELECT..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                    <FormSelect id="program_id" label="Scholastic Stream" options={programs.map(p => ({ value: p.id, label: p.name }))} placeholder="SELECT..." value={form.data.program_id} onChange={(e) => form.setData('program_id', e.target.value)} error={form.errors.program_id} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                    <FormInput id="batch_year" label="Enrollment Cohort" type="number" placeholder="2021" value={form.data.batch_year} onChange={(e) => form.setData('batch_year', e.target.value)} error={form.errors.batch_year} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                </div>
                            </div>
                        )}

                        {isDpl && (
                            <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-accent-gold/5 to-transparent animate-in slide-in-from-bottom duration-500">
                                <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-8 border-b border-white/10 pb-6 flex items-center gap-3">
                                    <AcademicCapIcon className="w-5 h-5 text-accent-gold" />
                                    Officer Specification
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <FormInput id="nip" label="Officer Identifier (NIP)" placeholder="19800101..." value={form.data.nip} onChange={(e) => form.setData('nip', e.target.value)} error={form.errors.nip} required className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                    <FormSelect id="faculty_id" label="Homebase Sector" options={faculties.map(f => ({ value: f.id, label: f.name }))} placeholder="SELECT..." value={form.data.faculty_id} onChange={(e) => form.setData('faculty_id', e.target.value)} error={form.errors.faculty_id} className="bg-black/40 border-white/10 text-white text-xs h-14 rounded-2xl" />
                                </div>
                            </div>
                        )}

                        {/* Action Control */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-10 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-10 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all flex items-center gap-3"
                            >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                ABORT GENESIS
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-16 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 flex items-center gap-3 disabled:opacity-50"
                            >
                                <UserPlusIcon className="w-5 h-5 text-accent-gold" />
                                COMMIT IDENTITY
                            </button>
                        </div>
                    </form>
                </div>

                {/* System Ledger Note */}
                <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group max-w-4xl mx-auto">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <ShieldCheckIcon className="h-24 w-24" />
                    </div>
                    <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        Genesis Protocol Compliance
                    </h4>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8">
                        IDENTITY PROVISIONING MUST ADHERE TO SECURE DATA STANDARDS. ALL CIPHERS ARE ENCRYPTED AT REST. AUDIT LOGS WILL RECORD THIS TRANSACTION PERMANENTLY.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

