import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, BarChart3, Calendar, MessageSquareQuote, Star, Users } from 'lucide-react';

interface PeriodOption {
  id: number;
  name: string;
}

interface Summary {
  dosen_id: number;
  dosen_name: string;
  nip: string;
  faculty_name: string;
  response_count: number;
  eligible_count: number;
  response_rate: number;
  average_score: number;
  group_count: number;
  latest_submitted_at?: string | null;
  criterion_averages: Array<{ key: string; label: string; average: number }>;
  recommendations: Record<string, number>;
}

interface ResponseRow {
  id: number;
  student_name: string;
  student_nim: string;
  group_name: string;
  period_name: string;
  recommendation: string;
  total_score: number;
  notes?: string | null;
  submitted_at?: string | null;
  items: Array<{
    criterion_key: string;
    criterion_label: string;
    score: number;
    weight: number;
  }>;
}

interface Props {
  periods: PeriodOption[];
  selectedPeriodId?: number | null;
  summary: Summary;
  responses: ResponseRow[];
}

export default function DplParticipantEvaluationShow({
  periods,
  selectedPeriodId,
  summary,
  responses,
}: Props) {
  const periodFieldId = 'admin-dpl-eval-detail-period';

  const changePeriod = (value: string) => {
    router.get(
      route('admin.evaluasi-dpl.show', summary.dosen_id),
      { period_id: value || undefined },
      { preserveState: true, replace: true },
    );
  };

  return (
    <AppLayout title="Detail Evaluasi DPL">
      <Head title={`Detail Evaluasi ${summary.dosen_name}`} />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={route('admin.evaluasi-dpl.index')}
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600"
            >
              <ArrowLeft size={16} />
              Kembali ke Rekap
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-emerald-950">{summary.dosen_name}</h1>
            <p className="mt-1 text-sm font-semibold text-emerald-950">
              NIP {summary.nip} • {summary.faculty_name}
            </p>
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor={periodFieldId} className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
              Filter Periode
            </label>
            <select
              id={periodFieldId}
              value={selectedPeriodId ? String(selectedPeriodId) : ''}
              onChange={(event) => changePeriod(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm font-semibold text-emerald-950 outline-none focus:border-emerald-400"
            >
              <option value="">Semua periode yang tersedia</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={MessageSquareQuote} label="Respon" value={`${summary.response_count}/${summary.eligible_count}`} />
          <StatCard icon={BarChart3} label="Response Rate" value={`${summary.response_rate.toFixed(2)}%`} />
          <StatCard icon={Star} label="Rata-rata Skor" value={summary.average_score.toFixed(2)} />
          <StatCard icon={Users} label="Kelompok Dinilai" value={summary.group_count} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                  Rerata Per Aspek
                </h2>
              </div>
              <div className="space-y-3">
                {summary.criterion_averages.map((criterion) => (
                  <div key={criterion.key} className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-4">
                    <p className="text-sm font-bold text-emerald-950">{criterion.label}</p>
                    <p className="mt-2 text-xl font-black text-emerald-600">{criterion.average.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                Sebaran Rekomendasi
              </h2>
              <div className="mt-4 space-y-2 text-sm font-semibold text-emerald-950">
                {Object.entries(summary.recommendations).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl bg-emerald-50/30 px-4 py-3">
                    <span className="capitalize">{key.replaceAll('_', ' ')}</span>
                    <span className="font-black">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-4 lg:col-span-2">
            {responses.map((response) => (
              <article key={response.id} className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-50 pb-4">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-emerald-950">
                      {response.student_name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      {response.student_nim} • {response.group_name} • {response.period_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                      {response.recommendation}
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-950">
                      {response.total_score.toFixed(2)}
                    </p>
                    <p className="text-xs font-semibold text-emerald-950">{response.submitted_at ?? '-'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {response.items.map((item) => (
                    <div key={item.criterion_key} className="rounded-xl border border-emerald-50 bg-emerald-50/20 p-4">
                      <p className="text-sm font-bold text-emerald-950">{item.criterion_label}</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-600">
                        Skor {item.score}/5 • Bobot {item.weight}%
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-emerald-50 bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Catatan Peserta
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
                    {response.notes || 'Peserta tidak menambahkan catatan.'}
                  </p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{label}</p>
          <p className="mt-1 text-xl font-black text-emerald-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
