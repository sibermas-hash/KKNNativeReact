// apps/web/src/components/layouts/minimal-layout.tsx
// Modern Minimal — terpusat, lapang, datar tanpa kartu. Pembatas garis tipis.
"use client";
import * as React from "react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { type DashboardData } from "@/lib/dashboard-data";

const NAV = ["Ringkasan", "Mahasiswa", "Laporan"];

export function MinimalLayout({ data }: { data: DashboardData }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <span
            className="font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            SIBERMAS
          </span>
          <nav className="flex items-center gap-6 text-sm">
            {NAV.map((n, i) => (
              <span
                key={n}
                className="relative"
                style={{
                  color:
                    i === 0 ? "var(--profile-text)" : "var(--profile-muted)",
                }}
              >
                {n}
                {i === 0 ? (
                  <span
                    className="absolute -bottom-1.5 left-0 h-0.5 w-full"
                    style={{ background: "var(--profile-primary)" }}
                  />
                ) : null}
              </span>
            ))}
            <ThemeSwitcher />
          </nav>
        </div>

        <h1
          className="mt-12 text-5xl font-bold tracking-tight"
          style={{ fontFamily: "var(--profile-font-heading)" }}
        >
          Beranda
        </h1>
        <p className="mt-3 text-lg" style={{ color: "var(--profile-muted)" }}>
          Ringkasan kegiatan KKN periode ini.
        </p>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4">
          {data.stats.map((s, i) => (
            <div
              key={s.label}
              className="px-5"
              style={
                i % 4 === 0
                  ? { paddingLeft: 0 }
                  : { borderLeft: "1px solid var(--profile-border)" }
              }
            >
              <div
                className="text-[11px] uppercase tracking-wide"
                style={{ color: "var(--profile-muted)" }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-3xl font-bold"
                style={{ fontFamily: "var(--profile-font-heading)" }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <hr
          className="my-12"
          style={{ borderColor: "var(--profile-border)" }}
        />

        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--profile-font-heading)" }}
        >
          Aktivitas terbaru
        </h2>
        <div className="mt-6">
          {data.activities.slice(0, 4).map((a) => (
            <div
              key={a.name}
              className="flex items-center py-4"
              style={{ borderBottom: "1px solid var(--profile-border)" }}
            >
              <span className="font-medium">{a.name}</span>
              <span
                className="ml-auto mr-8 text-sm"
                style={{ color: "var(--profile-muted)" }}
              >
                {a.desa}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--profile-primary)" }}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
