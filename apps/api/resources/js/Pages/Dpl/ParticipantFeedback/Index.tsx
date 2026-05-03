import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BarChart3, MessageSquareQuote, ShieldCheck, Star, Users } from 'lucide-react';

interface PeriodOption {
  id: number;
  name: string;
}

interface Summary {
  dosen_id: number;
  dosen_name: string;
  response_count: number;
  eligible_count: number;
  response_rate: number;
  average_score: number;
  criterion_averages: Array<{ key: string; label: string; average: number }>;
  recommendations: Record<string, number>;
}

interface CommentRow {
  id: number;
  group_name: string;
  period_name: string;
  recommendation: string;
  notes: string;
  submitted_at: string;
}

interface Props {
  summary?: Summary | null;
  comments: CommentRow[];
  periods: PeriodOption[];
  selectedPeriodId?: number | null;
}

export default function ParticipantFeedbackIndex({
  summary,
  comments,
  periods,
  selectedPeriodId,
}: Props) {
  const periodFieldId = 'dpl-feedback-period';

  const changePeriod = (value: string) => {
    router.get(
      route('dosen.feedback-dpl.index'),
      { period_id: value || undefined },
      { preserveState: true, replace: true },
    );
  };

  return (
    <AppLayout title="Umpan Balik Peserta">
      <Head title="Umpan Balik Peserta" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageSquareQuote size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-950">Umpan Balik Peserta</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-emerald-950">
                Halaman ini menampilkan ringkasan anonim evaluasi peserta untuk pembimbingan DPL.
                Identitas penilai tidak ditampilkan agar umpan balik tetap aman dan membangun.
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <div className="w-full max-w-xs">
            <label
              htmlFor={periodFieldId}
              className="text-[11px] font-black uppercase tracking-widest text-emerald-600"
            >
              Periode
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

        {!summary ? (
          <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black uppercase tracking-widest text-emerald-950">
              Belum Ada Umpan Balik Peserta
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-emerald-950">
              Sistem belum menemukan evaluasi peserta untuk periode yang dipilih.
            </p>
          </section>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                icon={Users}
                label="Respon Masuk"
                value={`${summary.response_count}/${summary.eligible_count}`}
              />
              <StatCard
                icon={BarChart3}
                label="Response Rate"
                value={`${summary.response_rate.toFixed(2)}%`}
              />
              <StatCard
                icon={Star}
                label="Rata-rata Skor"
                value={summary.average_score.toFixed(2)}
              />
              <StatCard icon={ShieldCheck} label="Ringkasan" value="Anonim" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <aside className="space-y-4">
                <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                    Rata-rata Per Aspek
                  </h2>
                  <div className="mt-4 space-y-3">
                    {summary.criterion_averages.map((criterion) => (
                      <div
                        key={criterion.key}
                        className="rounded-xl border border-emerald-50 bg-emerald-50/20 p-4"
                      >
                        <p className="text-sm font-bold text-emerald-950">{criterion.label}</p>
                        <p className="mt-2 text-xl font-black text-emerald-600">
                          {criterion.average.toFixed(2)}
                        </p>
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
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-xl bg-emerald-50/30 px-4 py-3"
                      >
                        <span className="capitalize">{key.replaceAll('_', ' ')}</span>
                        <span className="font-black">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>

              <section className="space-y-4 lg:col-span-2">
                {comments.length === 0 ? (
                  <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-bold text-emerald-950">
                      Peserta belum menambahkan catatan terbuka untuk periode ini.
                    </p>
                  </section>
                ) : (
                  comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-50 pb-4">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-emerald-950">
                            {comment.group_name}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-950">
                            {comment.period_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                            {comment.recommendation}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-950">
                            {comment.submitted_at}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm font-semibold leading-relaxed text-emerald-950">
                        {comment.notes}
                      </p>
                    </article>
                  ))
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
            {label}
          </p>
          <p className="mt-1 text-xl font-black text-emerald-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
