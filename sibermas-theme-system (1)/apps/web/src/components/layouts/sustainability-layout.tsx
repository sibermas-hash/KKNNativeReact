// apps/web/src/components/layouts/sustainability-layout.tsx
// Green Sustainability — grid metrik bergradien + sparkline + kartu capaian.
"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LeafIcon } from "@/components/layout/ornaments";
import { type DashboardData } from "@/lib/dashboard-data";

export function SustainabilityLayout({ data }: { data: DashboardData }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: "var(--profile-soft)" }}
          >
            <LeafIcon size={22} color="var(--profile-primary)" />
          </span>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Dashboard Keberlanjutan KKN
            </h1>
            <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
              Dampak program lingkungan & sosial
            </p>
          </div>
          <div className="ml-auto">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.impact.map((t) => (
            <div
              key={t.label}
              className="relative overflow-hidden rounded-[var(--profile-radius)] p-5 text-white shadow-md"
              style={{ backgroundImage: t.gradient }}
            >
              <span className="absolute right-4 top-4 opacity-80">
                <LeafIcon size={18} color="#fff" />
              </span>
              <div className="text-sm text-white/90">{t.label}</div>
              <div
                className="mt-1 text-3xl font-bold"
                style={{ fontFamily: "var(--profile-font-heading)" }}
              >
                {t.value}
              </div>
              {t.spark ? (
                <div className="mt-3 opacity-90">
                  <Sparkline
                    data={t.spark}
                    color="#fff"
                    width={120}
                    height={26}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Card className="mt-5">
          <h3
            className="mb-4 text-lg font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Capaian Program
          </h3>
          <div className="space-y-4">
            {data.progress.map((p) => (
              <div key={p.label} className="flex items-center gap-4">
                <span className="w-36 text-sm">{p.label}</span>
                <div
                  className="h-3 flex-1 overflow-hidden rounded-full"
                  style={{ background: "var(--profile-surface-strong)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: p.pct + "%",
                      background: "var(--profile-primary)",
                    }}
                  />
                </div>
                <span
                  className="w-10 text-right text-sm"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {p.pct}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
