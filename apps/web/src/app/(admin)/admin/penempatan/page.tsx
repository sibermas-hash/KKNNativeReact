"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Shuffle, Users, GraduationCap, ArrowRight } from "lucide-react";

const JENIS = [
  ["reguler", "KKN Reguler"],
  ["nusantara", "KKN Nusantara"],
  ["internasional", "KKN Internasional"],
  ["tematik", "KKN Tematik"],
  ["kolaborasi_ptkin", "KKN Kolaborasi PTKIN"],
  ["responsif", "KKN Responsif"],
  ["kampung_zakat_katana", "KKN Kampung Zakat & Katana"],
] as const;

export default function PenempatanKknPage(): React.JSX.Element {
  const params = useSearchParams();
  const active = params.get("jenis") ?? "reguler";
  const label = JENIS.find(([k]) => k === active)?.[1] ?? "KKN Reguler";
  const isReguler = active === "reguler";

  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-teal-600">Penempatan KKN</p>
        <h1 className="text-2xl font-black uppercase text-slate-900">Dashboard Penempatan Per Jenis KKN</h1>
        <p className="text-sm text-slate-500">Reguler memakai checklist wilayah + plotting otomatis. Non-reguler memakai input manual di sistem Sibermas.</p>
      </div>

      <div className="rounded-xl border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {JENIS.map(([key, name]) => (
            <Link key={key} href={`/admin/penempatan?jenis=${key}`} className={"rounded-lg px-3 py-2 text-sm font-bold transition " + (active === key ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
              {name}
            </Link>
          ))}
        </div>
      </div>

      {isReguler ? (
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-teal-700">Mode Otomatis</div>
          <h2 className="mt-1 text-xl font-black text-teal-950">{label}</h2>
          <p className="mt-2 text-sm text-teal-800">Atur desa kandidat, lalu jalankan plotting otomatis. Aturan: 1 desa maksimal 1 kelompok.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Action href="/admin/lokasi?jenis_kkn=reguler" icon={<MapPin className="h-5 w-5" />} title="Atur Wilayah Reguler" desc="Checklist desa kandidat KKN Reguler" />
            <Action href="/admin/plotting-otomatis?jenis_kkn=reguler" icon={<Shuffle className="h-5 w-5" />} title="Plotting Otomatis" desc="Generate kelompok otomatis" />
            <Action href="/admin/kelompok?jenis_kkn=reguler" icon={<Users className="h-5 w-5" />} title="Review Kelompok" desc="Cek hasil kelompok reguler" />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-amber-700">Mode Manual</div>
          <h2 className="mt-1 text-xl font-black text-amber-950">{label}</h2>
          <p className="mt-2 text-sm text-amber-800">Penempatan tetap di sistem Sibermas: admin buat kelompok, input/pilih lokasi, tambah peserta, lalu assign DPL. Tidak memakai checklist wilayah massal.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Action href={`/admin/kelompok?jenis_kkn=${active}&mode=manual`} icon={<Users className="h-5 w-5" />} title="Buat Kelompok Manual" desc="Kelompok & peserta jenis ini" amber />
            <Action href={`/admin/dosen/penugasan?jenis_kkn=${active}`} icon={<GraduationCap className="h-5 w-5" />} title="Penugasan DPL" desc="Assign DPL ke kelompok" amber />
            <Action href={`/admin/lokasi?jenis_kkn=${active}`} icon={<MapPin className="h-5 w-5" />} title="Info Wilayah" desc="Lihat catatan mode manual" amber />
          </div>
        </section>
      )}
    </main>
  );
}

function Action({ href, icon, title, desc, amber = false }: { href: string; icon: React.ReactNode; title: string; desc: string; amber?: boolean }) {
  return (
    <Link href={href} className="group rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={"mb-3 inline-flex rounded-lg p-2 " + (amber ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700")}>{icon}</div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black text-slate-900">{title}</h3>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
      </div>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </Link>
  );
}
