// apps/web/src/components/layout/ornaments.tsx
// Per-theme decorative primitives. All colors read theme tokens.
import * as React from "react";
import { cn } from "@/lib/utils";

/** 8-point Islamic-style star (Akademik). */
export function StarOrnament({
  size = 72,
  className,
  color = "var(--profile-accent)",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  const n = 8;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const ang = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 === 0 ? 48 : 20;
    pts.push(
      (50 + r * Math.cos(ang)).toFixed(1) +
        "," +
        (50 + r * Math.sin(ang)).toFixed(1),
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <polygon points={pts.join(" ")} fill={color} opacity={0.85} />
      <circle cx={50} cy={50} r={13} fill="var(--profile-surface)" />
    </svg>
  );
}

/** Simple leaf glyph (Nusantara / Sustainability). */
export function LeafIcon({
  size = 16,
  className,
  color = "currentColor",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path d="M12 2C7 7 4 11 4 15a8 8 0 0 0 16 0c0-4-3-8-8-13z" fill={color} />
    </svg>
  );
}

/** Row of batik-style diamonds (Nusantara hero). Inherits current text color. */
export function BatikDiamonds({
  count = 14,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-3 w-3 rotate-45 border border-current"
        />
      ))}
    </div>
  );
}

/** Large blurred colored orbs behind glass surfaces (Professional). */
export function Orbs({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute -left-24 -top-24 h-[440px] w-[440px] rounded-full blur-3xl"
        style={{ background: "var(--profile-primary)", opacity: 0.3 }}
      />
      <div
        className="absolute -right-10 top-8 h-[460px] w-[460px] rounded-full blur-3xl"
        style={{ background: "var(--profile-accent)", opacity: 0.26 }}
      />
      <div
        className="absolute bottom-[-120px] left-1/3 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{ background: "var(--profile-primary-hover)", opacity: 0.24 }}
      />
    </div>
  );
}
