// apps/web/src/app/(dashboard)/laporan/baru/page.tsx
// Form input laporan baru (demo lokal).
"use client";
import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const SELECT =
  "w-full rounded-[calc(var(--profile-radius)-4px)] border border-[var(--profile-border)] bg-[var(--profile-input)] px-3 py-2 text-[var(--profile-text)] focus:outline-none focus:ring-4 focus:ring-[var(--profile-ring)]";

export default function LaporanBaruPage() {
  const [done, setDone] = React.useState<string | null>(null);
  const [judul, setJudul] = React.useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(judul || "Laporan baru");
  }
  return (
    <AppShell
      title="Tambah Laporan"
      breadcrumb="Dashboard / Laporan / Tambah"
      activeKey="laporan"
    >
      <div className="max-w-2xl space-y-4">
        <Link
          href="/laporan"
          className="text-sm"
          style={{ color: "var(--profile-muted)" }}
        >
          ← Kembali ke daftar
        </Link>
        {done ? (
          <Card className="space-y-2">
            <div
              className="text-lg font-bold"
              style={{ fontFamily: "var(--profile-font-heading)" }}
            >
              Berhasil disimpan ✓
            </div>
            <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
              Laporan <strong>{done}</strong> telah ditambahkan (demo).
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setDone(null)}>
                Tambah lagi
              </Button>
              <Link href="/laporan">
                <Button>Lihat daftar</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Judul Laporan</Label>
                <Input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="cth. Laporan Mingguan #4"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Mahasiswa</Label>
                  <Input placeholder="cth. Siti Aisyah" />
                </div>
                <div>
                  <Label>Desa</Label>
                  <Input placeholder="cth. Sukamaju" />
                </div>
                <div>
                  <Label>Jenis</Label>
                  <select className={SELECT} defaultValue="Mingguan">
                    <option>Mingguan</option>
                    <option>Program Kerja</option>
                    <option>Proposal</option>
                    <option>Laporan Akhir</option>
                  </select>
                </div>
                <div>
                  <Label>Tanggal</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Status</Label>
                  <select className={SELECT} defaultValue="Menunggu">
                    <option>Menunggu</option>
                    <option>Review</option>
                    <option>Disetujui</option>
                    <option>Ditolak</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Simpan</Button>
                <Link href="/laporan">
                  <Button type="button" variant="ghost">
                    Batal
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
