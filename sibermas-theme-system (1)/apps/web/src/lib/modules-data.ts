// apps/web/src/lib/modules-data.ts
// Sample data for the Mahasiswa, Laporan, and Jadwal modules.
// Statuses use the tones recognised by StatusBadge:
//   neutral: Aktif/Selesai/Disetujui · warning: Review/Menunggu · danger: Ditolak/Nonaktif

export type Mahasiswa = {
  id: string;
  initials: string;
  name: string;
  nim: string;
  prodi: string;
  desa: string;
  dpl: string;
  status: string;
  progress: number;
  email: string;
  phone: string;
};

export type LogItem = { tanggal: string; judul: string; status: string };

export type Laporan = {
  id: string;
  judul: string;
  mahasiswa: string;
  desa: string;
  tanggal: string;
  jenis: string;
  status: string;
};

export type Jadwal = {
  id: string;
  kegiatan: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  kategori: string;
  status: string;
};

export const mahasiswaList: Mahasiswa[] = [
  {
    id: "m1",
    initials: "AT",
    name: "Akun Tholib",
    nim: "2017101001",
    prodi: "Teknik Informatika",
    desa: "Sukamaju",
    dpl: "Dr. Hasan",
    status: "Aktif",
    progress: 90,
    email: "tholib@uinsaizu.ac.id",
    phone: "0812-1111-2222",
  },
  {
    id: "m2",
    initials: "SA",
    name: "Siti Aisyah",
    nim: "2017101002",
    prodi: "Ekonomi Syariah",
    desa: "Mekarsari",
    dpl: "Dr. Fauzan",
    status: "Review",
    progress: 60,
    email: "siti@uinsaizu.ac.id",
    phone: "0812-1111-3333",
  },
  {
    id: "m3",
    initials: "BS",
    name: "Budi Santoso",
    nim: "2017101003",
    prodi: "Hukum Keluarga",
    desa: "Cibadak",
    dpl: "Dr. Hasan",
    status: "Aktif",
    progress: 75,
    email: "budi@uinsaizu.ac.id",
    phone: "0812-1111-4444",
  },
  {
    id: "m4",
    initials: "RW",
    name: "Rina Wati",
    nim: "2017101004",
    prodi: "Pendidikan Agama",
    desa: "Sumberejo",
    dpl: "Dr. Laila",
    status: "Ditolak",
    progress: 20,
    email: "rina@uinsaizu.ac.id",
    phone: "0812-1111-5555",
  },
  {
    id: "m5",
    initials: "DC",
    name: "Dani Cahya",
    nim: "2017101005",
    prodi: "Komunikasi Islam",
    desa: "Mulyasari",
    dpl: "Dr. Fauzan",
    status: "Aktif",
    progress: 55,
    email: "dani@uinsaizu.ac.id",
    phone: "0812-1111-6666",
  },
  {
    id: "m6",
    initials: "LP",
    name: "Lia Pratiwi",
    nim: "2017101006",
    prodi: "Manajemen Dakwah",
    desa: "Sumberarum",
    dpl: "Dr. Laila",
    status: "Review",
    progress: 48,
    email: "lia@uinsaizu.ac.id",
    phone: "0812-1111-7777",
  },
  {
    id: "m7",
    initials: "FH",
    name: "Fajar Hidayat",
    nim: "2017101007",
    prodi: "Teknik Informatika",
    desa: "Sukamaju",
    dpl: "Dr. Hasan",
    status: "Selesai",
    progress: 100,
    email: "fajar@uinsaizu.ac.id",
    phone: "0812-1111-8888",
  },
  {
    id: "m8",
    initials: "NK",
    name: "Nur Kholis",
    nim: "2017101008",
    prodi: "Ekonomi Syariah",
    desa: "Cibadak",
    dpl: "Dr. Fauzan",
    status: "Aktif",
    progress: 67,
    email: "nur@uinsaizu.ac.id",
    phone: "0812-1111-9999",
  },
];

export const logbookByMhs: Record<string, LogItem[]> = {
  m1: [
    {
      tanggal: "02 Jun 2026",
      judul: "Survey lokasi & audiensi perangkat desa",
      status: "Disetujui",
    },
    {
      tanggal: "05 Jun 2026",
      judul: "Sosialisasi program Posyandu Digital",
      status: "Disetujui",
    },
    {
      tanggal: "08 Jun 2026",
      judul: "Pelatihan input data balita",
      status: "Review",
    },
    {
      tanggal: "11 Jun 2026",
      judul: "Evaluasi mingguan bersama DPL",
      status: "Menunggu",
    },
  ],
  m2: [
    {
      tanggal: "03 Jun 2026",
      judul: "Pemetaan UMKM desa",
      status: "Disetujui",
    },
    {
      tanggal: "07 Jun 2026",
      judul: "Workshop pembukuan sederhana",
      status: "Review",
    },
  ],
  m4: [
    {
      tanggal: "04 Jun 2026",
      judul: "Rencana program literasi",
      status: "Ditolak",
    },
  ],
};

