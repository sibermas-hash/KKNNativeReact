"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Shuffle, Users, ArrowRight, Settings2, UserPlus, Upload, GraduationCap, EyeOff } from "lucide-react";
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

type ManualKey = (typeof MANUAL)[number][0];

function isManualKey(value: string | null): value is ManualKey {
  return MANUAL.some(([key]) => key === value);
}

export default function PenempatanKknPage(): React.JSX.Element {
  const params = useSearchParams();
  const mode = params?.get("mode") ?? "otomatis";
  const isManual = mode === "manual";
  const jenisParam = params?.get("jenis") ?? null;
  const activeJenis: ManualKey = isManualKey(jenisParam) ? jenisParam : "nusantara";
  const activeLabel = MANUAL.find(([key]) => key === activeJenis)?.[1] ?? "KKN Nusantara";
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
              <p className={`mt-1 text-sm ${!isManual ? "text-[color:var(--profile-soft-text)] opacity-90" : "text-[color:var(--profile-muted)]"}`}>Checklist wilayah → plotting otomatis → review kelompok.</p>
            </div>
          </div>
        </Link>
        <Link
          href={`/admin/penempatan?mode=manual&jenis=${activeJenis}`}
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
              <p className={`mt-1 text-sm ${isManual ? "text-[color:var(--profile-soft-text)] opacity-90" : "text-[color:var(--profile-muted)]"}`}>Switch jenis KKN → kelola kelompok → tambah peserta → assign DPL.</p>
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-[color:var(--profile-soft-text)]">Dashboard Manual Non-Reguler</div>
              <h2 className="mt-1 text-xl font-black text-[color:var(--profile-text)]">{activeLabel}</h2>
              <p className="mt-2 text-sm text-[color:var(--profile-muted)]">Satu halaman untuk switch jenis KKN. Pilih jenis, lalu lanjut kelola kelompok, peserta, import/export, dan DPL.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-800">Mode manual</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {MANUAL.map(([key, label]) => {
              const active = key === activeJenis;
              return (
                <Link
                  key={key}
                  href={`/admin/penempatan?mode=manual&jenis=${key}`}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                    active
                      ? "border-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] text-[color:var(--profile-text)] ring-2 ring-[color:var(--profile-ring)]"
                      : `${surfaceClass} border-[color:var(--profile-border)] text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)]`
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Action href={`/admin/kelompok?jenis_kkn=${activeJenis}&mode=manual`} icon={<Users className="h-5 w-5" />} title="1. Kelompok" desc={`Buat/review kelompok ${activeLabel}`} />
            <Action href={`/admin/kelompok?jenis_kkn=${activeJenis}&mode=manual`} icon={<UserPlus className="h-5 w-5" />} title="2. Peserta" desc="Masukkan peserta ke kelompok via detail kelompok" />
            <Action href={`/admin/kelompok?jenis_kkn=${activeJenis}&mode=manual`} icon={<Upload className="h-5 w-5" />} title="3. Import/Export" desc="Import Excel kelompok manual + export CSV" />
            <Action href={`/admin/dosen/penugasan?jenis_kkn=${activeJenis}&mode=manual`} icon={<GraduationCap className="h-5 w-5" />} title="4. Assign DPL" desc={`Tugaskan DPL untuk ${activeLabel}`} />
          </div>
          {activeJenis === "kolaborasi_ptkin" && <PtkinDraftPanel surfaceClass={surfaceClass} />}
        </section>
      )}
    </main>
  );
}

