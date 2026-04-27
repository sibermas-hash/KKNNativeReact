import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, Calendar, FileCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface WorkshopCertificate {
  id: number;
  workshop_name: string;
  workshop_date: string;
  certificate_issued_at: string;
  certificate_url: string | null;
}

interface Props {
  certificates: WorkshopCertificate[];
}

export default function WorkshopCertificates({ certificates }: Props) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout title="Sertifikat Workshop">
      <Head title="Sertifikat Workshop" />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-emerald-900">Sertifikat Workshop</h1>
          <p className="text-sm text-emerald-700 mt-1">
            Daftar sertifikat Workshop yang telah Anda ikuti
          </p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-white border border-emerald-50 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">Belum Ada Sertifikat</h3>
            <p className="text-sm text-emerald-600">
              Anda belum memiliki sertifikat Workshop. Ikuti Workshop untuk mendapatkan sertifikat.
            </p>
            <a
              href={
                certificates.length > 0
                  ? '#'
                  : window.location.pathname.startsWith('/dosen')
                    ? '/dosen/workshops'
                    : '/mahasiswa/workshops'
              }
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Lihat Workshop
            </a>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                variants={itemVariants}
                className="bg-white border border-emerald-50 rounded-xl p-6 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <Award size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900">{cert.workshop_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-emerald-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {cert.workshop_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileCheck size={14} />
                          Diterbitkan: {cert.certificate_issued_at}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {cert.certificate_url ? (
                      <a
                        href={cert.certificate_url}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <Download size={16} />
                        Unduh Sertifikat
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                        <Clock size={16} />
                        Menunggu
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
