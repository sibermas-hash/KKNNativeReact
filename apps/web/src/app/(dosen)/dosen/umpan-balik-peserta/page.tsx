'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { Users, BarChart3, Star, ShieldCheck, MessageSquareQuote } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

interface Summary {
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

export default function ParticipantFeedbackPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.feedback,
    queryFn: async () => {
      const res = await dplApi.feedback();
      return (res as unknown as { success: boolean; data: { summary: Summary | null; comments: CommentRow[] } }).data;
    },
  });

  const summary = data?.summary;
  const comments = data?.comments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MessageSquareQuote size={22} />
        </div>
        <div>
          <PageHeader
            title="Umpan Balik Peserta"
            subtitle="Halaman ini menampilkan ringkasan anonim evaluasi peserta untuk pembimbingan DPL. Identitas penilai tidak ditampilkan agar umpan balik tetap aman dan membangun."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !summary ? (
        <EmptyState
          icon={<MessageSquareQuote size={40} />}
          title="Belum Ada Umpan Balik Peserta"
          description="Sistem belum menemukan evaluasi peserta untuk periode yang dipilih."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={Users} label="Respon Masuk" value={`${summary.response_count}/${summary.eligible_count}`} />
            <StatCard icon={BarChart3} label="Response Rate" value={`${summary.response_rate.toFixed(2)}%`} />
            <StatCard icon={Star} label="Rata-rata Skor" value={summary.average_score.toFixed(2)} />
            <StatCard icon={ShieldCheck} label="Ringkasan" value="Anonim" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <aside className="space-y-4">
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Rata-rata Per Aspek</h2>
                <div className="mt-4 space-y-3">
                  {summary.criterion_averages.map((criterion) => (
                    <div key={criterion.key} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-sm font-semibold text-slate-700">{criterion.label}</p>
                      <p className="mt-2 text-xl font-bold text-emerald-600">{criterion.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Sebaran Rekomendasi</h2>
                <div className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
                  {Object.entries(summary.recommendations).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <span className="capitalize">{key.replaceAll('_', ' ')}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <section className="space-y-4 lg:col-span-2">
              {comments.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareQuote size={40} />}
                  title="Belum Ada Catatan"
                  description="Peserta belum menambahkan catatan terbuka untuk periode ini."
                />
              ) : (
                comments.map((comment) => (
                  <article key={comment.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{comment.group_name}</p>
                        <p className="mt-1 text-sm text-slate-600">{comment.period_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">{comment.recommendation}</p>
                        <p className="mt-1 text-xs text-slate-500">{comment.submitted_at}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700">{comment.notes}</p>
                  </article>
                ))
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

import { ComponentType } from 'react';

function StatCard({ icon: Icon, label, value }: { icon: ComponentType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
