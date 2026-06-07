// apps/web/src/components/layouts/professional-layout.tsx
// Dark Professional — command-bar + KPI padat + glassmorphism di atas orb.
"use client";
import * as React from "react";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Orbs } from "@/components/layout/ornaments";
import { type DashboardData } from "@/lib/dashboard-data";

export function ProfessionalLayout({ data }: { data: DashboardData }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <Orbs />
      <div className="relative mx-auto max-w-7xl space-y-3 px-5 py-5">
        <div className="glass flex items-center gap-4 rounded-[var(--profile-radius)] px-4 py-3">
          <span
            className="inline-block h-6 w-6 rounded-md"
            style={{ background: "var(--profile-primary)" }}
          />
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            SIBERMAS
          </span>
          <div
            className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg px-3 py-1.5"
            style={{
              background: "var(--profile-input)",
              border: "1px solid var(--profile-border)",
            }}
          >
            <span className="text-xs" style={{ color: "var(--profile-muted)" }}>
              Cari perintah, mahasiswa, laporan…
            </span>
            <span
              className="ml-auto rounded border px-1.5 py-0.5 text-[10px]"
              style={{
                borderColor: "var(--profile-border)",
                color: "var(--profile-muted)",
              }}
            >
              ⌘K
            </span>
          </div>
          <ThemeSwitcher />
          <Avatar initials="AT" size={28} />
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {data.kpis.map((k) => (
            <div
              key={k.label}
              className="glass rounded-[var(--profile-radius)] px-4 py-3"
            >
              <div
                className="text-[11px]"
                style={{ color: "var(--profile-muted)" }}
              >
                {k.label}
              </div>
              <div
                className="text-xl font-bold"
                style={{ fontFamily: "var(--profile-font-heading)" }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="glass rounded-[var(--profile-radius)] p-4 lg:col-span-2">
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Aktivitas (real-time)
            </h3>
            <div>
              {data.activities.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-3 py-2.5 text-sm"
                  style={{ borderBottom: "1px solid var(--profile-border)" }}
                >
                  <Avatar initials={a.initials} size={24} />
                  <span className="font-medium">{a.name}</span>
                  <span
                    className="ml-auto mr-6"
                    style={{ color: "var(--profile-muted)" }}
                  >
                    {a.desa}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="glass rounded-[var(--profile-radius)] p-4">
              <h3
                className="mb-2 text-sm font-bold"
                style={{ fontFamily: "var(--profile-font-heading)" }}
              >
                Status
              </h3>
              <div className="flex items-center gap-4">
                <DonutChart
                  segments={data.donut}
                  centerLabel="128"
                  centerSub="total"
                  size={120}
                />
                <ul className="flex-1 space-y-1.5 text-sm">
                  {data.donut.map((dseg) => (
                    <li
                      key={dseg.label}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: dseg.color }}
                        />
                        {dseg.label}
                      </span>
                      <span style={{ color: "var(--profile-muted)" }}>
                        {dseg.value}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="glass rounded-[var(--profile-radius)] p-4">
              <h3
                className="mb-2 text-sm font-bold"
                style={{ fontFamily: "var(--profile-font-heading)" }}
              >
                Laporan / bln
              </h3>
              <BarChart data={data.barData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