function PtkinDraftPanel({ surfaceClass }: { surfaceClass: string }) {
  const rows = [
    { kampus: "UIN GUS DUR PEKALONGAN", kode: "PTKIN-GUSDUR-01", peserta: [
      ["234110404108", "SUCI YUNINDA UTAMI", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Bahasa Inggris"],
      ["234110401118", "SINTA MARYAM", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Manajemen Pendidikan Islam"],
      ["234110407075", "SASKIA MEILANI", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Matematika"],
      ["234110201267", "PUPUT DWI PUSPITA SARI", "P", "Fakultas Ekonomi dan Bisnis Islam", "Ekonomi Syariah"],
      ["234110101182", "FASHA NURUL TANJALI", "P", "Fakultas Dakwah", "Bimbingan dan Konseling Islam"],
      ["234110407060", "IQBAL NUR AKBAR", "L", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Matematika"],
      ["234110202112", "LELI ISNAWATI", "P", "Fakultas Ekonomi dan Bisnis Islam", "Perbankan Syariah"],
      ["234110502020", "SITI NAPISAH", "P", "Fakultas Ushuluddin Adab dan Humaniora", "Studi Agama Agama"],
      ["234110303133", "ZALFA AFIFAH PURWANASIVA", "P", "Fakultas Syariah", "Hukum Tatanegara / Siyasah"],
      ["234110501027", "PUTRI NUR ATIKA", "P", "Fakultas Ushuluddin Adab dan Humaniora", "Ilmu Al-Qur’an dan Tafsir"],
    ] },
    { kampus: "UIN WALISONGO SEMARANG", kode: "PTKIN-WALISONGO-01", peserta: [
      ["234110407059", "GHEFIRA NUR MAULANI AVIVI", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Matematika"],
      ["234110403006", "AVI SELVIANA AL QADR", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Pendidikan Bahasa Arab"],
      ["234110403013", "HANA AFRA IZZAH JAUZA", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Pendidikan Bahasa Arab"],
      ["234110201026", "LIA MUNAWWAROH", "P", "Fakultas Ekonomi dan Bisnis Islam", "Ekonomi Syariah"],
      ["234110102146", "WANDA PURNAMASARI", "P", "Fakultas Dakwah", "Komunikasi dan Penyiaran Islam"],
      ["234110103014", "HANIFA APRIANTI", "P", "Fakultas Dakwah", "Manajemen Dakwah"],
      ["234110404060", "MUHAMMAD SALMAN AL WAFA", "L", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Bahasa Inggris"],
      ["234110201005", "ANNISA GHILDA NUR ZAIN", "P", "Fakultas Ekonomi dan Bisnis Islam", "Ekonomi Syariah"],
      ["234110302068", "RIJAL MUTAMMAM PRASADESPA", "L", "Fakultas Syariah", "Hukum Keluarga / Ahwal Syakhshiyah"],
      ["234110502018", "RIYANTI SUCI RAHAYU", "P", "Fakultas Ushuluddin Adab dan Humaniora", "Studi Agama Agama"],
    ] },
    { kampus: "UIN SUNAN GUNUNG DJATI BANDUNG", kode: "PTKIN-SGD-01", peserta: [
      ["234110404109", "ZAHRA FAOH KAMAL PRASAJA", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Bahasa Inggris"],
      ["234110101063", "LUTFIYATUL ADAWIYAH", "P", "Fakultas Dakwah", "Bimbingan dan Konseling Islam"],
      ["234110101221", "FADHILAH ALIMAH ZAHRA", "P", "Fakultas Dakwah", "Bimbingan dan Konseling Islam"],
      ["234110101057", "FADLAH WALIYAH", "P", "Fakultas Dakwah", "Bimbingan dan Konseling Islam"],
      ["234110201177", "NENG FUTRI", "P", "Fakultas Ekonomi dan Bisnis Islam", "Ekonomi Syariah"],
      ["234110406027", "MEGA NUR SEPTIANINGRUM", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Pendidikan Islam Anak Usia Dini"],
      ["234110501083", "MUHAMMAD AGUNG KHADAFI", "L", "Fakultas Ushuluddin Adab dan Humaniora", "Ilmu Al-Qur’an dan Tafsir"],
      ["234110404023", "MEISA NADIA", "P", "Fakultas Tarbiyah dan Ilmu Keguruan", "Tadris Bahasa Inggris"],
      ["234110304006", "LANI KHULIFIANTI", "P", "Fakultas Syariah", "Perbandingan Madzhab"],
      ["234110504001", "ADAM MULYA RIZQY", "L", "Fakultas Ushuluddin Adab dan Humaniora", "Tasawuf dan Psikoterapi"],
    ] },
  ];
  const total = rows.reduce((sum, row) => sum + row.peserta.length, 0);
  return (
    <div className={`mt-6 border p-5 ${surfaceClass} border-amber-200 bg-amber-50/60`} style={{ borderRadius: 'var(--profile-radius)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-800"><EyeOff className="h-3.5 w-3.5" /> Draft internal — belum publish</div>
          <h3 className="mt-3 text-lg font-black text-[color:var(--profile-text)]">Preview Detail Plotting PTKIN</h3>
          <p className="mt-1 text-sm text-[color:var(--profile-muted)]">Rumus: 1 kampus mitra = 1 kelompok, kapasitas 10 mahasiswa. Preview admin-only, belum simpan DB, belum live untuk mahasiswa.</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-amber-100">
          <div className="text-2xl font-black text-amber-700">{total}</div>
          <div className="text-[11px] font-bold uppercase text-amber-700">mahasiswa / {rows.length} kelompok</div>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {rows.map((row) => {
          const l = row.peserta.filter((p) => p[2] === "L").length;
          const p = row.peserta.length - l;
          return (
            <details key={row.kode} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm" open={false}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase text-amber-700">{row.kode}</p>
                    <h4 className="mt-1 font-black text-slate-900">{row.kampus}</h4>
                    <p className="mt-1 text-xs text-slate-500">Lokasi manual: {row.kampus}</p>
                  </div>
                  <div className="text-right text-sm font-bold text-slate-700">{row.peserta.length} mahasiswa<br /><span className="text-xs text-slate-500">L {l} / P {p}</span></div>
                </div>
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr><th className="px-3 py-2">NIM</th><th className="px-3 py-2">Nama</th><th className="px-3 py-2">JK</th><th className="px-3 py-2">Fakultas</th><th className="px-3 py-2">Prodi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {row.peserta.map((mhs) => (
                      <tr key={mhs[0]}><td className="px-3 py-2 font-mono">{mhs[0]}</td><td className="px-3 py-2 font-bold text-slate-800">{mhs[1]}</td><td className="px-3 py-2">{mhs[2]}</td><td className="px-3 py-2">{mhs[3]}</td><td className="px-3 py-2">{mhs[4]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </div>
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
