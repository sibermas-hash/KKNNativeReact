import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import {
  Activity,
  ShieldCheck,
  ChevronLeft,
  ExternalLink,
  FileText,
  Video,
  Newspaper,
  Image,
  User,
  Users,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  Fingerprint,
  Calendar,
  SearchCheck,
  AlertTriangle,
  Save,
  LayoutGrid,
  FileCheck,
  Archive,
  Zap,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';

interface Report {
  id: number;
  title: string;
  abstract?: string | null;
  status: string;
  video_link?: string | null;
  news_link?: string | null;
  file_path: string;
  file_name: string;
  article_1_path?: string | null;
  article_2_path?: string | null;
  poster_1_path?: string | null;
  poster_2_path?: string | null;
  poster_3_path?: string | null;
  submitted_at: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  mahasiswa?: {
    nama: string;
    nim: string;
  };
  kelompok?: {
    nama_kelompok: string;
    dpl?: {
      user?: {
        name: string;
      };
    };
  };
  reviewer?: {
    name: string;
  };
}

interface Props {
  report: Report;
}

export default function AdminFinalReportShow({ report }: Props) {
  const { data, setData, patch, processing } = useForm({
    status: report.status,
    review_notes: report.review_notes ?? '',
  });

  const handleSubmit = (status: 'disetujui' | 'revisi') => {
    setData('status', status);
    patch(route('admin.laporan.akhir.update-status', report.id));
  };

  const isFinalized = report.status === 'disetujui';

  return (
    <AppLayout title="Detail Audit Laporan">
      <Head title={`Audit Laporan: ${report.mahasiswa?.nama} | SIBERMAS`} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        {/* PAGE HEADER */}
        <PageHeader
          title="Audit Laporan."
          subtitle="Protokol validasi luaran akademik dan verifikasi kelayakan dokumen pengabdian."
          icon={Archive}
          groupLabel="Monitoring & Arsip"
          backUrl={route('admin.laporan.akhir.index')}
        >
          <div className="flex items-center gap-4">
            <StatusTag
              status={
                report.status === 'disetujui'
                  ? 'active'
                  : report.status === 'revisi'
                    ? 'error'
                    : report.status === 'reviewed'
                      ? 'info'
                      : 'pending'
              }
              label={report.status.toUpperCase()}
              size="lg"
            />
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: CORE CONTENT */}
          <div className="lg:col-span-8 space-y-8">
            {/* TITLE & ABSTRACT */}
            <ContentPanel
              title="Official Publication Narrative"
              description="Informasi fundamental mengenai judul dan substansi laporan pengabdian."
              icon={FileText}
            >
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-[0.2em]">
                    Judul Publikasi
                  </span>
                  <h2 className="text-2xl font-black leading-tight text-emerald-950 uppercase tracking-tight">
                    {report.title}
                  </h2>
                </div>
                {report.abstract && (
                  <div className="space-y-2 pt-6 border-t border-emerald-50">
                    <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-[0.2em]">
                      Abstrak Operasional
                    </span>
                    <p className="text-[13px] font-bold text-emerald-950/70 leading-relaxed text-justify">
                      {report.abstract}
                    </p>
                  </div>
                )}
              </div>
            </ContentPanel>

            {/* MULTIMEDIA ASSETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContentPanel
                title="Dokumentasi Video"
                description="Link publikasi dokumentasi video kegiatan."
                icon={Video}
              >
                <div className="py-2">
                  {report.video_link ? (
                    <a
                      href={report.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-[#F8FAF9] hover:bg-emerald-50 transition-colors border-2 border-slate-50 rounded-2xl group/link"
                    >
                      <span className="text-[11px] font-black text-emerald-950 truncate max-w-[200px] uppercase tracking-tight">
                        {report.video_link}
                      </span>
                      <ExternalLink
                        size={16}
                        className="text-emerald-300 group-hover/link:text-emerald-600 transition-colors"
                      />
                    </a>
                  ) : (
                    <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3">
                      <AlertTriangle size={18} className="text-rose-500" />
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                        Video Link Missing
                      </span>
                    </div>
                  )}
                </div>
              </ContentPanel>

              <ContentPanel
                title="Publikasi Berita"
                description="Link publikasi berita pengabdian masyarakat."
                icon={Newspaper}
              >
                <div className="py-2">
                  {report.news_link ? (
                    <a
                      href={report.news_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-[#F8FAF9] hover:bg-emerald-50 transition-colors border-2 border-slate-50 rounded-2xl group/link"
                    >
                      <span className="text-[11px] font-black text-emerald-950 truncate max-w-[200px] uppercase tracking-tight">
                        {report.news_link}
                      </span>
                      <ExternalLink
                        size={16}
                        className="text-emerald-300 group-hover/link:text-emerald-600 transition-colors"
                      />
                    </a>
                  ) : (
                    <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3">
                      <AlertTriangle size={18} className="text-rose-500" />
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                        News Link Missing
                      </span>
                    </div>
                  )}
                </div>
              </ContentPanel>
            </div>

            {/* ACADEMIC ARTIFACTS */}
            <ContentPanel
              title="Academic Artifact Vault"
              description="Kumpulan berkas dokumen, artikel ilmiah, dan poster yang diunggah."
              icon={LayoutGrid}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                {[
                  {
                    label: 'Laporan Utama',
                    path: report.file_path,
                    key: 'file_path',
                    icon: FileText,
                  },
                  {
                    label: 'Artikel Ilmiah 1',
                    path: report.article_1_path,
                    key: 'article_1_path',
                    icon: FileText,
                  },
                  {
                    label: 'Artikel Ilmiah 2',
                    path: report.article_2_path,
                    key: 'article_2_path',
                    icon: FileText,
                  },
                  {
                    label: 'Poster Peta 1',
                    path: report.poster_1_path,
                    key: 'poster_1_path',
                    icon: Image,
                  },
                  {
                    label: 'Poster Peta 2',
                    path: report.poster_2_path,
                    key: 'poster_2_path',
                    icon: Image,
                  },
                  {
                    label: 'Poster Peta 3',
                    path: report.poster_3_path,
                    key: 'poster_3_path',
                    icon: Image,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'p-6 border-2 rounded-2xl flex flex-col gap-4 group/asset transition-all',
                      item.path
                        ? 'bg-white border-slate-50 hover:border-emerald-600 shadow-sm'
                        : 'bg-gray-50 border-dashed border-gray-100 opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                          item.path
                            ? 'bg-emerald-50 text-emerald-600 group-hover/asset:bg-emerald-600 group-hover/asset:text-white'
                            : 'bg-gray-100 text-gray-400',
                        )}
                      >
                        <item.icon size={16} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>
                    {item.path ? (
                      <a
                        href={`/admin/laporan/akhir/${report.id}/unduh?asset=${item.key}`}
                        target="_blank"
                        className="h-10 w-full bg-emerald-950 text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
                        rel="noreferrer"
                      >
                        Lihat Berkas <ArrowRight size={14} />
                      </a>
                    ) : (
                      <div className="h-10 w-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-xl">
                        N/A
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ContentPanel>
          </div>

          {/* RIGHT COLUMN: AUDIT LOGS & ACTION */}
          <div className="lg:col-span-4 space-y-8">
            {/* AUDIT DECISION PANEL */}
            <ContentPanel
              title="Audit Decision"
              description="Tentukan status validasi dan berikan catatan review untuk mahasiswa."
              icon={SearchCheck}
              footer={
                !isFinalized ? (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={() => handleSubmit('disetujui')}
                      disabled={processing}
                      className="h-12 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Setujui
                    </button>
                    <button
                      onClick={() => handleSubmit('revisi')}
                      disabled={processing}
                      className="h-12 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Revisi
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">
                      Audit Finalized
                    </span>
                  </div>
                )
              }
            >
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-950 uppercase tracking-widest pl-1">
                    Reviewer Notes
                  </label>
                  <textarea
                    value={data.review_notes}
                    onChange={(e) => setData('review_notes', e.target.value)}
                    disabled={isFinalized}
                    className="w-full h-40 bg-[#F8FAF9] border-2 border-slate-50 rounded-2xl p-6 text-[12px] font-bold text-emerald-950 placeholder:text-emerald-950/20 focus:bg-white focus:border-emerald-600 outline-none transition-all leading-relaxed resize-none"
                    placeholder="Tuliskan instruksi revisi atau catatan verifikasi..."
                  />
                </div>
              </div>
            </ContentPanel>

            {/* AUDIT TELEMETRY */}
            <ContentPanel
              title="Audit Telemetry"
              description="Metadata dan jejak digital transmisi laporan."
              icon={Activity}
            >
              <div className="space-y-4 py-2">
                {[
                  { label: 'Ketua Unit', value: report.mahasiswa?.nama, icon: User },
                  { label: 'ID_NIM', value: report.mahasiswa?.nim, icon: Fingerprint },
                  { label: 'Kelompok', value: report.kelompok?.nama_kelompok, icon: Users },
                  {
                    label: 'Supervisor',
                    value: report.kelompok?.dpl?.user?.name,
                    icon: ShieldCheck,
                  },
                  { label: 'Timestamp', value: report.submitted_at, icon: Calendar },
                  {
                    label: 'Reviewer',
                    value: report.reviewer?.name || 'PENDING_AUDIT',
                    icon: SearchCheck,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group py-1">
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={12}
                        className="text-emerald-700/40 group-hover:text-emerald-600 transition-colors"
                      />
                      <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest group-hover:text-emerald-950 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-950 tabular-nums uppercase truncate max-w-[180px]">
                      {item.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </ContentPanel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
