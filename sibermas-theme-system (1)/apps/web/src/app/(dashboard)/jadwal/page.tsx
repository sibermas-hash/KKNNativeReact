// apps/web/src/app/(dashboard)/jadwal/page.tsx
// Modul Jadwal — timeline kegiatan KKN dengan kategori berwarna.
"use client";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { jadwalList, type Jadwal } from "@/lib/modules-data";

const KATEGORI = ["Semua", "Akademik", "Lapangan", "Monitoring"];

function katColor(kategori: string): string {
  if (kategori === "Akademik") return "var(--profile-primary)";
  if (kategori === "Lapangan") return "var(--profile-accent)";
  return "var(--profile-soft-text)";
}

export default function JadwalPage() {
  const [filter, setFilter] = React.useState("Semua");
  const rows: Jadwal[] = jadwalList.filter(
    (j) => filter === "Semua" || j.kategori === filter,
  );

  return (
    <AppShell
      title="Jadwal Kegiatan"
      breadcrumb="Dashboard / Jadwal"
      activeKey="jadwal"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {KATEGORI.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={
                  active
                    ? { background: "var(--profile-primary)", color: "#fff" }
                    : {
                        background: "var(--profile-surface)",
                        color: "var(--profile-muted)",
                        border: "1px solid var(--profile-border)",
                      }
                }
              >
                {k}
              </button>
            );
          })}
          <Link href="/jadwal/baru" className="ml-auto">
            <Button size="sm">+ Tambah</Button>
          </Link>
        </div>

        <Card>
          <ol
            className="space-y-4 pl-5"
            style={{ borderLeft: "2px solid var(--profile-border)" }}
          >
            {rows.map((j) => (
              <li key={j.id} className="relative">
                <span
                  className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full"
                  style={{
                    background: katColor(j.kategori),
                    border: "2px solid var(--profile-surface)",
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--profile-muted)" }}
                  >
                    {j.tanggal} · {j.waktu}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      background: "var(--profile-soft)",
                      color: "var(--profile-soft-text)",
                    }}
                  >
                    {j.kategori}
                  </span>
                </div>
                <div
                  className="mt-1 text-base font-semibold"
                  style={{ fontFamily: "var(--profile-font-heading)" }}
                >
                  {j.kegiatan}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--profile-muted)" }}
                >
                  {j.lokasi}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}
