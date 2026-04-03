import { router, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, type FormEventHandler, type ChangeEvent } from 'react';
import type { PageProps } from '@/types';
import {
    ClipboardCheck,
    MapPin,
    Info,
    CheckCircle2,
    Calendar,
    ShieldCheck,
    Zap,
    ArrowRight,
    RotateCw,
    GraduationCap,
    BookOpen,
    FilePlus,
    XCircle,
    CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SlotRule {
  id: number;
  tipe_slot: 'fakultas' | 'prodi';
  label: string;
  kuota_slot: number;
}

interface Group {
  id: number;
  nama_kelompok: string;
  capacity: number;
  peserta_count: number;
  remaining_seats: number;
  male_member_count: number;
  female_member_count: number;
  male_min_required: number;
  male_target_maximum: number;
  male_min_percentage: number;
  male_target_percentage: number;
  requires_more_male_members: boolean;
  male_target_reached: boolean;
  male_target_exceeded: boolean;
  reserved_male_slots: number;
  slot_terkunci: SlotRule[];
  lokasi?: {
    village_name: string;
    full_name?: string;
  };
}

interface PeriodRegistration {
  id: number;
  status: string;
  notes?: string | null;
  kelompok_id?: number | null;
  joined_group_at?: string | null;
  group_locked_until?: string | null;
  group?: {
    id: number;
    name: string;
    location?: {
      id: number;
      name: string;
    } | null;
  } | null;
  queue: {
    status: string;
    penalti_poin: number;
    pindah_count: number;
    max_group_moves: number;
  };
}

interface PeriodOption {
  id: number;
  nama: string;
  registration_start: string;
  registration_end: string;
  kelompok: Group[];
  registration?: PeriodRegistration | null;
}

interface RegisterProps extends PageProps {
  periods: PeriodOption[];
  student_gender?: 'L' | 'P' | null;
  student_academic?: {
    sks_completed: number;
    is_bta_ppi_passed: boolean;
    has_health_certificate: boolean;
    min_sks: number;
  } | null;
}

export default function Register({ periods, student_gender, student_academic }: RegisterProps) {
  const [certName, setCertName] = useState<string | null>(null);
  
  const { data, setData, post, processing, errors } = useForm({
    period_id: '',
    kelompok_id: '',
    health_certificate: null as File | null,
    notes: '',
  });

  const selectedPeriod = periods.find(p => p.id === Number(data.period_id));
  const currentRegistration = selectedPeriod?.registration ?? null;
  const selectedGroupId = data.kelompok_id ? Number(data.kelompok_id) : null;
  const submitLabel = currentRegistration ? 'PERBARUI PENDAFTARAN' : 'KONFIRMASI PENDAFTARAN';

  const isAcademicQualified = (student_academic?.sks_completed ?? 0) >= (student_academic?.min_sks ?? 100) && student_academic?.is_bta_ppi_passed;
  const requirementsMet = isAcademicQualified && (student_academic?.has_health_certificate || data.health_certificate);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/student/register', {
        forceFormData: true,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData('health_certificate', file);
    setCertName(file?.name ?? null);
  };

  const handlePeriodChange = (periodId: string) => {
    const nextPeriod = periods.find(period => period.id === Number(periodId));
    setData({
      ...data,
      period_id: periodId,
      kelompok_id: nextPeriod?.registration?.kelompok_id ? String(nextPeriod.registration.kelompok_id) : '',
      notes: nextPeriod?.registration?.notes ?? '',
    });
  };

  const leaveGroup = () => {
    if (!selectedPeriod?.registration || !confirm('Apakah Anda yakin ingin keluar dari kelompok ini? Penalti poin mungkin berlaku.')) return;
    router.delete(`/student/register/${selectedPeriod.id}/group`, { preserveScroll: true });
  };

  return (
    <AppLayout title="Pendaftaran KKN">
      <Head title="Pusat Pendaftaran Mahasiswa" />
      
      <div className="max-w-5xl mx-auto space-y-12 pb-24">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase  leading-none italic">Sistem Plotting Mandiri Mahasiswa</span>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                    Pusat <span className="text-primary italic">Pendaftaran</span> KKN
                </h1>
                <p className="text-slate-500 text-sm font-medium italic opacity-70 leading-relaxed max-w-xl">
                    Verifikasi persyaratan akademik dan tentukan lokasi pengabdian Anda secara mandiri.
                </p>
            </div>
            
            <div className="bg-white border border-slate-100 p-5 rounded-lg flex items-center gap-5 min-w-[220px]">
                <div className="p-3 bg-slate-900 rounded-lg text-primary
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase  block mb-1 italic">Status Akademik</span>
                    <span className={clsx("text-xs font-black uppercase  italic", isAcademicQualified ? "text-emerald-600" : "text-rose-500")}>
                        {isAcademicQualified ? 'Memenuhi Syarat' : 'Belum Memenuhi'}
                    </span>
                </div>
            </div>
        </div>

        <form onSubmit={submit} className="space-y-12">
            {/* Academic Checklist Card */}
            <section className="bg-white rounded-lg border border-slate-100 p-10">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase  italic text-slate-900 leading-none">Verifikasi Prasyarat Akademik</h3>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic opacity-60">SOP UIN SAIZU Compliance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <AcademicItem 
                        icon={BookOpen} 
                        label="Kredit Semester" 
                        value={`${student_academic?.sks_completed ?? 0} / ${student_academic?.min_sks ?? 100} SKS`}
                        isSuccess={(student_academic?.sks_completed ?? 0) >= (student_academic?.min_sks ?? 100)}
                    />
                    <AcademicItem 
                        icon={Zap} 
                        label="Kelulusan BTA-PPI" 
                        value={student_academic?.is_bta_ppi_passed ? 'LULUS' : 'BELUM LULUS'}
                        isSuccess={!!student_academic?.is_bta_ppi_passed}
                    />
                    <div className="md:col-span-1">
                        <div className={clsx(
                            "p-6rounded-lg border transition-all h-full flex flex-col justify-between italic",
                            student_academic?.has_health_certificate ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100"
                        )}>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase  mb-2 italic">Surat Keterangan Sehat</p>
                                <div className="flex items-center gap-3">
                                    {student_academic?.has_health_certificate ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-400" />
                                    )}
                                    <p className="text-sm font-black text-slate-900 uppercase italic">
                                        {student_academic?.has_health_certificate ? 'Terverifikasi' : 'Belum Diunggah'}
                                    </p>
                                </div>
                            </div>
                            
                            {!student_academic?.has_health_certificate && (
                                <div className="mt-4 relative overflow-hidden group/file">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2 group-hover/file:border-primary transition-all">
                                        <FilePlus className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[9px] font-black uppercase  truncate max-w-[100px]">
                                            {certName || 'Unggah PDF'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Period Selection Card */}
            <section className={clsx(
                "bg-white rounded-lg border border-slate-100 p-10 group overflow-hidden relative transition-opacity",
                !isAcademicQualified && "opacity-50 pointer-events-none"
            )}>
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform[2000ms]">
                    <Calendar className="h-64 w-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase  italic text-slate-900 leading-none">Tentukan Periode</h3>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic">Pilih masa pengabdian aktif</p>
                            </div>
                        </div>
                        <select
                            id="period_id"
                            value={data.period_id}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="block w-full rounded-lg border-slate-100 bg-slate-50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all py-5 px-8 text-slate-700 font-bold italic outline-none cursor-pointer"
                        >
                            <option value="">Pilih Periode KKN...</option>
                            {periods.map((period) => (
                                <option key={period.id} value={period.id}>{period.nama}</option>
                            ))}
                        </select>
                        {errors.period_id && <p className="text-[10px] text-rose-500 font-black uppercase  italic ml-2">{errors.period_id}</p>}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-8 space-y-4 relative group-hover:bg-slate-900 transition-colors overflow-hidden">
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-slate-800 group-hover:border-slate-700 transition-colors">
                                <Info className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase  mb-1 italic group-hover:text-slate-500">Status Sistem</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic group-hover:text-white">
                                    {periods.length > 0 ? 'Pendaftaran Tersedia' : 'Pendaftaran Ditutup'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Registration Summary & Actions */}
            {selectedPeriod && currentRegistration && (
                <section className="bg-white rounded-lg border border-slate-100 p-10 relative overflow-hidden group italic">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-primary pointer-events-none group-hover:rotate-12 transition-transform">
                        <ShieldCheck className="h-64 w-64" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10 italic">
                        <div className="space-y-6 flex-1 italic">
                            <div className="flex items-center gap-3 italic">
                                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 italic">
                                    <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase  italic leading-none">Transmisi Data Berhasil</h3>
                            </div>
                            <div className="italic">
                                <h4 className="text-3xl font-black text-slate-900 italic uppercase  leading-none mb-3">
                                    {currentRegistration.group ? currentRegistration.group.name : 'Belum Memilih Lokasi'}
                                </h4>
                                <p className="text-slate-400 font-black text-sm uppercase italic  leading-none">
                                    {currentRegistration.group?.location?.name || 'Status: Dalam Antrian Plotting'}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-5 italic">
                                <MetricBadge label="Status" value={currentRegistration.queue.status} light />
                                <MetricBadge label="Pindah" value={`${currentRegistration.queue.pindah_count} / ${currentRegistration.queue.max_group_moves}`} light />
                                <MetricBadge label="Penalty" value={currentRegistration.queue.penalti_poin} light />
                            </div>
                        </div>

                        {currentRegistration.group && (
                            <button
                                type="button"
                                onClick={leaveGroup}
                                className="h-16 px-10 rounded-lg bg-slate-50 border border-slate-100 text-rose-500 font-black text-[10px] uppercase  hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all active:scale-95 italic
                            >
                                Keluar dari Kelompok
                            </button>
                        )}
                    </div>
                </section>
            )}

            {/* Group Selection Matrix */}
            {selectedPeriod && requirementsMet && (
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic  leading-none">
                                Pilih <span className="text-primary italic">Kelompok</span> & Lokasi
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase  italic opacity-70">Klik pada kartu kelompok untuk memilih tujuan Anda.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-lg border border-emerald-100">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase  italic leading-none">Sinkronisasi Kuota Aktif</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {selectedPeriod.kelompok.map((group) => {
                            const isFull = group.peserta_count >= group.capacity;
                            const blockedByMaleMinimum = student_gender !== 'L'
                                && group.requires_more_male_members
                                && group.remaining_seats <= group.reserved_male_slots;
                            const isSelected = selectedGroupId === group.id;
                            const isUnavailable = (isFull || blockedByMaleMinimum) && !isSelected;

                            return (
                                <div
                                    key={group.id}
                                    onClick={() => !isUnavailable && setData('kelompok_id', String(group.id))}
                                    className={clsx(
                                        "relative group/card cursor-pointer rounded-lg p-8 border-2 transition-all flex flex-col h-full space-y-6 overflow-hidden",
                                        isSelected 
                                            ? "border-primary bg-primary/5 scale-[1.03] 
                                            : "border-slate-100 bg-white hover:border-primary/30 hover:shadow-xl",
                                        isUnavailable && "opacity-50 grayscale cursor-not-allowed border-dashed"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-slate-900 pointer-events-none group-hover/card:scale-125 transition-transform">
                                        <MapPin className="h-32 w-32" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={clsx(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all italic font-black",
                                                isSelected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover/card:bg-primary/10 group-hover/card:text-primary"
                                            )}>
                                                {group.nama_kelompok.charAt(0)}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase  italic leading-none">ID: #{group.id.toString().padStart(3, '0')}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900  leading-tight uppercase italic mb-2">
                                            {group.nama_kelompok}
                                        </h4>
                                        <div className="flex items-start gap-2 text-slate-400">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                                            <p className="text-[10px] font-bold uppercase  italic line-clamp-2 leading-relaxed">
                                                {group.lokasi?.full_name || group.lokasi?.village_name || 'Lokasi Belum Terverifikasi'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase  italic leading-none">
                                                <span className={isUnavailable ? 'text-rose-500' : 'text-slate-400'}>Kapasitas Unit</span>
                                                <span className={isUnavailable ? 'text-rose-500' : 'text-primary'}>
                                                    {group.peserta_count} / {group.capacity}
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-black/5">
                                                <div
                                                    className={clsx("h-full transition-all", isUnavailable ? 'bg-rose-500' : 'bg-primary')}
                                                    style={{ width: `${(group.peserta_count / group.capacity) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4 border-t border-slate-50">
                                            <CompositionMetric label="Sisa Quota" value={group.remaining_seats} color={isUnavailable ? 'text-rose-500' : 'text-slate-900'} />
                                            <CompositionMetric label="Gender L/P" value={`${group.male_member_count} / ${group.female_member_count}`} />
                                            {group.requires_more_male_members && (
                                                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                    <p className="text-[8px] font-black text-amber-700 uppercase  leading-relaxed italic">
                                                        Prioritas Laki-laki Aktif (+{group.reserved_male_slots} Slot)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {group.slot_terkunci.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {group.slot_terkunci.map((slot) => (
                                                    <span key={slot.id} className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase  italic">
                                                        {slot.label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-4 right-4 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white zoom-in">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notes Section */}
            {selectedPeriod && requirementsMet && (
                <section className="bg-white rounded-lg border border-slate-100 p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-400 italic font-black
                            <ArrowRight className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase  italic text-slate-900 leading-none">Keterangan Opsional</h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic">Informasi kesehatan atau keahlian khusus</p>
                        </div>
                    </div>
                    <textarea
                        id="notes"
                        placeholder="Sebutkan riwayat kesehatan, keahlian khusus, atau kebutuhan peralatan jika ada..."
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={4}
                        className="block w-fullrounded-lg border-slate-100 bg-slate-50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all p-8 text-slate-700 font-bold italic outline-none placeholder:text-slate-300"
                    />
                </section>
            )}

            {/* Submission Logic */}
            <div className="flex flex-col items-center gap-8 pt-6">
                <button
                    type="submit"
                    disabled={processing || periods.length === 0 || !data.period_id || !requirementsMet}
                    className={clsx(
                        "w-full h-24 rounded-lg text-xl font-black uppercase  transition-all italic active:scale-95 group",
                        processing || periods.length === 0 || !data.period_id || !requirementsMet
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "bg-slate-900 text-white hover:bg-black hover:scale-[1.01]
                    )}
                >
                    <div className="flex items-center justify-center gap-4">
                        {processing ? <RotateCw className="h-8 w-8 animate-spin text-primary" /> : <Zap className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />}
                        {submitLabel}
                    </div>
                </button>
                <div className="flex items-center gap-4 opacity-30 group">
                    <div className="h-px w-10 bg-slate-400 group-hover:w-20 transition-all" />
                    <p className="text-[10px] font-black text-slate-400 uppercase  italic">Data Validasi Akademik Terintegrasi</p>
                    <div className="h-px w-10 bg-slate-400 group-hover:w-20 transition-all" />
                </div>
            </div>
        </form>

        <footer className="text-center pt-8 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-300 uppercase  italic">
                Pusat Penempatan KKN UIN SAIZU © 2024
            </p>
        </footer>
      </div>
    </AppLayout>
  );
}

function AcademicItem({ icon: Icon, label, value, isSuccess }: { icon: any; label: string; value: string; isSuccess: boolean }) {
    return (
        <div className={clsx(
            "p-6rounded-lg border transition-all italic",
            isSuccess ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={clsx("p-2.5 rounded-xl border", isSuccess ? "bg-white text-emerald-500 border-emerald-100" : "bg-white text-rose-500 border-rose-100")}>
                    <Icon className="w-5 h-5" />
                </div>
                {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase  mb-1 italic">{label}</p>
            <p className="text-sm font-black text-slate-900 uppercase italic leading-none">{value}</p>
        </div>
    );
}

function MetricBadge({ label, value, light }: { label: string; value: string | number; light?: boolean }) {
    return (
        <div className={clsx(
            "flex items-center gap-3 px-5 py-2.5 rounded-lg border transition-colors italic
            light 
                ? "bg-slate-50 border-slate-100 text-slate-900 
                : "bg-white/5 border-white/5 text-white"
        )}>
            <span className="text-[9px] font-black text-slate-400 uppercase  italic leading-none">{label}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className={clsx("text-xs font-black italic tabular-nums leading-none", light ? "text-slate-900" : "text-white")}>{value}</span>
        </div>
    );
}

function CompositionMetric({ label, value, color = 'text-slate-400' }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="flex justify-between items-center text-[9px] font-black uppercase  italic">
            <span className="opacity-40">{label}</span>
            <span className={clsx("leading-none", color)}>{value}</span>
        </div>
    );
}
