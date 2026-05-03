import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import type { PageProps } from '@/types';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Target,
  BrainCircuit,
  Image as ImageIcon
} from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';
import StatusTag from '@/Components/Premium/StatusTag';

interface Props extends PageProps {
  report: {
    id: number;
    title: string;
    activity: string;
    reflection: string;
    social_media_link?: string;
    abcd_stage?: string;
    formatted_date: string;
    status: string;
    status_label: string;
    status_color: 'amber' | 'emerald' | 'rose' | 'slate';
    ai_summary?: string;
    ai_analysis?: {
      sentiment?: string;
      key_points?: string[];
      flags?: string[];
    };
    student: {
      name: string;
      nim: string;
      prodi: string;
      fakultas: string;
    };
    group: {
      name: string;
      location: string;
    };
    files: Array<{
      id: number;
      file_path: string;
      file_type: string;
      original_name: string;
    }>;
    review: {
      reviewer_name: string;
      notes?: string;
      reviewed_at?: string;
    };
    location_metadata: {
      latitude?: string;
      longitude?: string;
      gps_accuracy?: string;
      location_name?: string;
      captured_at?: string;
    };
  };
}

export default function AdminDailyReportShow({ report }: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <AppLayout title="Detail Laporan Harian">
      <Head title={`Laporan Harian: ${report.student.name} | SIBERMAS`} />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-6">
          <Link
            href="/admin/laporan/harian"
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-900/60 hover:text-emerald-950 transition-colors w-fit bg-white px-4 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft size={14} />
            Kembali ke Daftar Laporan
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <PageHeader
              title="Detail Logbook Harian."
              subtitle={`Laporan aktivitas dari ${report.student.name} pada ${report.formatted_date}`}
              icon={Activity}
              groupLabel="Monitoring & Evaluasi"
            />
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end min-w-[200px]">
              <span className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-2">Status Audit</span>
              <StatusTag
                status={report.status_color === 'emerald' ? 'active' : report.status_color === 'rose' ? 'error' : report.status_color === 'amber' ? 'pending' : 'draft'}
                label={report.status_label}
              />
              {report.review?.reviewed_at && (
                <span className="text-[9px] font-bold text-gray-400 mt-3 tabular-nums tracking-widest">
                  Diperiksa: {report.review.reviewed_at}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            <motion.div variants={itemVariants}>
              <ContentPanel
                title="Isi Kegiatan"
                description="Penjelasan tentang apa yang dilakukan mahasiswa hari ini."
                icon={FileText}
                padding={false}
              >
                <div className="p-6 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-emerald-950 leading-tight">
                      {report.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                        <Calendar size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">{report.formatted_date}</span>
                      </div>
                      {report.abcd_stage && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                          <Target size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{report.abcd_stage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest border-b border-gray-100 pb-2">
                      Uraian Kegiatan
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {report.activity}
                    </p>
                  </div>

                  {report.reflection && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest border-b border-gray-100 pb-2">
                        Refleksi / Kesimpulan Belajar
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic bg-gray-50 p-4 rounded-xl">
                        {report.reflection}
                      </p>
                    </div>
                  )}

                  {report.social_media_link && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest border-b border-gray-100 pb-2">
                        Link Media Sosial (Publikasi)
                      </h4>
                      <a href={report.social_media_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-xs font-bold w-fit">
                        <ExternalLink size={14} />
                        {report.social_media_link}
                      </a>
                    </div>
                  )}
                </div>
              </ContentPanel>
            </motion.div>

            {/* AI ANALYSIS PANEL */}
            {report.ai_summary && (
              <motion.div variants={itemVariants}>
                <ContentPanel
                  title="Pengecekan Otomatis (Oleh AI)"
                  description="Ringkasan pintar dan pendeteksian masalah oleh sistem SIBERMAS."
                  icon={BrainCircuit}
                  padding={false}
                >
                  <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-indigo-900/60 uppercase tracking-widest">
                        Ringkasan Laporan
                      </h4>
                      <p className="text-sm text-indigo-950 font-medium leading-relaxed">
                        {report.ai_summary}
                      </p>
                    </div>
                    
                    {report.ai_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.ai_analysis.key_points && report.ai_analysis.key_points.length > 0 && (
                          <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <CheckCircle size={12} className="text-emerald-500" /> Poin Penting
                            </h5>
                            <ul className="space-y-2">
                              {report.ai_analysis.key_points.map((point, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.ai_analysis.flags && report.ai_analysis.flags.length > 0 && (
                          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                            <h5 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <XCircle size={12} className="text-rose-500" /> Peringatan / Celah
                            </h5>
                            <ul className="space-y-2">
                              {report.ai_analysis.flags.map((flag, i) => (
                                <li key={i} className="text-xs text-rose-700 font-bold flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ContentPanel>
              </motion.div>
            )}

            {/* ATTACHMENTS */}
            {report.files && report.files.length > 0 && (
              <motion.div variants={itemVariants}>
                <ContentPanel
                  title="Foto Kegiatan"
                  description="Foto-foto bukti yang dikirim oleh mahasiswa."
                  icon={ImageIcon}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {report.files.map((file) => (
                      <a
                        key={file.id}
                        href={`/storage/${file.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-emerald-400 transition-all text-center aspect-square"
                      >
                        <ImageIcon size={32} className="text-emerald-900/40 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest leading-tight break-all line-clamp-2">
                          {file.original_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </ContentPanel>
              </motion.div>
            )}

          </div>

          {/* RIGHT COLUMN - Metadata */}
          <div className="space-y-8">
            <motion.div variants={itemVariants}>
              <ContentPanel
                title="Data Mahasiswa"
                description="Pengirim laporan harian ini."
                icon={User}
                padding={false}
              >
                <div className="p-6 space-y-4">
                  <div>
                    <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Nama Lengkap</span>
                    <span className="block text-sm font-black text-emerald-950">{report.student.name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">NIM</span>
                    <span className="block text-sm font-mono font-bold text-emerald-700">{report.student.nim}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Fakultas / Prodi</span>
                    <span className="block text-xs font-bold text-gray-700">{report.student.fakultas} <br/> <span className="text-gray-500 font-normal">{report.student.prodi}</span></span>
                  </div>
                </div>
              </ContentPanel>
            </motion.div>

            <motion.div variants={itemVariants}>
              <ContentPanel
                title="Lokasi KKN"
                description="Tempat mahasiswa ditugaskan."
                icon={Users}
                padding={false}
              >
                <div className="p-6 space-y-4">
                  <div>
                    <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Nama Kelompok</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                      <Users size={12} />
                      <span className="text-[11px] font-black uppercase tracking-tight">{report.group.name}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Alamat Posko</span>
                    <span className="block text-xs font-bold text-gray-700 flex items-start gap-2">
                      <MapPin size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                      {report.group.location}
                    </span>
                  </div>
                </div>
              </ContentPanel>
            </motion.div>

            {(report.location_metadata?.latitude || report.location_metadata?.location_name) && (
              <motion.div variants={itemVariants}>
                <ContentPanel
                  title="Lokasi & Waktu Laporan"
                  description="Data pelacakan GPS dari HP mahasiswa saat mengirim laporan."
                  icon={MapPin}
                  padding={false}
                >
                  <div className="p-6 space-y-4">
                    {report.location_metadata.location_name && (
                      <div>
                        <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Lokasi Terdeteksi</span>
                        <span className="block text-xs font-bold text-gray-700">{report.location_metadata.location_name}</span>
                      </div>
                    )}
                    {report.location_metadata.latitude && report.location_metadata.longitude && (
                      <div>
                        <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Titik GPS (Satelit)</span>
                        <span className="block text-xs font-mono text-emerald-700">{report.location_metadata.latitude}, {report.location_metadata.longitude}</span>
                      </div>
                    )}
                    {report.location_metadata.captured_at && (
                      <div>
                        <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Waktu Dikirim</span>
                        <span className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-400" />
                          {report.location_metadata.captured_at}
                        </span>
                      </div>
                    )}
                  </div>
                </ContentPanel>
              </motion.div>
            )}

            {report.review && (report.review.notes || report.review.reviewed_at) && (
              <motion.div variants={itemVariants}>
                <ContentPanel
                  title="Catatan dari Dosen (DPL)"
                  description="Pesan dan penilaian dari dosen pembimbing."
                  icon={ShieldCheck}
                  padding={false}
                >
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Pemeriksa</span>
                      <span className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <User size={12} className="text-emerald-600" />
                        {report.review.reviewer_name}
                      </span>
                    </div>
                    {report.review.notes && (
                      <div>
                        <span className="block text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-2">Pesan Untuk Mahasiswa</span>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-900 leading-relaxed italic">
                          "{report.review.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </ContentPanel>
              </motion.div>
            )}

          </div>

        </div>
      </motion.div>
    </AppLayout>
  );
}
