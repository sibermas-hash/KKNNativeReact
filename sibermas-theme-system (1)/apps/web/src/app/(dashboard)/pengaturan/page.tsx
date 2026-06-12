// apps/web/src/app/(dashboard)/pengaturan/page.tsx
// Modul Pengaturan — pilih tema (gaya berbeda tiap tema), profil, notifikasi.
"use client";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  ThemeSwatchPicker,
  ThemeSwitcher,
} from "@/components/ui/theme-switcher";

function ToggleRow({
  label,
  defaultOn = false,
}: {
  label: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => setOn(!on)}
        aria-pressed={on}
        className="relative h-6 w-11 rounded-full transition"
        style={{
          background: on
            ? "var(--profile-primary)"
            : "var(--profile-surface-strong)",
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: on ? "22px" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function PengaturanPage() {
  const [saved, setSaved] = React.useState(false);
  return (
    <AppShell
      title="Pengaturan"
      breadcrumb="Dashboard / Pengaturan"
      activeKey="pengaturan"
    >
      <div className="max-w-3xl space-y-4">
        <Card className="space-y-3">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Tampilan
          </h3>
          <p className="text-sm" style={{ color: "var(--profile-muted)" }}>
            Pilih tema. Setiap tema memiliki gaya, warna, dan tata letak
            tersendiri.
          </p>
          <ThemeSwatchPicker />
          <div className="pt-2">
            <ThemeSwitcher />
          </div>
        </Card>

        <Card className="space-y-3">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Profil
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nama</Label>
              <Input defaultValue="Akun Tholib" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="tholib@uinsaizu.ac.id" />
            </div>
            <div>
              <Label>Peran</Label>
              <Input defaultValue="Koordinator" />
            </div>
            <div>
              <Label>Periode KKN</Label>
              <Input defaultValue="Gelombang II / 2026" />
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: "var(--profile-font-heading)" }}
          >
            Notifikasi
          </h3>
          <ToggleRow label="Email saat laporan baru masuk" defaultOn />
          <ToggleRow label="Pengingat jadwal monitoring" defaultOn />
          <ToggleRow label="Ringkasan mingguan" />
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={() => setSaved(true)}>Simpan Perubahan</Button>
          {saved ? (
            <span
              className="text-sm"
              style={{ color: "var(--profile-soft-text)" }}
            >
              Tersimpan ✓
            </span>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
