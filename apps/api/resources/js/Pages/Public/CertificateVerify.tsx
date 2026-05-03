import { Head, Link } from '@inertiajs/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  FileSignature,
  School,
  ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';

interface CertificateData {
  id: number;
  certificate_number: string;
  nama_mahasiswa: string;
  nim: string;
  nama_prodi: string;
  nama_fakultas: string;
  lokasi_kkn: string;
  letter_grade: string;
  issued_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  periode?: {
    name: string;
  };
}

interface Props {
  sertifikat: CertificateData | null;
  token: string;
}

export default function CertificateVerify({ sertifikat, token }: Props) {
  const isFound = !!sertifikat;
  const isRevoked = isFound && sertifikat.revoked_at !== null;
  const isValid = isFound && !isRevoked;

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col font-sans text-gray-800 selection:bg-emerald-200">
      <Head title="Verifikasi Sertifikat KKN | UIN SAIZU" />

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Award size={24} className="text-[#0d9488]" />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-wide"><span className="text-sky-400">SIBER</span><span className="text-emerald-400">MAS</span></h1>
              <p className="text-emerald-200 text-[10px] uppercase tracking-widest font-bold">Verifikasi Elektronik</p>
            </div>
          </div>
          <Link href="/" className="text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/20">
            
            {/* Status Banner */}
            <div className={clsx(
              "p-8 sm:p-10 text-center relative overflow-hidden",
              isValid ? "bg-gradient-to-b from-emerald-50 to-white" :
              isRevoked ? "bg-gradient-to-b from-rose-50 to-white" :
              "bg-gradient-to-b from-gray-50 to-white"
            )}>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white shadow-xl mb-6">
                  {isValid ? (
                    <ShieldCheck size={48} className="text-[#0d9488]" />
                  ) : isRevoked ? (
                    <ShieldAlert size={48} className="text-rose-600" />
                  ) : (
                    <ShieldAlert size={48} className="text-gray-400" />
                  )}
                </div>
                
                <h2 className={clsx(
                  "text-2xl sm:text-3xl font-black tracking-tight mb-2",
                  isValid ? "text-emerald-950" :
                  isRevoked ? "text-rose-950" :
                  "text-gray-900"
                )}>
                  {isValid ? 'Sertifikat Valid' : 
                   isRevoked ? 'Sertifikat Dicabut' : 
                   'Sertifikat Tidak Ditemukan'}
                </h2>
                
                <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
                  {isValid ? 'Dokumen ini adalah sertifikat resmi yang dikeluarkan oleh LPPM UIN Prof. K.H. Saifuddin Zuhri.' : 
                   isRevoked ? 'Sertifikat ini telah dibatalkan atau dicabut oleh administrator sistem.' : 
                   'Maaf, token verifikasi tidak cocok dengan dokumen apapun di dalam pangkalan data kami.'}
                </p>
              </div>

              {/* Decorative Background */}
              {isValid && (
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                  <Award size={400} className="absolute -top-20 -right-20 text-[#0d9488] rotate-12" />
                </div>
              )}
            </div>

            {/* Certificate Details */}
            {isFound && (
              <div className="p-8 sm:p-10 border-t border-gray-100">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nomor Sertifikat</label>
                    <div className="flex items-center gap-2">
                      <FileSignature size={16} className="text-emerald-600" />
                      <span className="text-sm font-mono font-bold text-gray-900">{sertifikat.certificate_number}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nama Mahasiswa</label>
                      <span className="text-base font-bold text-gray-900 block">{sertifikat.nama_mahasiswa}</span>
                      <span className="text-xs font-medium text-gray-500 block mt-0.5">NIM. {sertifikat.nim}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Program Studi</label>
                      <span className="text-sm font-bold text-gray-800 block">{sertifikat.nama_prodi || '-'}</span>
                      <span className="text-xs font-medium text-gray-500 block mt-0.5">{sertifikat.nama_fakultas || '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Lokasi KKN</label>
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-gray-800 leading-snug">{sertifikat.lokasi_kkn || '-'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Periode Pelaksanaan</label>
                      <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-gray-800 leading-snug">{sertifikat.periode?.name || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Predikat / Nilai</label>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-lg">
                        {sertifikat.letter_grade}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tanggal Penerbitan</label>
                      <span className="text-sm font-bold text-gray-800 block">
                        {new Date(sertifikat.issued_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {isRevoked && (
                    <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                      <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-widest mb-1">Alasan Pencabutan</h4>
                        <p className="text-sm text-rose-800 font-medium leading-relaxed">
                          {sertifikat.revoke_reason || 'Tidak ada alasan yang diberikan.'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} className={isValid ? "text-emerald-500" : "text-gray-300"} />
                Data di atas ditarik langsung dari pangkalan data UIN SAIZU
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
