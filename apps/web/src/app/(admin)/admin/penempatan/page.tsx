"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Shuffle, Users, ArrowRight, Settings2 } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { PRIMARY_CLASS, SOFT_CLASS } from "@/lib/theme-config";

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
  const mode = params?.get("mode") ?? "otomatis";
  const isManual = mode === "manual";
  const { config: themeConfig, surfaceClass } = useTheme();

  return (
    <main className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative">
          <p className="mb-2 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-700">Penempatan KKN</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-[color:var(--profile-text)]">Pusat Penempatan KKN</h1>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--profile-muted)]">Pilih workflow: otomatis untuk KKN Reguler, manual untuk KKN non-Reguler. Semua tetap tercatat di Sibermas.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link 
          href="/admin/penempatan?mode=otomatis" 
          className={`group p-5 transition hover:-translate-y-1 hover:shadow-xl border ${
            !isManual 
              ? "border-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] ring-2 ring-[color:var(--profile-ring)]" 
              : `${surfaceClass} border-[color:var(--profile-border)] opacity-60 hover:opacity-100`
          }`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-3 ${!isManual ? "bg-[color:var(--profile-primary)] text-white" : "bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]"}`}>
              <Shuffle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-[color:var(--profile-soft-text)]">TAB Otomatis</div>
              <h2 className="text-xl font-black text-[color:var(--profile-text)]">KKN Reguler</h2>
              <p className={`mt-1 text-sm ${!isManual ? "text-[color:var(--profile-soft-text)] opacity-90" : "text-[color:var(--profile-muted)]"}`}>
                Checklist wilayah → plotting otomatis → review kelompok.
              </p>
            </div>
          </div>
        </Link>
        <Link 
          href="/admin/penempatan?mode=manual" 
          className={`group p-5 transition hover:-translate-y-1 hover:shadow-xl border ${
            isManual 
              ? "border-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] ring-2 ring-[color:var(--profile-ring)]" 
              : `${surfaceClass} border-[color:var(--profile-border)] opacity-60 hover:opacity-100`
          }`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-3 ${isManual ? "bg-[color:var(--profile-primary)] text-white" : "bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]"}`}>
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-[color:var(--profile-soft-text)]">TAB Manual</div>
              <h2 className="text-xl font-black text-[color:var(--profile-text)]">KKN Non-Reguler</h2>
              <p className={`mt-1 text-sm ${isManual ? "text-[color:var(--profile-soft-text)] opacity-90" : "text-[color:var(--profile-muted)]"}`}>
                Buat kelompok manual → input lokasi → tambah peserta → assign DPL.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {!isManual ? (
        <section 
          className={`border p-6 ${themeConfig.shadow} ${surfaceClass} border-[color:var(--profile-border)] animate-in fade-in slide-in-from-bottom-2 duration-300`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="text-xs font-black uppercase tracking-wide text-[color:var(--profile-soft-text)]">Workflow Otomatis</div>
          <h2 className="mt-1 text-xl font-black text-[color:var(--profile-text)]">KKN Reguler</h2>
          <p className="mt-2 text-sm text-[color:var(--profile-muted)]">Gunakan jika peserta banyak dan perlu sebar otomatis. Aturan: hanya desa dichecklist, 1 desa maksimal 1 kelompok.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Action href="/admin/lokasi?jenis_kkn=reguler" icon={<MapPin className="h-5 w-5" />} title="1. Atur Wilayah" desc="Checklist desa kandidat" />
            <Action href="/admin/plotting-otomatis?jenis_kkn=reguler" icon={<Shuffle className="h-5 w-5" />} title="2. Plotting Otomatis" desc="Generate kelompok" />
            <Action href="/admin/kelompok?jenis_kkn=reguler" icon={<Users className="h-5 w-5" />} title="3. Review Kelompok" desc="Cek hasil plotting" />
          </div>
        </section>
      ) : (
        <section 
          className={`border p-6 ${themeConfig.shadow} ${surfaceClass} border-[color:var(--profile-border)] animate-in fade-in slide-in-from-bottom-2 duration-300`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <div className="text-xs font-black uppercase tracking-wide text-[color:var(--profile-soft-text)]">Workflow Manual Non-Reguler</div>
          <h2 className="mt-1 text-xl font-black text-[color:var(--profile-text)]">Pilih jenis KKN, lalu input manual di sistem.</h2>
          <p className="mt-2 text-sm text-[color:var(--profile-muted)]">Tidak memakai checklist massal dan tidak memakai plotting otomatis. Admin tetap mencatat kelompok, lokasi, peserta, dan DPL di Sibermas.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MANUAL.map(([key, label]) => (
              <div 
                key={key} 
                className={`border p-4 ${themeConfig.shadow} ${surfaceClass} border-[color:var(--profile-border)] flex flex-col justify-between transition hover:-translate-y-1 hover:border-[color:var(--profile-primary)] hover:shadow-xl`}
                style={{ borderRadius: 'var(--profile-radius)' }}
              >
                <div>
                  <h3 className="font-black text-[color:var(--profile-text)]">{label}</h3>
                  <p className="mt-1 text-xs text-[color:var(--profile-muted)]">Mode input manual</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link 
                    href={`/admin/kelompok?jenis_kkn=${key}&mode=manual`} 
                    className={`rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 ${PRIMARY_CLASS}`}
                  >
                    Buat/Review Kelompok
                  </Link>
                  <Link 
                    href={`/admin/dosen/penugasan?jenis_kkn=${key}&mode=manual`}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 ${SOFT_CLASS}`}
                  >
                    Assign DPL
                  </Link>
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
  const { config: themeConfig, surfaceClass } = useTheme();
  return (
    <Link 
      href={href} 
      className={`group border p-4 transition hover:-translate-y-1 hover:border-[color:var(--profile-primary)] hover:shadow-xl ${themeConfig.shadow} ${surfaceClass} border-[color:var(--profile-border)]`}
      style={{ borderRadius: 'var(--profile-radius)' }}
    >
      <div className="mb-3 inline-flex rounded-xl bg-[color:var(--profile-soft)] p-2 text-[color:var(--profile-soft-text)] transition group-hover:scale-110">{icon}</div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black text-[color:var(--profile-text)]">{title}</h3>
        <ArrowRight className="h-4 w-4 text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-text)]" />
      </div>
      <p className="mt-1 text-xs text-[color:var(--profile-muted)]">{desc}</p>
    </Link>
  );
}
