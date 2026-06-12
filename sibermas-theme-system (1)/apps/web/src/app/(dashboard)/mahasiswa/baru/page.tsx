// apps/web/src/app/(dashboard)/mahasiswa/baru/page.tsx
// Form input mahasiswa baru (demo lokal, belum tersambung backend).
"use client";
import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const SELECT =
  "w-full rounded-[calc(var(--profile-radius)-4px)] border border-[var(--profile-border)] bg-[var(--profile-input)] px-3 py-2 text-[var(--profile-text)] focus:outline-none focus:ring-4 focus:ring-[var(--profile-ring)]";

export default function MahasiswaBaruPage() {
  const [done, setDone] = React.useState<string | null>(null);
  const [nama, setNama] = React.useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(nama || "Mahasiswa baru");
  }
  return (
    <AppShell
      title="Tambah Mahasiswa"
      breadcrumb="Dashboard / Mahasiswa / Tambah"
      activeKey="mahasiswa"
    >
      <div className="max-w-2xl space-y-4">
        <Link
          href="/mahasiswa"
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
              Data untuk <strong>{done}</strong> telah ditambahkan (demo).
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={() => setDone(null)}>
                Tambah lagi
              </Button>
              <Link href="/mahasiswa">
                <Button>Lihat daftar</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="cth. Akun Tholib"
                    required
                  />
                </div>
                <div>
                  <Label>NIM</Label>
                  <Input placeholder="2017101009" required />
                </div>
                <div>
                  <Label>Program Studi</Label>
                  <select className={SELECT} defaultValue="Teknik Informatika">
                    <option>Teknik Informatika</option>
                    <option>Ekonomi Syariah</option>
                    <option>Hukum Keluarga</option>
                    <option>Pendidikan Agama Islam</option>
                    <option>Komunikasi Penyiaran Islam</option>
                    <option>Manajemen Dakwah</option>
                  </select>
                </div>
                <div>
                  <Label>Desa Penempatan</Label>
                  <Input placeholder="cth. Sukamaju" />
                </div>
                <div>
                  <Label>Dosen Pembimbing (DPL)</Label>
                  <Input placeholder="cth. Dr. Hasan, M.Pd" />
                </div>
                <div>
                  <Label>Status</Label>
                  <select className={SELECT} defaultValue="Aktif">
                    <option>Aktif</option>
                    <option>Review</option>
                    <option>Selesai</option>
                    <option>Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Simpan</Button>
                <Link href="/mahasiswa">
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
