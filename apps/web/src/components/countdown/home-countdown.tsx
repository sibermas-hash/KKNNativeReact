'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const RegistrationCountdown = dynamic(
  () => import('@/components/countdown/registration-countdown').then(m => ({ default: m.RegistrationCountdown })),
  { ssr: false }
);

interface ActiveCountdown {
  id: number;
  enabled: boolean;
  title: string;
  subtitle: string | null;
  countdown_start: string;
  countdown_end: string;
  display_location: string;
  style: string;
  periode?: { name: string };
}

export function HomeCountdown() {
  const [countdown, setCountdown] = useState<ActiveCountdown | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/public/countdown/active`)
      .then(r => r.json())
      .then(res => {
        const items: ActiveCountdown[] = res?.data || [];
        // Pick first active countdown that shows on home
        const match = items.find(c => c.display_location === 'home' || c.display_location === 'both');
        if (match) setCountdown(match);
      })
      .catch(() => {});
  }, []);

  if (!countdown) return null;

  return (
    <section className="relative z-10 -mt-24 px-4 pb-12">
      <RegistrationCountdown
        targetDate={countdown.countdown_end}
        title={countdown.title}
        subtitle={countdown.subtitle || undefined}
      />
    </section>
  );
}
