'use client';

import dynamic from 'next/dynamic';

const CountdownPopup = dynamic(
  () => import('@/components/countdown/countdown-popup').then(m => ({ default: m.CountdownPopup })),
  { ssr: false }
);

export function CountdownPopupWrapper() {
  return <CountdownPopup />;
}
