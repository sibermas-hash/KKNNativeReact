import { type FormEvent, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/UI';

interface StudentGrade {
  id: number;
  score_id: number | null;
  nim: string;
  name: string;
  group_name: string;
  kelompok_id: number;
  final_grade_letter: string | null;
  final_grade_value: number | string | null;
  is_locked: boolean;
  fakultas?: string | null;
  prodi?: string | null;
  can_finalize?: boolean;
}

interface Props {
  stats: {
    total_students: number;
    graded_count: number;
    locked_count: number;
    average_value: number;
  } | null;
  filters: {
    search?: string | null;
    period_id?: number | string | null;
    faculty_id?: number | string | null;
    kelompok_id?: number | string | null;
    huruf?: string | null;
  };
  periods: Array<{ id: number; name: string }>;
  faculties: Array<{ id: number; name: string }>;
  lockedFaculty?: { id: number; name: string } | null;
  canExport: boolean;
  canFinalizeMass: boolean;
  scores: StudentGrade[] | null;
}

export default function RekapNilaiIndex({
  scores,
  stats,
  filters,
  periods,
  faculties,
  lockedFaculty,
  canExport,
  canFinalizeMass,
}: Props) {
  const [search, setSearch] = useState(filters.search ? String(filters.search) : '');
  const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
  const [facultyId, setFacultyId] = useState(filters.faculty_id ? String(filters.faculty_id) : '');
  const [huruf, setHuruf] = useState(filters.huruf ? String(filters.huruf) : '');
  const [certProgress, setCertProgress] = useState<{
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    total: number;
    download_url?: string;
  }>({ status: 'idle', progress: 0, processed: 0, total: 0 });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (certProgress.status === 'processing') {
      interval = setInterval(() => {
        fetch(route('admin.grade-reports.progres-sertifikat', { period_id: periodId }))
          .then((res) => res.json())
          .then((data) => {
            if (data)
              setCertProgress((prev) => ({
                ...prev,
                status: data.status,
                progress: data.progress || 0,
                processed: data.processed || 0,
                total: data.total || 0,
                download_url: data.download_url,
              }));
          });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [certProgress.status, periodId]);

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    router.get(
      route('admin.grade-reports.index'),
      {
        search: search || undefined,
        period_id: periodId || undefined,
        faculty_id: lockedFaculty ? lockedFaculty.id : facultyId || undefined,
        huruf: huruf || undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const handleFinalize = (scoreId: number) => {
    if (
      confirm(
        'Lakukan kunci nilai pada mahasiswa ini? Data yang dikunci tidak dapat diubah kembali.',
      )
    ) {
      router.patch(route('admin.grade-reports.finalisasi', scoreId), {}, { preserveScroll: true });
    }
  };

  const handleBulkFinalize = () => {
    if (!periodId) return;
    if (confirm('Kunci seluruh nilai yang sudah lengkap secara massal?')) {
      router.post(
        route('admin.grade-reports.finalisasi-massal'),
        { period_id: periodId },
        { preserveScroll: true },
      );
    }
  };

  const exportWithPath = (path: 'ekspor' | 'ekspor-ledger') => {
    if (!periodId) return;
    const params = new URLSearchParams();
    params.set('period_id', periodId);
    if (lockedFaculty) params.set('faculty_id', String(lockedFaculty.id));
    else if (facultyId) params.set('faculty_id', facultyId);
    if (search) params.set('search', search);
    if (huruf) params.set('huruf', huruf);
    window.location.href = `${path === 'ekspor' ? route('admin.grade-reports.ekspor') : route('admin.grade-reports.ekspor-ledger')}?${params.toString()}`;
  };

  const [previewData, setPreviewData] = useState<{
    open: boolean;
    loading: boolean;
    base64: string | null;
    filename: string | null;
  }>({ open: false, loading: false, base64: null, filename: null });

  const handlePreview = async (scoreId: number) => {
    setPreviewData({ open: true, loading: true, base64: null, filename: null });
    try {
      const response = await fetch(route('admin.grade-reports.preview-sertifikat', scoreId));
      const data = await response.json();
      if (data.success) {
        setPreviewData({
          open: true,
          loading: false,
          base64: data.preview,
          filename: data.filename,
        });
      } else {
        alert('Gagal memuat pratinjau: ' + data.message);
        setPreviewData((prev) => ({ ...prev, open: false, loading: false }));
      }
    } catch (e) {
      alert('Terjadi kesalahan saat memuat pratinjau.');
      setPreviewData((prev) => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleDownloadWord = (scoreId: number) => {
    window.location.href = route('admin.grade-reports.sertifikat-word', scoreId);
  };

  const handleBulkCertificates = () => {
    if (!periodId) return;
    if (confirm('Mulai proses pembuatan sertifikat massal?')) {
      setCertProgress({ status: 'processing', progress: 0, processed: 0, total: 0 });
      router.post(
        route('admin.grade-reports.sertifikat-massal'),
        { period_id: periodId, faculty_id: facultyId || undefined },
        { preserveScroll: true },
      );
    }
  };

    const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

return (
    <AppLayout title="Rekap Nilai">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="py-8 font-sans transition-all">
        {/* Header Sederhana Sesuai Patokan Gold Standard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-emerald-50/50 pb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-emerald-950">Rekapitulasi Nilai.</h1>
            <p className="text-xs text-emerald-950/40 font-black uppercase tracking-widest">
              Pusat pemeriksaan nilai akhir KKN mahasiswa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canExport && (
              <Button
                onClick={() => exportWithPath('ekspor')}
                variant="outline"
                className="h-9 border-emerald-50 text-emerald-950 hover:bg-gray-50 text-xs font-black uppercase tracking-widest px-4"
              >
                <FileSpreadsheet size={16} className="mr-2 opacity-30" /> Ekspor Data
              </Button>
            )}
            {canFinalizeMass && (
              <Button
                onClick={handleBulkFinalize}
                className="h-9 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black uppercase tracking-widest px-4"
              >
                <ShieldCheck size={16} className="mr-2" /> Kunci Massal
              </Button>
            )}
            <div className="relative">
              <Button
                onClick={handleBulkCertificates}
                disabled={certProgress.status === 'processing'}
                className="h-9 bg-emerald-950 hover:bg-black text-white text-xs font-black uppercase tracking-widest px-4"
              >
                {certProgress.status === 'processing' ? (
                  <RefreshCw className="animate-spin mr-2" size={16} />
                ) : (
                  <GraduationCap size={16} className="mr-2" />
                )}
                Cetak Sertifikat
              </Button>
            </div>
          </div>
        </div>

        {/* Statistik Minimalis */}
        {stats && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MiniStat icon={Users} label="Total Peserta" value={stats.total_students} />
            <MiniStat icon={Activity} label="Sudah Dinilai" value={stats.graded_count} />
            <MiniStat icon={Lock} label="Sudah Dikunci" value={stats.locked_count} />
            <MiniStat
              icon={CheckCircle2}
              label="Rerata Nilai"
              value={Number(stats.average_value || 0).toFixed(2)}
              />
              </motion.div>
              )}

        {/* --- DATA TABLE CARD (Gold Standard) --- */}
        <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          {/* Toolbar Toolbar Sederhana Sesuai Patokan */}
          <div className="p-4 border-b border-[#f3f4f6]/50 bg-emerald-50/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-950/20" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Cari NIM atau Nama..."
                className="w-full h-9 pl-9 pr-4 bg-white border border-emerald-50/60 rounded-lg text-xs font-bold text-emerald-950 placeholder:text-black/20 focus:border-[#f3f4f6]0 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={periodId}
                onChange={(e) => {
                  setPeriodId(e.target.value);
                  router.get(
                    route('admin.grade-reports.index'),
                    { period_id: e.target.value },
                    { preserveState: true },
                  );
                }}
                className="h-9 px-3 bg-white border border-emerald-50/60 rounded-lg text-xs font-black text-emerald-950 uppercase tracking-wider outline-none"
              >
                <option value="">Pilih Periode</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                disabled={!!lockedFaculty}
                className="h-9 px-3 bg-white border border-emerald-50/60 rounded-lg text-xs font-black text-emerald-950 uppercase tracking-wider outline-none max-w-[150px]"
              >
                <option value="">Fakultas</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value={huruf}
                onChange={(e) => setHuruf(e.target.value)}
                className="h-9 px-3 bg-white border border-emerald-50/60 rounded-lg text-xs font-black text-emerald-950 uppercase tracking-wider outline-none"
              >
                <option value="">Nilai Huruf</option>
                {['A', 'B', 'C', 'D', 'E'].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => applyFilters()}
                className="h-9 px-4 bg-[#f0fdfa] border border-emerald-50 text-[#0d9488] hover:bg-[#f0fdfa] text-xs font-black uppercase tracking-widest"
              >
                Terapkan
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/20 border-b border-emerald-50/50">
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">
                    Identitas Mahasiswa
                  </th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest">
                    Lokasi & Prodi
                  </th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">
                    Skor Akhir
                  </th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-center">
                    Status Berkas
                  </th>
                  <th className="px-8 py-4 text-xs font-black text-emerald-950 uppercase tracking-widest text-right">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]/60 font-sans">
                {scores?.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-950 uppercase leading-none mb-1.5">
                          {grade.name}
                        </span>
                        <span className="text-xs text-emerald-950/40 font-black tabular-nums tracking-wider uppercase leading-none">
                          NIM: {grade.nim}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-emerald-950/80">
                      <div className="flex flex-col">
                        <span className="uppercase leading-none mb-1.5">{grade.group_name}</span>
                        <span className="text-xs text-emerald-950/40 font-black uppercase tracking-tight">
                          {grade.prodi}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-base font-bold text-emerald-950 tabular-nums leading-none mb-1.5">
                          {Number(grade.final_grade_value || 0).toFixed(2)}
                        </span>
                        <span className="text-[9px] font-black text-white bg-[#0d9488] px-2 py-0.5 rounded shadow-sm">
                          {grade.final_grade_letter || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={clsx(
                          'inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase border transition-all',
                          grade.is_locked
                            ? 'bg-[#f0fdfa] text-[#0d9488] border-emerald-200'
                            : 'bg-white text-emerald-950/10 border-[#f3f4f6]',
                        )}
                      >
                        {grade.is_locked ? 'DIKUNCI' : 'DRAF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        {grade.is_locked && (
                          <>
                            <button
                              onClick={() => handlePreview(grade.score_id!)}
                              className="h-9 w-9 bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-xl shadow-sm transition-all"
                              title="Pratinjau Sertifikat"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadWord(grade.score_id!)}
                              className="h-9 w-9 bg-white text-[#0d9488] hover:bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-xl shadow-sm transition-all"
                              title="Unduh format Word (.docx)"
                            >
                              <Download size={16} />
                            </button>
                            <a
                              href={route('admin.grade-reports.sertifikat', grade.score_id!)}
                              className="h-9 w-9 bg-emerald-600 text-white hover:bg-emerald-800 flex items-center justify-center rounded-xl shadow-sm transition-all"
                              title="Unduh format PDF"
                            >
                              <ShieldCheck size={16} />
                            </a>
                          </>
                        )}
                        {grade.can_finalize && !grade.is_locked && (
                          <button
                            onClick={() => handleFinalize(grade.score_id!)}
                            className="h-9 px-5 bg-[#f0fdfa] text-[#0d9488] hover:bg-[#0d9488] hover:text-white border border-emerald-50 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm transition-all"
                          >
                            Validasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info (Gold Standard) */}
          <div className="px-8 py-4 bg-emerald-50/10 border-t border-[#f3f4f6]/50 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950/20 uppercase tracking-widest leading-none">
              Repositori Nilai | Total {scores?.length || 0} Mahasiswa Terdaftar
            </span>
          </div>
        </div>

        {/* --- PREVIEW MODAL --- */}
        <AnimatePresence>
          {previewData.open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/20 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-emerald-50"
              >
                <div className="px-8 py-6 border-b border-emerald-50 flex items-center justify-between bg-white">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-emerald-950 leading-none mb-1">
                      Pratinjau Otoritas Sertifikat.
                    </h3>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                      {previewData.filename}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setPreviewData({ open: false, loading: false, base64: null, filename: null })
                    }
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-emerald-950 hover:bg-rose-50 hover:text-rose-600 transition-all"
                  >
                    <RefreshCw size={20} className={previewData.loading ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center relative">
                  {previewData.loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                        Menyiapkan Visual...
                      </span>
                    </div>
                  ) : (
                    <iframe
                      src={`data:application/pdf;base64,${previewData.base64}`}
                      className="w-full h-full rounded-lg shadow-inner border border-emerald-100 bg-white"
                      title="Certificate Preview"
                    />
                  )}
                </div>

                <div className="px-8 py-6 bg-emerald-50/10 border-t border-emerald-50 flex justify-end gap-3">
                  <Button
                    onClick={() =>
                      setPreviewData({ open: false, loading: false, base64: null, filename: null })
                    }
                    variant="outline"
                    className="h-11 px-8 text-xs font-black uppercase tracking-widest border-emerald-100 text-emerald-950"
                  >
                    Tutup Audit
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 bg-white border border-emerald-50/60 rounded-xl flex items-center gap-4 shadow-sm group hover:border-emerald-300 transition-all">
      <div className="h-10 w-10 bg-[#f0fdfa] rounded-xl flex items-center justify-center text-[#0d9488] shrink-0 group-hover:rotate-6 transition-transform">
        <Icon size={18} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-widest leading-none mb-1.5">
          {label}
        </span>
        <span className="text-lg font-bold text-emerald-950 tabular-nums leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}
