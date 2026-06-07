// apps/web/src/components/layouts/nusantara-layout.tsx
// Desa KKN Nusantara — hero bergambar + nav chip + kartu menumpuk hangat.
"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LeafIcon, BatikDiamonds } from "@/components/layout/ornaments";
import { type DashboardData } from "@/lib/dashboard-data";

const CHIPS = ["Ringkasan", "Program", "Logbook", "Galeri"];

export function NusantaraLayout({ data }: { data: DashboardData }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "var(--profile-page)",
        color: "var(--profile-text)",
      }}
    >
      <div
        className="relative overflow-hidden px-6 py-8 text-white sm:px-10"
        style={{
          backgroundImage:
            "linear-gradient(120deg, var(--profile-primary) 0%, var(--profile-primary-hover) 50%, #4F7942 100%)",
        }}
      >
        <div className="absolute right-6 top-6">
          <ThemeSwitcher />
        </div>
        <BatikDiamonds count={16} className="mb-5 text-white/70" />
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--profile-font-heading)" }}
        >
          {data.title} Nusantara
        </h1>
        <p className="mt-2 max-w-md text-white/90">
          Desa membangun, mahasiswa mengabdi.
        </p>
        <div
          className="mt-5 flex max-w-sm items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg"
          style={{ color: "var(--profile-muted)" }}
        >
          <span
            className="h-3.5 w-3.5 rounded-full border"
            style={{ borderColor: "var(--profile-muted)" }}
          />
          <span className="text-sm">Cari desa, mahasiswa…</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {CHIPS.map((c, i) => (
            <span
              key={c}
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={
                i === 0
                  ? { background: "var(--profile-primary)", color: "#fff" }
                  : {
                      background: "var(--profile-surface)",
                      color: "var(--profile-muted)",
                      border: "1px solid var(--profile-border)",
                    }
              }
            >
              {c}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {data.stats.slice(0, 3).map((s) => (
            <Card key={s.label} className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--profile-soft)" }}
              >
                <LeafIcon size={22} color="var(--profile-accent)" />
              </span>
              <div>
                <div
                  className="text-sm"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {s.label}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--profile-font-heading)" }}
                >
                  {s.value}
                </div>
              </div>
              {s.delta ? (
                <span
                  className="ml-auto text-sm font-medium"
                  style={{ color: "var(--profile-soft-text)" }}
                >
                  ▲ {s.delta}
                </span>
              ) : null}
            </Card>
          ))}
        </div>

        <Card className="mt-5">
          <h3
            className="mb-4 text-lg font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Program Desa Unggulan
          </h3>
          <div className="space-y-4">
            {data.programs.map((p) => (
              <div key={p.title} className="flex items-center gap-3">
                <LeafIcon size={16} color="#4F7942" />
                <span className="font-medium">{p.title}</span>
                <span
                  className="text-sm"
                  style={{ color: "var(--profile-muted)" }}
                >
                  · {p.desa}
                </span>
                <div
                  className="ml-auto h-2 w-40 overflow-hidden rounded-full"
                  style={{ background: "var(--profile-surface-strong)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: p.progress + "%",
                      background: "var(--profile-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