export const laporanList: Laporan[] = [
  {
    id: "l1",
    judul: "Laporan Mingguan #3 — Posyandu Digital",
    mahasiswa: "Akun Tholib",
    desa: "Sukamaju",
    tanggal: "08 Jun 2026",
    jenis: "Mingguan",
    status: "Disetujui",
  },
  {
    id: "l2",
    judul: "Laporan UMKM Go Online",
    mahasiswa: "Siti Aisyah",
    desa: "Mekarsari",
    tanggal: "07 Jun 2026",
    jenis: "Program",
    status: "Review",
  },
  {
    id: "l3",
    judul: "Laporan Bank Sampah",
    mahasiswa: "Nur Kholis",
    desa: "Cibadak",
    tanggal: "06 Jun 2026",
    jenis: "Program",
    status: "Disetujui",
  },
  {
    id: "l4",
    judul: "Proposal Literasi Anak",
    mahasiswa: "Rina Wati",
    desa: "Sumberejo",
    tanggal: "05 Jun 2026",
    jenis: "Proposal",
    status: "Ditolak",
  },
  {
    id: "l5",
    judul: "Laporan Mingguan #2",
    mahasiswa: "Budi Santoso",
    desa: "Cibadak",
    tanggal: "05 Jun 2026",
    jenis: "Mingguan",
    status: "Disetujui",
  },
  {
    id: "l6",
    judul: "Laporan Kegiatan Surya Desa",
    mahasiswa: "Dani Cahya",
    desa: "Mulyasari",
    tanggal: "04 Jun 2026",
    jenis: "Program",
    status: "Review",
  },
  {
    id: "l7",
    judul: "Laporan Akhir KKN",
    mahasiswa: "Fajar Hidayat",
    desa: "Sukamaju",
    tanggal: "03 Jun 2026",
    jenis: "Akhir",
    status: "Disetujui",
  },
  {
    id: "l8",
    judul: "Laporan Edukasi Warga",
    mahasiswa: "Lia Pratiwi",
    desa: "Sumberarum",
    tanggal: "02 Jun 2026",
    jenis: "Program",
    status: "Menunggu",
  },
];

// 12 bulan (jumlah laporan masuk per bulan).
export const laporanPerBulan: number[] = [
  3, 5, 4, 7, 6, 9, 8, 11, 9, 10, 8, 12,
];

export const jadwalList: Jadwal[] = [
  {
    id: "j1",
    kegiatan: "Pembekalan KKN Gelombang II",
    tanggal: "09 Jun 2026",
    waktu: "08.00 – 11.00",
    lokasi: "Auditorium UIN Saizu",
    kategori: "Akademik",
    status: "Terjadwal",
  },
  {
    id: "j2",
    kegiatan: "Penerjunan ke lokasi",
    tanggal: "12 Jun 2026",
    waktu: "07.00 – selesai",
    lokasi: "Kecamatan Baturraden",
    kategori: "Lapangan",
    status: "Terjadwal",
  },
  {
    id: "j3",
    kegiatan: "Monitoring DPL minggu I",
    tanggal: "19 Jun 2026",
    waktu: "09.00 – 12.00",
    lokasi: "Desa Sukamaju",
    kategori: "Monitoring",
    status: "Terjadwal",
  },
  {
    id: "j4",
    kegiatan: "Lokakarya tengah program",
    tanggal: "26 Jun 2026",
    waktu: "13.00 – 16.00",
    lokasi: "Balai Desa Mekarsari",
    kategori: "Akademik",
    status: "Terjadwal",
  },
  {
    id: "j5",
    kegiatan: "Monitoring DPL minggu III",
    tanggal: "03 Jul 2026",
    waktu: "09.00 – 12.00",
    lokasi: "Desa Cibadak",
    kategori: "Monitoring",
    status: "Terjadwal",
  },
  {
    id: "j6",
    kegiatan: "Penarikan & seminar hasil",
    tanggal: "24 Jul 2026",
    waktu: "08.00 – 15.00",
    lokasi: "Auditorium UIN Saizu",
    kategori: "Akademik",
    status: "Terjadwal",
  },
];

export type Desa = {
  id: string;
  nama: string;
  kecamatan: string;
  mahasiswa: number;
  program: number;
  status: string;
};

export const desaList: Desa[] = [
  {
    id: "d1",
    nama: "Sukamaju",
    kecamatan: "Baturraden",
    mahasiswa: 6,
    program: 4,
    status: "Aktif",
  },
  {
    id: "d2",
    nama: "Mekarsari",
    kecamatan: "Baturraden",
    mahasiswa: 5,
    program: 3,
    status: "Aktif",
  },
  {
    id: "d3",
    nama: "Cibadak",
    kecamatan: "Sumbang",
    mahasiswa: 7,
    program: 5,
    status: "Aktif",
  },
  {
    id: "d4",
    nama: "Sumberejo",
    kecamatan: "Sumbang",
    mahasiswa: 4,
    program: 2,
    status: "Review",
  },
  {
    id: "d5",
    nama: "Mulyasari",
    kecamatan: "Kedungbanteng",
    mahasiswa: 5,
    program: 3,
    status: "Aktif",
  },
  {
    id: "d6",
    nama: "Sumberarum",
    kecamatan: "Kedungbanteng",
    mahasiswa: 5,
    program: 4,
    status: "Aktif",
  },
];
