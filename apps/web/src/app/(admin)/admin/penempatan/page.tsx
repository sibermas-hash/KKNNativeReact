"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Shuffle, Users, GraduationCap, ArrowRight, Settings2 } from "lucide-react";

const MANUAL = [
  ["nusantara", "KKN Nusantara"],
  ["internasional", "KKN Internasional"],
  ["tematik", "KKN Tematik"],
  ["kolaborasi_ptkin", "KKN Kolaborasi PTKIN"],
  ["responsif", "KKN Responsif"],
  ["kampung_zakat_katana", "KKN Kampung Zakat & Katana"],
] as const;

export default function PenempatanKknPage(): React.JSX.Element {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "otomatis";
  const isManual = mode === "manual";

  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-teal-600">Penempatan KKN</p>
        <h1 className="text-2xl font-black uppercase text-slate-900">Pusat Penempatan KKN</h1>
        <p className="text-sm text-slate-500">Pilih workflow: otomatis untuk KKN Reguler, manual untuk KKN non-Reguler. Semua tetap tercatat di Sibermas.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/penempatan?mode=otomatis" className={"rounded-2xl border p-5 shadow-sm transition " + (!isManual ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "bg-white hover:border-teal-300")}>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-100 p-3 text-teal-700"><Shuffle className="h-6 w-6" /></div>
            <div>
              <div className="text-xs font-black uppercase text-teal-700">TAB Otomatis</div>
              <h2 className="text-xl font-black text-slate-900">KKN Reguler</h2>
              <p className="mt-1 text-sm text-slate-600">Checklist wilayah → plotting otomatis → review kelompok.</p>
            </div>
          </div>
        </Link>
        <Link href="/admin/penempatan?mode=manual" className={"rounded-2xl border p-5 shadow-sm transition " + (isManual ? "border-amber-500 bg-amber-50 ring-2 ring-amber-100" : "bg-white hover:border-amber-300")}>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700"><Settings2 className="h-6 w-6" /></div>
            <div>
              <div className="text-xs font-black uppercase text-amber-700">TAB Manual</div>
              <h2 className="text-xl font-black text-slate-900">KKN Non-Reguler</h2>
              <p className="mt-1 text-sm text-slate-600">Buat kelompok manual → input lokasi → tambah peserta → assign DPL.</p>
            </div>
          </div>
        </Link>
      </div>

      {!isManual ? (
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-teal-700">Workflow Otomatis</div>
          <h2 className="mt-1 text-xl font-black text-teal-950">KKN Reguler</h2>
          <p className="mt-2 text-sm text-teal-800">Gunakan jika peserta banyak dan perlu sebar otomatis. Aturan: hanya desa dichecklist, 1 desa maksimal 1 kelompok.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Action href="/admin/lokasi?jenis_kkn=reguler" icon={<MapPin className="h-5 w-5" />} title="1. Atur Wilayah" desc="Checklist desa kandidat" />
            <Action href="/admin/plotting-otomatis?jenis_kkn=reguler" icon={<Shuffle className="h-5 w-5" />} title="2. Plotting Otomatis" desc="Generate kelompok" />
            <Action href="/admin/kelompok?jenis_kkn=reguler" icon={<Users className="h-5 w-5" />} title="3. Review Kelompok" desc="Cek hasil plotting" />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-amber-700">Workflow Manual Non-Reguler</div>
          <h2 className="mt-1 text-xl font-black text-amber-950">Pilih jenis KKN, lalu input manual di sistem.</h2>
          <p className="mt-2 text-sm text-amber-800">Tidak memakai checklist massal dan tidak memakai plotting otomatis. Admin tetap mencatat kelompok, lokasi, peserta, dan DPL di Sibermas.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MANUAL.map(([key, label]) => (
              <div key={key} className="rounded-xl border bg-white p-4 shadow-sm">
                <h3 className="font-black text-slate-900">{label}</h3>
                <p className="mt-1 text-xs text-slate-500">Mode input manual</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/kelompok?jenis_kkn=${key}&mode=manual`} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800">Buat/Review Kelompok</Link>
                  <Link href={`/admin/dosen/penugasan?jenis_kkn=${key}`} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100">Assign DPL</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Action({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="group rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-lg bg-teal-100 p-2 text-teal-700">{icon}</div>
      <div className="flex items-center justify-between gap-2"><h3 className="font-black text-slate-900">{title}</h3><ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" /></div>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </Link>
  );
}
