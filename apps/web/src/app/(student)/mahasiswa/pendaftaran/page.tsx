'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertCircle, BookOpen, Calendar, CheckCircle2, ChevronDown, ChevronRight,
  Clock, FileText, GraduationCap, MapPin, Shield, Users, XCircle,
} from 'lucide-react';

type Period = {
  id: number; name: string; current_phase: string; kuota: number;
  registration_start: string; registration_end: string; start_date: string; end_date: string;
  can_register: boolean; ineligible_reasons: string[];
  jenis: { id: number; name: string; code: string; description?: string } | null;
  requirements: { config: unknown[]; documents: string[] };
};
type UserEligibility = {
  sks_completed: number;
  gpa: number;
  bta_ppi_passed: boolean;
  has_health_certificate: boolean;
  has_parent_permission: boolean;
  thresholds?: { min_sks: number; min_gpa: number };
};
type RegistrationStatus = { has_registered: boolean; status?: string; period_name?: string; jenis_name?: string; registered_at?: string };
type GroupInfo = {
  id: number; nama_kelompok: string; code: string; capacity: number;
  peserta_count: number; remaining_seats: number; male_count: number; female_count: number;
  male_min_required: number; male_target_max: number;
  lokasi: { id: number; village_name: string; district_name: string; regency_name: string; full_name: string } | null;
};

const PHASE_LABELS: Record<string, string> = { registration: 'Pendaftaran', placement: 'Penempatan', execution: 'Pelaksanaan' };

