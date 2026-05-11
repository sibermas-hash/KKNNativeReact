import type { Metadata } from 'next';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { MessageCircle, HelpCircle, ShieldAlert, Book, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pusat Bantuan — SIBERMAS UIN SAIZU',
  description: 'Pusat Bantuan dan Layanan Mahasiswa SIBERMAS KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar overlayNav={false} />

      <main className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Layanan Mahasiswa</p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Pusat Bantuan SIBERMAS
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Kami siap membantu! Sampaikan keluhan teknis, diskusikan kendala sistem, dan pastikan pengalaman pendaftaran KKN Anda berjalan lancar tanpa hambatan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Helpdesk WhatsApp Card */}
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-6 shadow-[0_12px_35px_rgba(6,78,59,0.04)] flex flex-col h-full hover:shadow-[0_18px_50px_rgba(6,78,59,0.08)] transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <MessageCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-emerald-950">Helpdesk WhatsApp</h2>
                <p className="text-sm text-slate-500">Respons cepat (Jam Kerja)</p>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 text-sm text-slate-600">
              <p className="font-semibold text-emerald-900">Apa yang bisa kami bantu di grup ini?</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✅</span> 
                  <span><strong>Bantuan Teknis:</strong> Error aplikasi, gagal login, atau lupa password.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✅</span> 
                  <span><strong>Panduan Sistem:</strong> Kebingungan alur pendaftaran KKN di SIBERMAS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✅</span> 
                  <span><strong>Sinkronisasi SIAKAD:</strong> Data akademik tidak sesuai atau gagal ditarik.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">❌</span> 
                  <span className="text-rose-900/80"><strong>Bukan untuk Nilai:</strong> Urusan akademik/penilaian KKN wajib ke DPL.</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-bold block mb-1 text-emerald-950">Format Bertanya yang Baik:</span>
                <code>Nama | NIM | Keluhan/Pertanyaan</code>
                <span className="block mt-1 text-slate-500 italic">Sertakan Screenshot/Foto masalah jika ada.</span>
              </div>
            </div>

            <a 
              href="https://chat.whatsapp.com/BETotRSgFDGJ67FF1ScBcu"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide transition-colors shadow-sm"
            >
              Gabung Grup WhatsApp <ExternalLink size={18} />
            </a>
          </div>

          {/* Live Chat System (Coming Soon) */}
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/50 p-6 shadow-sm flex flex-col h-full opacity-70">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <HelpCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-700">Live Chat App</h2>
                <p className="text-sm text-slate-500">Tertanam di SIBERMAS</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-2xl border border-dashed border-emerald-200/60 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShieldAlert size={40} className="text-emerald-300 mb-4 relative z-10" />
              <h3 className="font-bold text-emerald-900 mb-2 relative z-10">Segera Hadir: Live Chat SIBERMAS</h3>
              <p className="text-sm text-slate-500 leading-relaxed relative z-10">
                Pengalaman konsultasi yang lebih personal sedang kami racik! Ke depannya, Anda tidak perlu pindah aplikasi—langsung <i>chatting</i> dengan Admin secara <i>real-time</i> dari dalam dashboard SIBERMAS.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ / Panduan Section */}
        <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50/30 p-8">
          <h3 className="text-lg font-display font-bold text-emerald-950 mb-3 flex items-center gap-2">
            <Book size={20} className="text-emerald-600" />
            Sebelum Menghubungi Helpdesk
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-5 max-w-3xl">
            Sebagian besar pertanyaan teknis seputar pendaftaran, pemilihan kelompok, dan pelaporan KKN sudah terjawab di Buku Panduan Resmi SIBERMAS. Pastikan Anda telah membaca panduan tersebut sebelum bertanya di grup.
          </p>
          <a href="/unduhan" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Lihat Buku Panduan Penggunaan SIBERMAS (PDF) →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
