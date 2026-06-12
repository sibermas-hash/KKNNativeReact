// apps/web/src/components/ui/stat-card.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  spark?: number[];
}) {
  const up = trend === "up";
  return (
    <Card glass className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: "var(--profile-muted)" }}>
        {label}
      </span>
      <span
        className="font-heading text-2xl font-bold"
        style={{ color: "var(--profile-text)" }}
      >
        {value}
      </span>
      <div className="mt-1 flex items-center justify-between">
        {delta ? (
          <span
            className="text-xs font-medium"
            style={{
              color: up
                ? "var(--profile-soft-text)"
                : "var(--profile-danger-text)",
            }}
          >
            {up ? "▲" : "▼"} {delta}
          </span>
        ) : (
          <span />
        )}
        {spark ? (
          <Sparkline
            data={spark}
            color={up ? "var(--profile-primary)" : "var(--profile-danger-text)"}
          />
        ) : null}
      </div>
    </Card>
  );
}
