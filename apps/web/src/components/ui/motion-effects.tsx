'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  once?: boolean;
}

/**
 * RevealOnScroll — Elemen muncul secara dramatis saat masuk ke viewport.
 * Menggunakan Framer Motion useInView untuk performa optimal.
 */
export function RevealOnScroll({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.7,
  once = true,
}: RevealOnScrollProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-80px' });

  const directionOffset = {
    up: { y: 60 },
    down: { y: -60 },
    left: { x: 60 },
    right: { x: -60 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0,
      } : {}}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

/**
 * StaggerContainer — Anak-anaknya muncul satu per satu secara berseri.
 * Bungkus elemen-elemen StaggerItem di dalam ini.
 */
export function StaggerContainer({
  children,
  className = '',
  stagger = 0.1,
  delay = 0,
}: StaggerContainerProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * GlowCard — Kartu dengan efek pendaran cahaya (glow) yang mengikuti kursor.
 * Terinspirasi dari Aceternity UI.
 */
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.15)',
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const lastMove = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastMove.current < 16) return; // ~60fps throttle
    lastMove.current = now;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className={`relative overflow-hidden isolate ${className}`}
    >

      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

/**
 * CountUp — Angka yang berjalan naik dari 0 saat masuk viewport.
 * Untuk menambahkan kesan dinamis pada bagian statistik.
 */
export function CountUp({
  end,
  duration = 2,
  className = '',
  suffix = '',
  prefix = '',
}: {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('id-ID')}{suffix}
    </span>
  );
}

/**
 * TextReveal — Teks muncul kata per kata dengan efek fade-in saat di-scroll.
 */
export function TextReveal({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}): React.JSX.Element {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const words = text.split(' ');

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

/**
 * ParallaxSection — Elemen dengan efek parallax yang dioptimalkan tanpa GSAP.
 * Elemen bergerak lebih lambat dari scroll untuk efek kedalaman.
 */
export function ParallaxSection({
  children,
  speed = 0.5,
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      setOffset((elementCenter - viewportCenter) * speed * 0.1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      <div style={{ transform: `translateY(${offset}px)` }}>
        {children}
      </div>
    </div>
  );
}

interface MagneticProps {
  children: React.ReactElement;
  range?: number;
  strength?: number;
}

/**
 * Magnetic — Membungkus tombol untuk efek tarikan magnetik yang realistis.
 * Menggunakan useSpring untuk redaman elastis saat kursor mendekat.
 */
export function Magnetic({ children, range = 35, strength = 0.35 }: MagneticProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 18 });
  const springY = useSpring(y, { stiffness: 120, damping: 18 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;
      const distance = Math.hypot(distanceX, distanceY);
      
      if (distance < range) {
        x.set(distanceX * strength);
        y.set(distanceY * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [range, strength, x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
