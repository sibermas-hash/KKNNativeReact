// apps/web/src/components/layouts/akademik-layout.tsx
// Akademik Islami — sidebar klasik + banner ber-aksen emas + ornamen bintang.
"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { StarOrnament } from "@/components/layout/ornaments";
import { type DashboardData } from "@/lib/dashboard-data";

const NAV = [
  "Dashboard",
  "Mahasiswa",
  "Lokasi KKN",
  "Jadwal",
  "Laporan",
  "Pengaturan",
];

export function AkademikLayout({ data }: { data: DashboardData }) {
  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <aside
        className="hidden w-60 shrink-0 flex-col border-r p-5 md:flex"
        style={{
          background: "var(--profile-surface)",
          borderColor: "var(--profile-border)",
        }}
      >
        <div className="mb-6 flex items-center gap-2">
          <span
            className="inline-block h-7 w-7 rounded-md"
            style={{ background: "var(--profile-primary)" }}
          />
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            SIBERMAS
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n, i) => (
            <span
              key={n}
              className="rounded-lg px-3 py-2 text-sm"
              style={
                i === 0
                  ? {
                      background: "var(--profile-soft)",
                      color: "var(--profile-soft-text)",
                      fontWeight: 600,
                    }
                  : { color: "var(--profile-muted)" }
              }
            >
              {n}
            </span>
          ))}
        </nav>
        <div
          className="mt-auto rounded-xl p-4"
          style={{ background: "var(--profile-soft)" }}
        >
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            SIBERMAS Pro
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--profile-muted)" }}>
            Modul lanjutan & laporan otomatis.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 px-8 py-5">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {data.title}
            </h1>
            <p className="text-xs" style={{ color: "var(--profile-muted)" }}>
              {data.breadcrumb}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeSwitcher />
            <Avatar initials="AT" />
          </div>
        </header>

        <main className="flex-1 space-y-5 px-8 pb-10">
          <Card className="relative overflow-hidden">
            <span
              className="absolute left-0 top-0 h-full w-1.5"
              style={{ background: "var(--profile-accent)" }}
            />
            <div className="flex items-center justify-between pl-3">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--profile-font-heading)" }}
                >
                  {data.title}
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {data.org}
                </p>
              </div>
              <StarOrnament size={64} />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.stats.map((s) => (
              <Card key={s.label} className="flex flex-col gap-1">
                <span
                  className="text-xs"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {s.label}
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--profile-font-heading)" }}
                >
                  {s.value}
                </span>
                <span
                  className="mt-1 inline-block h-0.5 w-8"
                  style={{ background: "var(--profile-accent)" }}
                />
              </Card>
            ))}
          </div>

          <Card>
            <h3
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Aktivitas Mahasiswa
            </h3>
            <div>
              {data.activities.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: "1px solid var(--profile-border)" }}
                >
                  <Avatar initials={a.initials} size={28} />
                  <span className="font-medium">{a.name}</span>
                  <span
                    className="ml-auto mr-6 text-sm"
                    style={{ color: "var(--profile-muted)" }}
                  >
                    {a.desa}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
