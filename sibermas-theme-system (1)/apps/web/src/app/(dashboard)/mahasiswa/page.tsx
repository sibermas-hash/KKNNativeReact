// apps/web/src/app/(dashboard)/mahasiswa/page.tsx
// Modul Mahasiswa — daftar + pencarian. Token-driven: beradaptasi ke tema aktif.
"use client";
import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { mahasiswaList, type Mahasiswa } from "@/lib/modules-data";

export default function MahasiswaPage() {
  const [q, setQ] = React.useState("");
  const rows = mahasiswaList.filter((m) =>
    (m.name + " " + m.nim + " " + m.desa + " " + m.dpl + " " + m.prodi)
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  const columns: Column<Mahasiswa>[] = [
    {
      key: "name",
      header: "Mahasiswa",
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar initials={m.initials} size={32} />
          <div>
            <div className="font-medium">{m.name}</div>
            <div className="text-xs" style={{ color: "var(--profile-muted)" }}>
              {m.nim} · {m.prodi}
            </div>
          </div>
        </div>
      ),
    },
    { key: "desa", header: "Desa", render: (m) => m.desa },
    { key: "dpl", header: "DPL", render: (m) => m.dpl },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "progress",
      header: "Progres",
      render: (m) => (
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full"
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
          <span className="text-xs" style={{ color: "var(--profile-muted)" }}>
            {m.progress}%
          </span>
        </div>
      ),
    },
    {
      key: "aksi",
      header: "",
      align: "right",
      render: (m) => (
        <Link
          href={"/mahasiswa/" + m.id}
          className="text-sm font-medium"
          style={{ color: "var(--profile-primary)" }}
        >
          Detail →
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Mahasiswa"
      breadcrumb="Dashboard / Mahasiswa"
      activeKey="mahasiswa"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, NIM, desa, DPL…"
            className="w-full max-w-sm rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--profile-input)",
              border: "1px solid var(--profile-border)",
              color: "var(--profile-text)",
            }}
          />
          <span
            className="ml-auto text-sm"
            style={{ color: "var(--profile-muted)" }}
          >
            {rows.length} mahasiswa
          </span>
          <Link href="/mahasiswa/baru">
            <Button size="sm">+ Tambah</Button>
          </Link>
        </div>
        <Card>
          <DataTable columns={columns} rows={rows} getRowKey={(m) => m.id} />
        </Card>
      </div>
    </AppShell>
  );
}
