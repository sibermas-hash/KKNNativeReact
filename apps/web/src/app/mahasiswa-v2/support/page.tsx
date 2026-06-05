'use client';

import React from 'react';
import { HelpCircle, MessageCircle, Book, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS } from '@/lib/theme-config';

export default function SupportPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight">Pusat Bantuan SIBERMAS</h1>
        <p className="text-[color:var(--profile-muted)] font-medium">Hubungi tim dukungan teknis jika Anda mengalami kendala pada sistem SIBERMAS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Helpdesk WhatsApp Card */}
        <div 
          className={`border p-6 flex flex-col h-full ${surfaceClass} ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[color:var(--profile-text)]">Helpdesk SIBERMAS</h2>
              <p className="text-sm text-[color:var(--profile-muted)] font-medium">Respons cepat untuk kendala teknis</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-sm text-[color:var(--profile-text)] font-semibold">
            <p>Grup ini khusus melayani:</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><span className="text-emerald-500">✅</span> Kendala teknis aplikasi (error, login)</li>
              <li className="flex gap-2"><span className="text-emerald-500">✅</span> Pertanyaan sistem pendaftaran</li>
              <li className="flex gap-2"><span className="text-emerald-500">✅</span> Masalah sinkronisasi SIAKAD</li>
              <li className="flex gap-2"><span className="text-rose-500">❌</span> Urusan akademik/nilai (hubungi DPL)</li>
            </ul>
            <div className="mt-4 p-3 bg-[color:var(--profile-soft)] rounded-xl text-xs text-[color:var(--profile-muted)] font-bold border border-[color:var(--profile-border)]">
              <span className="font-black block mb-1 uppercase tracking-wider text-[color:var(--profile-primary)]">Format Bertanya:</span>
              Nama | NIM | Keluhan/Pertanyaan | (Sertakan Screenshot)
            </div>
          </div>

          <a 
            href="https://t.me/Sibermas58"
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${PRIMARY_CLASS}`}
          >
            Chat Admin via Telegram <ExternalLink size={16} />
          </a>
        </div>

        {/* Live Chat System (Coming Soon) */}
        <div 
          className={`border p-6 flex flex-col h-full opacity-90 ${surfaceClass} ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-[color:var(--profile-soft)] flex items-center justify-center text-[color:var(--profile-primary)] shrink-0 border border-[color:var(--profile-border)]">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[color:var(--profile-text)]">Live Chat SIBERMAS</h2>
              <p className="text-sm text-[color:var(--profile-muted)] font-medium">Dialihkan ke Telegram</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[color:var(--profile-soft)] rounded-xl border border-dashed border-[color:var(--profile-border)]">
            <ShieldAlert size={32} className="text-[color:var(--profile-muted)] mb-3" />
            <h3 className="font-bold text-[color:var(--profile-text)] mb-1">Sedang Dalam Pengembangan</h3>
            <p className="text-xs text-[color:var(--profile-muted)] font-medium">Sistem chat internal sudah dialihkan ke Telegram. Silakan hubungi admin melalui tombol Telegram.</p>
          </div>

          <Link 
            href="https://t.me/Sibermas58" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${SOFT_CLASS}`}
          >
            Buka Telegram Admin
          </Link>
        </div>
      </div>

      <div 
        className={`border p-6 ${surfaceClass} ${themeConfig.shadow}`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <h3 className="font-black text-[color:var(--profile-text)] mb-2 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Book size={18} className="text-[color:var(--profile-primary)]" />
          Sebelum Bertanya
        </h3>
        <p className="text-sm text-[color:var(--profile-muted)] mb-4 font-semibold">
          Sebagian besar pertanyaan teknis sudah terjawab di buku panduan. Pastikan Anda telah membaca panduan resmi penggunaan SIBERMAS KKN sebelum menghubungi tim bantuan.
        </p>
        <button className="text-sm font-black text-[color:var(--profile-primary)] hover:underline uppercase tracking-wider">
          Unduh Panduan SIBERMAS (PDF)
        </button>
      </div>
    </div>
  );
}
