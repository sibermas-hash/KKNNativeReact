// apps/web/src/app/(dashboard)/jadwal/baru/page.tsx
// Form input jadwal kegiatan baru (demo lokal).
"use client";
import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const SELECT =
  "w-full rounded-[calc(var(--profile-radius)-4px)] border border-[var(--profile-border)] bg-[var(--profile-input)] px-3 py-2 text-[var(--profile-text)] focus:outline-none focus:ring-4 focus:ring-[var(--profile-ring)]";

export default function JadwalBaruPage() {
  const [done, setDone] = React.useState<string | null>(null);
  const [kegiatan, setKegiatan] = React.useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(kegiatan || "Kegiatan baru");
  }
  return (
    <AppShell
      title="Tambah Jadwal"
      breadcrumb="Dashboard / Jadwal / Tambah"
      activeKey="jadwal"
    >
      <div className="max-w-2xl space-y-4">
        <Link
          href="/jadwal"
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
              Kegiatan <strong>{done}</strong> telah ditambahkan (demo).
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setDone(null)}>
                Tambah lagi
              </Button>
              <Link href="/jadwal">
                <Button>Lihat daftar</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Nama Kegiatan</Label>
                <Input
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  placeholder="cth. Monitoring DPL"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Tanggal</Label>
                  <Input type="date" required />
                </div>
                <div>
                  <Label>Waktu</Label>
                  <Input type="time" />
                </div>
                <div>
                  <Label>Lokasi</Label>
                  <Input placeholder="cth. Balai Desa Sukamaju" />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <select className={SELECT} defaultValue="Lapangan">
                    <option>Akademik</option>
                    <option>Lapangan</option>
                    <option>Monitoring</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Simpan</Button>
                <Link href="/jadwal">
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
