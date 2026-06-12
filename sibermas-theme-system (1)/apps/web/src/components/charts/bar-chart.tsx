// apps/web/src/components/charts/bar-chart.tsx
import * as React from "react";

export function BarChart({
  data,
  height = 120,
  colors = ["var(--profile-primary)", "var(--profile-accent)"],
  labels,
}: {
  data: number[];
  height?: number;
  colors?: string[];
  labels?: string[];
}) {
  const mx = Math.max(...data) || 1;
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-md transition-all"
            style={{
              height: `${(v / mx) * 100}%`,
              background: colors[i % colors.length],
            }}
          />
        ))}
      </div>
      {labels ? (
        <div className="mt-2 flex gap-2">
          {labels.map((l, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[10px]"
              style={{ color: "var(--profile-muted)" }}
            >
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
