// apps/web/src/components/charts/donut-chart.tsx
import * as React from "react";

export type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({
  segments,
  size = 132,
  thickness = 16,
  centerLabel,
  centerSub,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--profile-surface-strong)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const len = (circ * s.value) / total;
          const node = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return node;
        })}
      </g>
      {centerLabel ? (
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.16}
          fontWeight={700}
          fill="var(--profile-text)"
          style={{ fontFamily: "var(--profile-font-heading)" }}
        >
          {centerLabel}
        </text>
      ) : null}
      {centerSub ? (
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.085}
          fill="var(--profile-muted)"
        >
          {centerSub}
        </text>
      ) : null}
    </svg>
  );
}
