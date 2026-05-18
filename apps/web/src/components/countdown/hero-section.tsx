'use client';

import { useState, useEffect, useCallback } from 'react';
import { HeroTitle } from '@/components/public/hero-title';
import { HeroCountdown } from '@/components/countdown/hero-countdown';

interface Props {
  title: string;
  subtitle: React.ReactNode;
}

export function HeroSection({ title, subtitle }: Props) {
  const [showCountdown, setShowCountdown] = useState<boolean | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/public/countdown/active`)
      .then(r => r.json())
      .then(res => {
        const items = res?.data || [];
        if (items.length > 0) {
          const end = new Date(items[0].countdown_end).getTime();
          const now = new Date().getTime();
          setShowCountdown(now < end);
        } else {
          setShowCountdown(false);
        }
      })
      .catch(() => setShowCountdown(false));
  }, []);

  // Callback saat countdown selesai — switch ke HeroTitle
  const onCountdownEnd = useCallback(() => {
    setShowCountdown(false);
  }, []);

  if (showCountdown === null) {
    return <HeroTitle title={title} subtitle={subtitle} />;
  }

  if (showCountdown) {
    return <HeroCountdown onEnd={onCountdownEnd} />;
  }

  return <HeroTitle title={title} subtitle={subtitle} />;
}
