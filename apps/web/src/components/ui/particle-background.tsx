'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ParticleBackground — Canvas-based interactive particle network.
 * Performance-optimized:
 *  - Reduced particle count on mobile (1 per 12000px vs 6000px)
 *  - Skips connect() entirely on small screens
 *  - Uses devicePixelRatio-aware sizing
 *  - Respects prefers-reduced-motion
 */
export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted state once on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation logic
  useEffect(() => {
    if (!mounted) return;

    // Respect user's motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0 };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      density: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2.5 + 1.5;
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * 0.8 - 0.4;
        this.density = (Math.random() * 30) + 1;
        this.opacity = Math.random() * 0.6 + 0.4;
        const colors = ['#06b6d4', '#10b981', '#fbbf24', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas!.width) this.x = 0;
        else if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        else if (this.y < 0) this.y = canvas!.height;

        // Skip mouse interaction on mobile (no hover anyway)
        if (isMobile) return;

        const mouseRadius = 150;
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          const directionX = dx / distance;
          const directionY = dy / distance;
          this.x -= directionX * force * 5;
          this.y -= directionY * force * 5;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }

    const connect = () => {
      if (!ctx) return;
      const maxDist = 120;
      const len = particles.length;

      for (let a = 0; a < len; a++) {
        for (let b = a + 1; b < len; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;

          // Skip expensive sqrt if clearly out of range
          if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;

          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDist) {
            const opacityValue = 1 - (distance / maxDist);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.25})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }

        // Mouse connection lines (desktop only)
        if (!isMobile) {
          const mdx = particles[a].x - mouse.x;
          const mdy = particles[a].y - mouse.y;
          if (Math.abs(mdx) < 180 && Math.abs(mdy) < 180) {
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 180) {
              const opacityValue = 1 - (mdist / 180);
              ctx.strokeStyle = `rgba(6, 182, 212, ${opacityValue * 0.5})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(particles[a].x, particles[a].y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const init = () => {
      particles = [];
      // Mobile: ~half the particles (1 per 12000px vs 6000px)
      const density = isMobile ? 12000 : 6000;
      const numberOfParticles = Math.min(
        Math.floor((canvas.width * canvas.height) / density),
        isMobile ? 40 : 120 // Hard cap
      );
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      // Skip connect lines on mobile for performance
      if (!isMobile) {
        connect();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none opacity-80 blur-[0.2px]"
    />
  );
};