function EligibilityBadge({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${passed ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
      {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      <span>{label}</span>
    </div>
  );
}

function GroupCard({ group }: { group: GroupInfo }) {
  const fillPercent = group.capacity > 0 ? Math.round((group.peserta_count / group.capacity) * 100) : 0;
  const isFull = group.remaining_seats <= 0;
  const needsMale = group.male_count < group.male_min_required;

  return (
    <div className={`rounded-xl border p-4 transition-all ${isFull ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800">{group.nama_kelompok}</p>
          {group.lokasi && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={11} /> {group.lokasi.full_name}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${isFull ? 'bg-slate-200 text-slate-600' : 'bg-teal-50 text-teal-700'}`}>
          {isFull ? 'Penuh' : `${group.remaining_seats} sisa`}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{group.peserta_count}/{group.capacity} peserta</span>
          <span>{fillPercent}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${fillPercent}%` }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        <span>L: {group.male_count}</span>
        <span>P: {group.female_count}</span>
        {needsMale && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 font-semibold">Butuh laki-laki</span>}
      </div>
    </div>
  );
}

function PeriodCard({ period, onRegister, isRegistering, disabled }: { period: Period; onRegister: () => void; isRegistering: boolean; disabled: boolean }) {
  const [showGroups, setShowGroups] = useState(false);
  const [groups, setGroups] = useState<GroupInfo[] | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const toggleGroups = async () => {
    if (showGroups) { setShowGroups(false); return; }
    if (!groups) {
      setLoadingGroups(true);
      try {
        const res = await studentApi.kknDaftar.groups(period.id);
        const data = (res as unknown as { data?: { groups?: unknown[] }; groups?: unknown[] })?.data ?? res;
        setGroups((data.groups ?? data.data?.groups ?? []) as typeof groups);
      } catch { toast.error('Gagal memuat data kelompok'); }
      finally { setLoadingGroups(false); }
    }
    setShowGroups(true);
  };

  const isOpen = period.current_phase === 'registration';

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800 truncate">{period.name}</h3>
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {PHASE_LABELS[period.current_phase] || period.current_phase}
              </span>
            </div>
            {period.jenis && (
              <p className="mt-1 text-sm text-slate-500">{period.jenis.name}</p>
            )}
          </div>
          <button
            onClick={onRegister}
            disabled={disabled || !period.can_register || isRegistering}
            className="shrink-0 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-sm"
          >
            {isRegistering ? 'Memproses...' : 'Daftar KKN'}
          </button>
        </div>

        {/* Schedule & Quota */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Calendar size={12} /> Pendaftaran: {period.registration_start} — {period.registration_end}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> Pelaksanaan: {period.start_date} — {period.end_date}</span>
          <span className="flex items-center gap-1"><Users size={12} /> Kuota: {period.kuota}</span>
        </div>

        {/* Document requirements */}
        {period.requirements.documents.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {period.requirements.documents.map((doc) => (
              <span key={doc} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
                <FileText size={10} /> {doc}
              </span>
            ))}
          </div>
        )}

        {/* Ineligible reasons */}
        {!period.can_register && period.ineligible_reasons.length > 0 && (
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700"><AlertCircle size={12} /> Belum memenuhi syarat:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-rose-600">
              {period.ineligible_reasons.map((reason, i) => <li key={i}>• {reason}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Groups toggle */}
      <button
        onClick={toggleGroups}
        className="flex w-full items-center justify-between px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2"><MapPin size={14} /> Lihat Kelompok & Lokasi</span>
        {loadingGroups ? <Clock size={14} className="animate-spin" /> : showGroups ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Groups grid */}
      {showGroups && groups && (
        <div className="border-t border-slate-100 px-6 py-4">
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada kelompok untuk periode ini.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => <GroupCard key={g.id} group={g} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RegistrationFormPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [registeringPeriod, setRegisteringPeriod] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.kknDaftar,
    queryFn: async () => {
      const res = await studentApi.kknDaftar.index();
      return (res as unknown as { data?: unknown })?.data ?? res;
    },
  });

  const registerMutation = useMutation({
    mutationFn: (periodeId: number) => {
      setRegisteringPeriod(periodeId);
      return studentApi.registration.store({ periode_id: periodeId });
    },
    onSuccess: (_data, periodeId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.kknDaftar });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.form });
      router.push(`/mahasiswa/pendaftaran/${periodeId}/dokumen`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = e?.response?.data?.error?.message || 'Gagal mendaftar. Periksa kelayakan Anda.';
      toast.error(msg);
      setRegisteringPeriod(null);
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    );
  }

  const periods = (data?.periods as Period[]) || [];
  const userEligibility = data?.user_eligibility as UserEligibility | undefined;
  const registrationStatus = data?.registration_status as RegistrationStatus | undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
          <BookOpen size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Pendaftaran KKN</h1>
          <p className="text-sm text-slate-500">Pilih periode, periksa kelayakan, dan daftarkan diri Anda.</p>
        </div>
      </div>

      {/* Existing Registration Banner */}
      {registrationStatus?.has_registered && (
        <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-5 ring-1 ring-indigo-100">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-indigo-600" />
            <div>
              <p className="text-sm font-bold text-indigo-900">Anda sudah terdaftar di {registrationStatus.period_name}</p>
              <p className="text-xs text-indigo-600">Status: {registrationStatus.status} | Terdaftar: {registrationStatus.registered_at}</p>
            </div>
          </div>
          <Link href="/mahasiswa/cek-pendaftaran" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            Lihat Status
          </Link>
        </div>
      )}

      {/* Eligibility Summary */}
      {userEligibility && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <GraduationCap size={16} /> Ringkasan Kelayakan
          </h2>
          <div className="flex flex-wrap gap-2">
            <EligibilityBadge label={`SKS: ${userEligibility.sks_completed}`} passed={userEligibility.sks_completed >= (userEligibility.thresholds?.min_sks ?? 100)} />
            <EligibilityBadge label={`IPK: ${userEligibility.gpa}`} passed={userEligibility.gpa >= (userEligibility.thresholds?.min_gpa ?? 2.0)} />
            <EligibilityBadge label="BTA/PPI" passed={userEligibility.bta_ppi_passed} />
            <EligibilityBadge label="Surat Sehat" passed={userEligibility.has_health_certificate} />
            <EligibilityBadge label="Izin Ortu" passed={userEligibility.has_parent_permission} />
          </div>
        </div>
      )}

      {/* Periods List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700">Periode Tersedia</h2>
        {periods.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <Calendar size={48} className="mx-auto text-slate-300" />
            <p className="mt-4 text-lg font-bold text-slate-700">Tidak Ada Periode Aktif</p>
            <p className="mt-2 text-sm text-slate-500">Pendaftaran KKN belum dibuka. Silakan cek kembali nanti.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                onRegister={() => registerMutation.mutate(period.id)}
                isRegistering={registeringPeriod === period.id && registerMutation.isPending}
                disabled={!!registrationStatus?.has_registered || registerMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
