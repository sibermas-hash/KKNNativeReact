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
      return res as unknown as { summary: Summary | null; comments: CommentRow[] };
    },
  });

  const summary = data?.summary;
  const comments = data?.comments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]">
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
        <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
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
              <section className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--profile-text)]">Rata-rata Per Aspek</h2>
                <div className="mt-4 space-y-3">
                  {summary.criterion_averages.map((criterion) => (
                    <div key={criterion.key} className="rounded-xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-4">
                      <p className="text-sm font-semibold text-[color:var(--profile-text)]">{criterion.label}</p>
                      <p className="mt-2 text-xl font-bold text-[color:var(--profile-primary)]">{criterion.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--profile-text)]">Sebaran Rekomendasi</h2>
                <div className="mt-4 space-y-2 text-sm font-semibold text-[color:var(--profile-text)]">
                  {Object.entries(summary.recommendations).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-[color:var(--profile-soft)] px-4 py-3 border border-[color:var(--profile-border)]">
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
                  <article key={comment.id} className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--profile-border)] pb-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--profile-text)]">{comment.group_name}</p>
                        <p className="mt-1 text-sm text-[color:var(--profile-muted)]">{comment.period_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--profile-primary)]">{comment.recommendation}</p>
                        <p className="mt-1 text-xs text-[color:var(--profile-muted)]">{comment.submitted_at}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[color:var(--profile-text)]">{comment.notes}</p>
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

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)]">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[color:var(--profile-muted)]">{label}</p>
          <p className="mt-1 text-xl font-bold text-[color:var(--profile-text)]">{value}</p>
        </div>
      </div>
    </div>
  );
}
