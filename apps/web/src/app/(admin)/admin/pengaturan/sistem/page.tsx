import Link from 'next/link';
import { Bell, BookOpenCheck, FileBadge2, Settings, Shield, Users } from 'lucide-react';

const cards = [
  { title: 'Manajemen Pengguna', desc: 'Kelola akun, role, status, reset password.', href: '/admin/pengguna', icon: Users },
  { title: 'Perubahan Profil', desc: 'Review pengajuan perubahan data mahasiswa/dosen.', href: '/admin/profile-change-requests', icon: Shield },
  { title: 'Pengaturan Notifikasi', desc: 'Default kanal notifikasi seluruh user.', href: '/admin/pengaturan/notifikasi', icon: Bell },
  { title: 'Skema Penilaian', desc: 'Konfigurasi bobot dan komponen nilai.', href: '/admin/pengaturan/penilaian', icon: BookOpenCheck },
  { title: 'Template Sertifikat', desc: 'Pengaturan sertifikat dan aset output.', href: '/admin/pengaturan/sertifikat', icon: FileBadge2 },
];

export default function SystemSettingsPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-800 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Settings size={24} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">System Hub</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Pengaturan Global</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">Pusat konfigurasi superadmin. Pilih modul pengaturan di bawah.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, desc, href, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white">
                <Icon size={20} />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
