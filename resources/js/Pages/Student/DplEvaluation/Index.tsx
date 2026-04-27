import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, MessageSquareQuote, ShieldCheck, Star, UserCheck } from 'lucide-react';

interface Criterion {
  key: string;
  label: string;
  weight: number;
}

interface RecommendationOption {
  value: string;
  label: string;
}

interface ExistingEvaluation {
  id: number;
  total_score: number;
  recommendation: string;
  notes?: string | null;
  submitted_at: string | null;
  items: Array<{
    criterion_key: string;
    criterion_label: string;
    score: number;
    weight: number;
  }>;
}

interface Props {
  eligible: boolean;
  reason?: string | null;
  criteria: Criterion[];
  recommendationOptions: RecommendationOption[];
  registration?: { period_name: string } | null;
  group?: { id: number; name: string; code: string; location_name: string } | null;
  dpl?: { id: number; name: string; nip?: string | null } | null;
  existingEvaluation?: ExistingEvaluation | null;
}

const fieldIds = {
  recommendation: 'dpl-evaluation-recommendation',
  notes: 'dpl-evaluation-notes',
};

export default function StudentDplEvaluationIndex({
  eligible,
  reason,
  criteria,
  recommendationOptions,
  registration,
  group,
  dpl,
  existingEvaluation,
}: Props) {
  const initialScores = criteria.reduce<Record<string, number>>((carry, criterion) => {
    carry[criterion.key] =
      existingEvaluation?.items.find((item) => item.criterion_key === criterion.key)?.score ?? 0;

    return carry;
  }, {});

  const form = useForm({
    scores: initialScores,
    recommendation: existingEvaluation?.recommendation ?? '',
    notes: existingEvaluation?.notes ?? '',
    confirmation: false,
  });

  const submit = () => {
    form.post(route('student.evaluasi-dpl.store'));
  };

  const recommendationLabel = recommendationOptions.find(
    (option) => option.value === existingEvaluation?.recommendation,
  )?.label;

  return (
    <AppLayout title="Evaluasi DPL">
      <Head title="Evaluasi DPL" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageSquareQuote size={22} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-emerald-950">Evaluasi Kinerja DPL</h1>
              <p className="max-w-3xl text-sm font-semibold leading-relaxed text-emerald-950">
                Umpan balik ini dipakai untuk peningkatan mutu pembimbingan KKN. Nama Anda tidak
                ditampilkan kepada DPL, tetapi admin tetap dapat melakukan audit bila diperlukan.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                  Ringkasan Penilaian
                </h2>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Periode
                  </dt>
                  <dd className="mt-1 font-bold text-emerald-950">
                    {registration?.period_name ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Kelompok
                  </dt>
                  <dd className="mt-1 font-bold text-emerald-950">
                    {group ? `${group.name} (${group.code})` : '-'}
                  </dd>
                  <dd className="text-xs font-semibold text-emerald-950">
                    {group?.location_name ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    DPL
                  </dt>
                  <dd className="mt-1 font-bold text-emerald-950">{dpl?.name ?? '-'}</dd>
                  <dd className="text-xs font-semibold text-emerald-950">{dpl?.nip ?? '-'}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-emerald-50 bg-emerald-50/50 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                  Aturan
                </h2>
              </div>
              <div className="space-y-2 text-sm font-semibold leading-relaxed text-emerald-950">
                <p>
                  Satu peserta hanya dapat mengirim satu evaluasi untuk satu DPL pada satu periode.
                </p>
                <p>Isi penilaian dengan jujur dan fokus pada pengalaman pembimbingan selama KKN.</p>
                <p>Komentar akan ditampilkan secara anonim pada ringkasan DPL.</p>
              </div>
            </section>
          </aside>

          <div className="space-y-4 lg:col-span-2">
            {!eligible ? (
              <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <Star size={24} />
                </div>
                <h2 className="mt-4 text-lg font-black uppercase tracking-widest text-emerald-950">
                  Evaluasi Belum Bisa Diisi
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-emerald-950">
                  {reason ?? 'Sistem belum dapat membuka evaluasi DPL untuk akun Anda.'}
                </p>
              </section>
            ) : existingEvaluation ? (
              <section className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-50 pb-5">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-emerald-950">
                      Evaluasi Sudah Dikirim
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      Dikirim pada {existingEvaluation.submitted_at ?? '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-600 px-5 py-3 text-white">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-100">
                      Skor Total
                    </p>
                    <p className="text-2xl font-black">
                      {existingEvaluation.total_score.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {existingEvaluation.items.map((item) => (
                    <div
                      key={item.criterion_key}
                      className="rounded-2xl border border-emerald-50 bg-emerald-50/30 p-4"
                    >
                      <p className="text-sm font-black uppercase tracking-wide text-emerald-950">
                        {item.criterion_label}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          Bobot {item.weight}%
                        </span>
                        <span className="text-xl font-black text-emerald-950">{item.score}/5</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-50 bg-white p-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Rekomendasi
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-950">
                    {recommendationLabel ?? '-'}
                  </p>
                  <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Catatan
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-950">
                    {existingEvaluation.notes || 'Tidak ada catatan tambahan.'}
                  </p>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm">
                <div className="border-b border-emerald-50 pb-5">
                  <h2 className="text-lg font-black uppercase tracking-widest text-emerald-950">
                    Form Evaluasi DPL
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-emerald-950">
                    Beri skor 1 sampai 5 untuk setiap aspek pembimbingan.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {criteria.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="rounded-2xl border border-emerald-50 bg-emerald-50/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wide text-emerald-950">
                            {criterion.label}
                          </h3>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-emerald-600">
                            Bobot {criterion.weight}%
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const active = form.data.scores[criterion.key] === score;

                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() =>
                                  form.setData('scores', {
                                    ...form.data.scores,
                                    [criterion.key]: score,
                                  })
                                }
                                className={`h-10 w-10 rounded-xl border text-sm font-black transition-all ${
                                  active
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-emerald-100 bg-white text-emerald-950 hover:border-emerald-300'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {Boolean(
                        (form.errors as Record<string, string>)[`scores.${criterion.key}`],
                      ) && (
                        <p className="mt-2 text-xs font-bold text-rose-600">
                          {(form.errors as Record<string, string>)[`scores.${criterion.key}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor={fieldIds.recommendation}
                      className="text-[11px] font-black uppercase tracking-widest text-emerald-600"
                    >
                      Rekomendasi
                    </label>
                    <select
                      id={fieldIds.recommendation}
                      value={form.data.recommendation}
                      onChange={(event) => form.setData('recommendation', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm font-bold text-emerald-950 outline-none focus:border-emerald-400"
                    >
                      <option value="">Pilih rekomendasi</option>
                      {recommendationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {form.errors.recommendation && (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {form.errors.recommendation}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={fieldIds.notes}
                      className="text-[11px] font-black uppercase tracking-widest text-emerald-600"
                    >
                      Catatan Tambahan
                    </label>
                    <textarea
                      id={fieldIds.notes}
                      value={form.data.notes}
                      onChange={(event) => form.setData('notes', event.target.value)}
                      rows={5}
                      className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-emerald-950 outline-none focus:border-emerald-400"
                      placeholder="Tuliskan saran atau catatan yang membangun untuk pembimbingan DPL."
                    />
                    {form.errors.notes && (
                      <p className="mt-2 text-xs font-bold text-rose-600">{form.errors.notes}</p>
                    )}
                  </div>
                </div>

                <label className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4">
                  <input
                    type="checkbox"
                    checked={form.data.confirmation}
                    onChange={(event) => form.setData('confirmation', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600"
                  />
                  <span className="text-sm font-semibold leading-relaxed text-emerald-950">
                    Saya mengonfirmasi bahwa penilaian ini diisi secara jujur berdasarkan pengalaman
                    pembimbingan selama KKN.
                  </span>
                </label>
                {form.errors.confirmation && (
                  <p className="mt-2 text-xs font-bold text-rose-600">{form.errors.confirmation}</p>
                )}
                {form.errors.evaluation && (
                  <p className="mt-2 text-xs font-bold text-rose-600">{form.errors.evaluation}</p>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={form.processing}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} />
                    {form.processing ? 'Mengirim...' : 'Kirim Evaluasi'}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
