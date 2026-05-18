'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RegistrationCountdown } from '@/components/countdown/registration-countdown';

interface ActiveCountdown {
  id: number;
  enabled: boolean;
  title: string;
  subtitle: string | null;
  countdown_start: string;
  countdown_end: string;
  display_location: string;
  style: string;
}

export function CountdownPopup() {
  const [countdown, setCountdown] = useState<ActiveCountdown | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Cek apakah sudah ditutup di session ini
    if (sessionStorage.getItem('countdown_popup_dismissed')) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/public/countdown/active`)
      .then(r => r.json())
      .then(res => {
        const items: ActiveCountdown[] = res?.data || [];
        const match = items.find(c => c.enabled);
        if (match) {
          // Cek apakah countdown masih aktif (belum lewat target)
          const now = new Date().getTime();
          const end = new Date(match.countdown_end).getTime();
          const start = match.countdown_start ? new Date(match.countdown_start).getTime() : end - (24 * 60 * 60 * 1000);
          if (now >= start && now < end) {
            setCountdown(match);
            setVisible(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('countdown_popup_dismissed', '1');
  };

  if (!visible || !countdown) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={dismiss}
      />

      {/* Popup */}
      <div className="relative w-full max-w-2xl animate-in zoom-in-95 fade-in duration-300">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute -top-3 -right-3 z-10 h-8 w-8 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={16} className="text-slate-600" />
        </button>

        {/* Countdown content */}
        <RegistrationCountdown
          targetDate={countdown.countdown_end}
          title={countdown.title}
          subtitle={countdown.subtitle || undefined}
        />

        {/* Dismiss hint */}
        <p className="text-center text-white/70 text-xs mt-4 font-medium">
          Klik di luar atau &times; untuk menutup
        </p>
      </div>
    </div>
  );
}
