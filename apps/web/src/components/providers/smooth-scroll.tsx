'use client';

import { useEffect, useRef } from 'react';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const lenisRef = useRef<{ raf: (time: number) => void; destroy: () => void } | null>(null);

  useEffect(() => {
    let animationId: number;

    const initLenis = async () => {
      try {
        const Lenis = (await import('lenis')).default;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          touchMultiplier: 2,
          infinite: false,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
          lenis.raf(time);
          animationId = requestAnimationFrame(raf);
        }
        animationId = requestAnimationFrame(raf);
      } catch {
        // Lenis not installed, gracefully degrade
      }
    };

    initLenis();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      lenisRef.current?.destroy();
    };
  }, []);

  return <>{children}</>;
}
