import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BarChart3, Download, Filter, MessageSquareQuote, Search, Star, Users } from 'lucide-react';
import { useState } from 'react';

interface PeriodOption {
  id: number;
  name: string;
}

interface RecommendationOption {
  value: string;
  label: string;
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
  recommendations: Record<string, number>;
  latest_submitted_at?: string | null;
  criterion_averages: Array<{ key: string; label: string; average: number }>;
}

interface Props {
  periods: PeriodOption[];
  recommendationOptions: RecommendationOption[];
  filters: {
    period_id?: number | null;
    search?: string;
    recommendation?: string | null;
  };
  stats: {
    total_responses: number;
    average_score: number;
    dpl_count: number;
    average_response_rate: number;
  };
  summaries: Summary[];
}

export default function DplParticipantEvaluationIndex({
  periods,
  recommendationOptions,
  filters,
  stats,
  summaries,
}: Props) {
  const fieldIds = {
    search: 'admin-dpl-eval-search',
    period: 'admin-dpl-eval-period',
    recommendation: 'admin-dpl-eval-recommendation',
  };

  const [search, setSearch] = useState(filters.search ?? '');
  const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
  const [recommendation, setRecommendation] = useState(filters.recommendation ?? '');

  const applyFilters = () => {
    router.get(
      route('admin.evaluasi-dpl.index'),
      {
        search: search || undefined,
        period_id: periodId || undefined,
        recommendation: recommendation || undefined,
      },
      { preserveState: true, replace: true },
    );
  };

  return (
    <AppLayout title="Evaluasi DPL Peserta">
      <Head title="Evaluasi DPL Peserta" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageSquareQuote size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-950">Evaluasi DPL oleh Peserta</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-emerald-950">
                Halaman ini merangkum umpan balik mahasiswa terhadap DPL pada akhir KKN. Data ini
                dipakai untuk quality assurance pembimbingan dan tidak mengubah nilai akhir mahasiswa.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Filter size={16} className="text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">
                  Filter
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor={fieldIds.search} className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Cari DPL atau Kelompok
                  </label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" size={16} />
                    <input
                      id={fieldIds.search}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                      className="h-11 w-full rounded-xl border border-emerald-100 bg-white pl-10 pr-4 text-sm font-semibold text-emerald-950 outline-none focus:border-emerald-400"
                      placeholder="Nama DPL, NIP, atau kelompok"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={fieldIds.period} className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Periode
                  </label>
                  <select
                    id={fieldIds.period}
                    value={periodId}
                    onChange={(event) => setPeriodId(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm font-semibold text-emerald-950 outline-none focus:border-emerald-400"
                  >
                    <option value="">Semua periode</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={fieldIds.recommendation} className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Rekomendasi
                  </label>
                  <select
                    id={fieldIds.recommendation}
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm font-semibold text-emerald-950 outline-none focus:border-emerald-400"
                  >
                    <option value="">Semua rekomendasi</option>
                    {recommendationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700"
                  >
                    <Filter size={16} />
                    Terapkan
                  </button>
                  <a
                    href={route('admin.evaluasi-dpl.export', {
                      search: search || undefined,
                      period_id: periodId || undefined,
                      recommendation: recommendation || undefined,
                    })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black uppercase tracking-widest text-emerald-700 transition-all hover:border-emerald-300"
                  >
                    <Download size={16} />
                    Ekspor CSV
                  </a>
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <StatCard icon={MessageSquareQuote} label="Total Respon" value={stats.total_responses} />
              <StatCard icon={Star} label="Rata-rata Skor" value={stats.average_score.toFixed(2)} />
              <StatCard icon={Users} label="DPL Dinilai" value={stats.dpl_count} />
              <StatCard icon={BarChart3} label="Response Rate" value={`${stats.average_response_rate.toFixed(2)}%`} />
            </section>
          </aside>

          <section className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-emerald-50 bg-emerald-50/40 text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    <th className="px-4 py-4">DPL</th>
                    <th className="px-4 py-4">Fakultas</th>
                    <th className="px-4 py-4 text-center">Respon</th>
                    <th className="px-4 py-4 text-center">Response Rate</th>
                    <th className="px-4 py-4 text-center">Rata-rata</th>
                    <th className="px-4 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <p className="text-sm font-bold text-emerald-950">Belum ada evaluasi DPL peserta.</p>
                      </td>
                    </tr>
                  ) : (
                    summaries.map((summary) => (
                      <tr key={summary.dosen_id} className="border-b border-emerald-50/80 align-top">
                        <td className="px-4 py-5">
                          <p className="text-sm font-black uppercase tracking-wide text-emerald-950">
                            {summary.dosen_name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-950">NIP {summary.nip}</p>
                          <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
                            {summary.group_count} kelompok • update {summary.latest_submitted_at ?? '-'}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-sm font-semibold text-emerald-950">{summary.faculty_name}</td>
                        <td className="px-4 py-5 text-center text-sm font-black text-emerald-950">
                          {summary.response_count}/{summary.eligible_count}
                        </td>
                        <td className="px-4 py-5 text-center text-sm font-black text-emerald-950">
                          {summary.response_rate.toFixed(2)}%
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white">
                            {summary.average_score.toFixed(2)}
                          </div>
                          <div className="mt-3 space-y-1 text-left text-[11px] font-semibold text-emerald-950">
                            {summary.criterion_averages.slice(0, 2).map((criterion) => (
                              <p key={criterion.key}>
                                {criterion.label}: <span className="font-black">{criterion.average.toFixed(2)}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <Link
                            href={route('admin.evaluasi-dpl.show', {
                              dosen: summary.dosen_id,
                              period_id: periodId || undefined,
                            })}
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 transition-all hover:border-emerald-300"
                          >
                            Buka Detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
