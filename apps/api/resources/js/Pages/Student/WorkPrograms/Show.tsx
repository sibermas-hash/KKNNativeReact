import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/UI';
import { route } from 'ziggy-js';
import {
  ArrowLeft,
  Download,
  FileText,
  MapPin,
  Paperclip,
  Target,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';

interface ProposalItem {
  id: number;
  file_name: string;
  version: number;
  uploaded_at: string | null;
  download_url: string;
}

interface WorkProgramDetail {
  id: number;
  title: string;
  description: string | null;
  objectives: string | null;
  target_participants: number | null;
  budget: number;
  status: string;
  kategori: string | null;
  submitted_at: string | null;
  location: string | null;
  proposals: ProposalItem[];
}

interface Props {
  workProgram: WorkProgramDetail;
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function StudentWorkProgramShow({ workProgram }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm<{
    proposal_file: File | null;
  }>({
    proposal_file: null,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    post(route('student.program-kerja.proposals.upload', workProgram.id), {
      forceFormData: true,
      onSuccess: () => reset('proposal_file'),
    });
  };

  return (
    <AppLayout title="Detail Program Kerja">
      <Head title={`${workProgram.title} | Program Kerja`} />

      <div className="mx-auto max-w-5xl space-y-8 pb-20">
        <section className="rounded-[2rem] border border-emerald-50/60 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <Link
                href={route('student.program-kerja.index')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                <ArrowLeft size={16} />
                Kembali ke daftar program kerja
              </Link>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={workProgram.status} className="rounded-xl px-4 py-2" />
                  {workProgram.kategori ? (
                    <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      {workProgram.kategori}
                    </span>
                  ) : null}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
                  {workProgram.title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-emerald-950/80">
                  {workProgram.description || 'Deskripsi program belum ditambahkan.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-50/60 bg-emerald-50/40 px-5 py-4 text-sm text-emerald-950">
              <p className="font-semibold">Diajukan</p>
              <p>{formatDate(workProgram.submitted_at)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-emerald-50/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Target size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Tujuan
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-950">
              {workProgram.objectives || 'Belum ada tujuan terukur yang dicatat.'}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-50/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Wallet size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Anggaran
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">
              Rp {Number(workProgram.budget || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-50/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Users size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Target Peserta
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">
              {workProgram.target_participants ? `${workProgram.target_participants} orang` : '-'}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-emerald-50/60 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-950">Riwayat Proposal</h2>
                <p className="text-sm text-emerald-950/70">
                  Setiap unggahan baru disimpan sebagai versi terpisah.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {workProgram.proposals.length > 0 ? (
                workProgram.proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex flex-col gap-4 rounded-2xl border border-emerald-50/60 bg-emerald-50/20 px-5 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                          Versi {proposal.version}
                        </span>
                        <span className="text-xs text-emerald-950/60">
                          {formatDate(proposal.uploaded_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-emerald-950">{proposal.file_name}</p>
                    </div>

                    <a
                      href={proposal.download_url}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Download size={16} />
                      Unduh
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/20 px-6 py-10 text-center text-sm text-emerald-950/70">
                  Belum ada proposal yang diunggah untuk program kerja ini.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-emerald-50/60 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-emerald-950">Unggah Revisi</h2>
                  <p className="text-sm text-emerald-950/70">
                    PDF atau Word, maksimal 4 MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    <Paperclip size={14} />
                    File Proposal
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => setData('proposal_file', event.target.files?.[0] ?? null)}
                    className="block w-full rounded-2xl border border-emerald-50/60 bg-emerald-50/20 px-4 py-3 text-sm text-emerald-950 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:text-white hover:file:bg-emerald-700"
                  />
                  {errors.proposal_file ? (
                    <p className="text-sm font-semibold text-rose-500">{errors.proposal_file}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={processing || !data.proposal_file}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={16} />
                  {processing ? 'Mengunggah...' : 'Unggah Proposal Baru'}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-emerald-50/60 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-emerald-950">Lokasi Kelompok</h2>
                  <p className="text-sm text-emerald-950/70">
                    Penempatan program kerja saat ini.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-emerald-950">
                {workProgram.location || 'Lokasi kelompok belum tersedia.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
