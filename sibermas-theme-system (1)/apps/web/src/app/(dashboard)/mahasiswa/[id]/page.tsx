// apps/web/src/app/(dashboard)/mahasiswa/[id]/page.tsx
// Modul Mahasiswa — halaman detail + logbook timeline.
"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { mahasiswaList, logbookByMhs } from "@/lib/modules-data";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: "var(--profile-muted)" }}>{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

export default function MahasiswaDetailPage() {
  const params = useParams();
  const id = String((params && params.id) || "");
  const m = mahasiswaList.find((x) => x.id === id) || mahasiswaList[0];
  const logs = logbookByMhs[m.id] || [];
  const disetujui = logs.filter((l) => l.status === "Disetujui").length;
  const review = logs.filter((l) => l.status === "Review").length;

  return (
    <AppShell
      title="Detail Mahasiswa"
      breadcrumb="Dashboard / Mahasiswa / Detail"
      activeKey="mahasiswa"
    >
      <div className="space-y-4">
        <Link
          href="/mahasiswa"
          className="text-sm"
          style={{ color: "var(--profile-muted)" }}
        >
          ← Kembali ke daftar
        </Link>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar initials={m.initials} size={56} />
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {m.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
              {m.nim} · {m.prodi}
            </p>
          </div>
          <div className="sm:ml-auto">
            <StatusBadge status={m.status} />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Informasi Penempatan
            </h3>
            <dl className="space-y-2 text-sm">
              <Row k="Desa" v={m.desa} />
              <Row k="DPL" v={m.dpl} />
              <Row k="Email" v={m.email} />
              <Row k="Telepon" v={m.phone} />
            </dl>
          </Card>

          <Card>
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Progres KKN
            </h3>
            <div
              className="text-4xl font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              {m.progress}%
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full"
              style={{ background: "var(--profile-surface-strong)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: m.progress + "%",
                  background: "var(--profile-primary)",
                }}
              />
            </div>
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--profile-muted)" }}
            >
              Capaian program & laporan.
            </p>
          </Card>

          <Card>
            <h3
              className="mb-3 text-sm font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Ringkasan Logbook
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span style={{ color: "var(--profile-muted)" }}>
                  Total entri
                </span>
                <span>{logs.length}</span>
              </li>
              <li className="flex justify-between">
                <span style={{ color: "var(--profile-muted)" }}>Disetujui</span>
                <span>{disetujui}</span>
              </li>
              <li className="flex justify-between">
                <span style={{ color: "var(--profile-muted)" }}>
                  Perlu review
                </span>
                <span>{review}</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card>
          <h3
            className="mb-4 text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Logbook Kegiatan
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
              Belum ada entri logbook.
            </p>
          ) : (
            <ol
              className="space-y-5 pl-5"
              style={{ borderLeft: "2px solid var(--profile-border)" }}
            >
              {logs.map((l, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[26px] top-1 h-3 w-3 rounded-full"
                    style={{
                      background: "var(--profile-primary)",
                      border: "2px solid var(--profile-surface)",
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ color: "var(--profile-muted)" }}
                    >
                      {l.tanggal}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="mt-0.5 text-sm font-medium">{l.judul}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
