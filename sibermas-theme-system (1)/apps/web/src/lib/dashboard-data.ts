// apps/web/src/lib/dashboard-data.ts
// Shared dashboard data model consumed by every per-theme layout.
// Each layout arranges the SAME data in its own distinct structure.

export type Stat = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  spark?: number[];
};
export type Kpi = { label: string; value: string };
export type Activity = {
  initials: string;
  name: string;
  desa: string;
  status: string;
  progress: number;
};
export type Program = { title: string; desa: string; progress: number };
export type DonutSeg = { label: string; value: number; color: string };
export type ImpactTile = {
  label: string;
  value: string;
  gradient: string;
  spark?: number[];
};
export type ProgressItem = { label: string; pct: number };

export type DashboardData = {
  title: string;
  breadcrumb: string;
  org: string;
  stats: Stat[];
  kpis: Kpi[];
  activities: Activity[];
  programs: Program[];
  donut: DonutSeg[];
  barData: number[];
  barLabels: string[];
  impact: ImpactTile[];
  progress: ProgressItem[];
};

export const sampleDashboard: DashboardData = {
  title: "Beranda KKN",
  breadcrumb: "Dashboard  /  Ringkasan",
  org: "Sistem Informasi KKN · UIN Saizu",
  stats: [
    {
      label: "Mahasiswa",
      value: "128",
      delta: "+8%",
      trend: "up",
      spark: [4, 6, 5, 8, 7, 9, 11],
    },
    {
      label: "Desa Lokasi",
      value: "32",
      delta: "+2",
      trend: "up",
      spark: [2, 3, 3, 4, 4, 5, 5],
    },
    {
      label: "Laporan Masuk",
      value: "94%",
      delta: "+5%",
      trend: "up",
      spark: [6, 5, 7, 6, 8, 8, 9],
    },
    {
      label: "Kegiatan",
      value: "17",
      delta: "-3%",
      trend: "down",
      spark: [8, 7, 7, 6, 6, 5, 5],
    },
  ],
  kpis: [
    { label: "Mahasiswa", value: "128" },
    { label: "Desa", value: "32" },
    { label: "Laporan", value: "94%" },
    { label: "Kegiatan", value: "17" },
    { label: "Aktif", value: "62%" },
    { label: "Review", value: "26%" },
  ],
  activities: [
    {
      initials: "AT",
      name: "Akun Tholib",
      desa: "Sukamaju",
      status: "Aktif",
      progress: 90,
    },
    {
      initials: "SA",
      name: "Siti Aisyah",
      desa: "Mekarsari",
      status: "Review",
      progress: 60,
    },
    {
      initials: "BS",
      name: "Budi Santoso",
      desa: "Cibadak",
      status: "Aktif",
      progress: 75,
    },
    {
      initials: "RW",
      name: "Rina Wati",
      desa: "Sumberejo",
      status: "Ditolak",
      progress: 20,
    },
    {
      initials: "DC",
      name: "Dani Cahya",
      desa: "Mulyasari",
      status: "Aktif",
      progress: 55,
    },
    {
      initials: "LP",
      name: "Lia Pratiwi",
      desa: "Sumberarum",
      status: "Review",
      progress: 48,
    },
  ],
  programs: [
    { title: "Posyandu Digital", desa: "Sukamaju", progress: 78 },
    { title: "Bank Sampah", desa: "Mekarsari", progress: 64 },
    { title: "Literasi Anak", desa: "Cibadak", progress: 52 },
    { title: "UMKM Go Online", desa: "Mulyasari", progress: 40 },
  ],
  donut: [
    { label: "Aktif", value: 62, color: "var(--profile-primary)" },
    { label: "Review", value: 26, color: "var(--profile-accent)" },
    { label: "Nonaktif", value: 12, color: "var(--profile-muted)" },
  ],
  barData: [5, 7, 6, 9, 7, 11, 8, 12, 9, 10, 8, 13],
  barLabels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  impact: [
    {
      label: "Pohon Ditanam",
      value: "1.240",
      gradient:
        "linear-gradient(135deg, var(--profile-primary), var(--profile-accent))",
      spark: [3, 5, 4, 6, 7, 9],
    },
    {
      label: "Sampah Dikelola",
      value: "3.8 t",
      gradient:
        "linear-gradient(135deg, var(--profile-primary-hover), var(--profile-primary))",
      spark: [2, 4, 5, 4, 6, 7],
    },
    {
      label: "Desa Hijau",
      value: "18",
      gradient:
        "linear-gradient(135deg, var(--profile-accent), var(--profile-primary))",
      spark: [1, 2, 3, 3, 4, 5],
    },
    {
      label: "Relawan",
      value: "128",
      gradient:
        "linear-gradient(135deg, var(--profile-primary), var(--profile-primary-hover))",
      spark: [4, 5, 6, 7, 8, 9],
    },
    {
      label: "Air Bersih",
      value: "92%",
      gradient:
        "linear-gradient(135deg, var(--profile-accent), var(--profile-primary-hover))",
      spark: [5, 6, 6, 7, 8, 9],
    },
    {
      label: "Energi Surya",
      value: "6 kW",
      gradient:
        "linear-gradient(135deg, var(--profile-primary-hover), var(--profile-accent))",
      spark: [2, 3, 4, 5, 5, 6],
    },
  ],
  progress: [
    { label: "Reboisasi", pct: 78 },
    { label: "Bank Sampah", pct: 64 },
    { label: "Edukasi Warga", pct: 88 },
  ],
};
