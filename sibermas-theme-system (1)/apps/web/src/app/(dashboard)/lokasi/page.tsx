// apps/web/src/app/(dashboard)/lokasi/page.tsx
// Modul Lokasi KKN — ringkasan & kartu desa penempatan.
"use client";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { desaList } from "@/lib/modules-data";

export default function LokasiPage() {
  const totalMhs = desaList.reduce((a, d) => a + d.mahasiswa, 0);
  const totalProg = desaList.reduce((a, d) => a + d.program, 0);
  const kecamatan = new Set(desaList.map((d) => d.kecamatan)).size;

  return (
    <AppShell
      title="Lokasi KKN"
      breadcrumb="Dashboard / Lokasi KKN"
      activeKey="lokasi"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              Total Desa
            </div>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {desaList.length}
            </div>
          </Card>
          <Card>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              Kecamatan
            </div>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {kecamatan}
            </div>
          </Card>
          <Card>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              Mahasiswa
            </div>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {totalMhs}
            </div>
          </Card>
          <Card>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              Program
            </div>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {totalProg}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {desaList.map((d) => (
            <Card key={d.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--profile-font-heading)" }}
                >
                  {d.nama}
                </h3>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
                Kec. {d.kecamatan}
              </p>
              <div className="flex gap-4 pt-1 text-sm">
                <span>
                  <strong>{d.mahasiswa}</strong> mahasiswa
                </span>
                <span>
                  <strong>{d.program}</strong> program
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
