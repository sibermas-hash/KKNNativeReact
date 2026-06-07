// apps/web/src/app/(dashboard)/laporan/page.tsx
// Modul Laporan & Monitoring — KPI, tren bulanan, status, dan daftar laporan.
"use client";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { laporanList, laporanPerBulan, type Laporan } from "@/lib/modules-data";

export default function LaporanPage() {
  const total = laporanList.length;
  const disetujui = laporanList.filter((l) => l.status === "Disetujui").length;
  const review = laporanList.filter((l) => l.status === "Review").length;
  const ditolak = laporanList.filter((l) => l.status === "Ditolak").length;

  const donut = [
    { label: "Disetujui", value: disetujui, color: "var(--profile-primary)" },
    { label: "Review", value: review, color: "var(--profile-accent)" },
    { label: "Ditolak", value: ditolak, color: "var(--profile-danger)" },
  ];

  const columns: Column<Laporan>[] = [
    {
      key: "judul",
      header: "Judul",
      render: (l) => (
        <div>
          <div className="font-medium">{l.judul}</div>
          <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
            {l.jenis}
          </div>
        </div>
      ),
    },
    { key: "mahasiswa", header: "Mahasiswa", render: (l) => l.mahasiswa },
    { key: "desa", header: "Desa", render: (l) => l.desa },
    { key: "tanggal", header: "Tanggal", render: (l) => l.tanggal },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge status={l.status} />,
    },
  ];

  return (
    <AppShell
      title="Laporan & Monitoring"
      breadcrumb="Dashboard / Laporan"
      activeKey="laporan"
    >
      <div className="space-y-4">
        <div className="flex items-center">
          <span className="text-sm text-[var(--profile-muted)]">
            {laporanList.length} laporan
          </span>
          <Link href="/laporan/baru" className="ml-auto">
            <Button size="sm">+ Laporan</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Laporan" value={String(total)} />
          <StatCard
            label="Disetujui"
            value={String(disetujui)}
            delta="+4"
            trend="up"
          />
          <StatCard
            label="Perlu Review"
            value={String(review)}
            delta="+2"
            trend="up"
          />
          <StatCard
            label="Ditolak"
            value={String(ditolak)}
            delta="-1"
            trend="down"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Laporan per Bulan
            </h3>
            <BarChart
              data={laporanPerBulan}
              labels={[
                "J",
                "F",
                "M",
                "A",
                "M",
                "J",
                "J",
                "A",
                "S",
                "O",
                "N",
                "D",
              ]}
            />
          </Card>
          <Card>
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Status Laporan
            </h3>
            <div className="flex items-center gap-4">
              <DonutChart
                segments={donut}
                centerLabel={String(total)}
                centerSub="laporan"
                size={120}
              />
              <ul className="flex-1 space-y-1.5 text-sm">
                {donut.map((d) => (
                  <li
                    key={d.label}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: d.color }}
                      />
                      {d.label}
                    </span>
                    <span style={{ color: "var(--profile-muted)" }}>
                      {d.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <Card>
          <h3
            className="mb-3 text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Daftar Laporan
          </h3>
          <DataTable
            columns={columns}
            rows={laporanList}
            getRowKey={(l) => l.id}
          />
        </Card>
      </div>
    </AppShell>
  );
}
