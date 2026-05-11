import React from 'react';
import { HelpCircle, MessageCircle, AlertTriangle, Book, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight">Pusat Bantuan SIBERMAS</h1>
        <p className="text-[color:var(--profile-muted)]">Hubungi tim dukungan teknis jika Anda mengalami kendala pada sistem SIBERMAS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Helpdesk WhatsApp Card */}
        <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[color:var(--profile-text)]">Helpdesk WhatsApp</h2>
              <p className="text-sm text-[color:var(--profile-muted)]">Respons cepat untuk kendala teknis</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-sm text-[color:var(--profile-text)]">
            <p>Grup ini khusus melayani:</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-green-500">✅</span> Kendala teknis aplikasi (error, login)</li>
              <li className="flex gap-2"><span className="text-green-500">✅</span> Pertanyaan sistem pendaftaran</li>
              <li className="flex gap-2"><span className="text-green-500">✅</span> Masalah sinkronisasi SIAKAD</li>
              <li className="flex gap-2"><span className="text-red-500">❌</span> Urusan akademik/nilai (hubungi DPL)</li>
            </ul>
            <div className="mt-4 p-3 bg-[color:var(--profile-soft)] rounded-lg text-xs text-[color:var(--profile-muted)]">
              <span className="font-bold block mb-1">Format Bertanya:</span>
              Nama | NIM | Keluhan/Pertanyaan | (Sertakan Screenshot)
            </div>
          </div>

          <a 
            href="https://chat.whatsapp.com/BETotRSgFDGJ67FF1ScBcu"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors"
          >
            Gabung Grup WhatsApp <ExternalLink size={16} />
          </a>
        </div>

        {/* Live Chat System (Coming Soon) */}
        <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-6 shadow-sm flex flex-col h-full opacity-80">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-[color:var(--profile-soft)] flex items-center justify-center text-[color:var(--profile-primary)] shrink-0">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[color:var(--profile-text)]">Live Chat SIBERMAS</h2>
              <p className="text-sm text-[color:var(--profile-muted)]">Chat langsung di dalam aplikasi</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[color:var(--profile-soft)] rounded-xl border border-dashed border-[color:var(--profile-border)]">
            <ShieldAlert size={32} className="text-[color:var(--profile-muted)] mb-3" />
            <h3 className="font-bold text-[color:var(--profile-text)] mb-1">Sedang Dalam Pengembangan</h3>
            <p className="text-xs text-[color:var(--profile-muted)]">Sistem chat terintegrasi sedang dibangun. Untuk sementara waktu, silakan gunakan fasilitas Helpdesk WhatsApp.</p>
          </div>

          <Link href="/mahasiswa/chat" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[color:var(--profile-soft)] text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] border border-[color:var(--profile-border)] font-bold transition-colors">
            Lihat Modul Chat Admin
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] p-6 shadow-sm">
        <h3 className="font-bold text-[color:var(--profile-text)] mb-2 flex items-center gap-2">
          <Book size={18} className="text-[color:var(--profile-primary)]" />
          Sebelum Bertanya
        </h3>
        <p className="text-sm text-[color:var(--profile-muted)] mb-4">
          Sebagian besar pertanyaan teknis sudah terjawab di buku panduan. Pastikan Anda telah membaca panduan resmi penggunaan SIBERMAS KKN sebelum menghubungi tim bantuan.
        </p>
        <button className="text-sm font-bold text-[color:var(--profile-primary)] hover:underline">
          Unduh Panduan SIBERMAS (PDF)
        </button>
      </div>
    </div>
  );
}
