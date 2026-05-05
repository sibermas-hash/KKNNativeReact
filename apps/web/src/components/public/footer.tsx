import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-emerald-100 bg-white py-14 sm:py-20">
      <div className="mx-auto grid max-w-[1920px] gap-16 px-6 sm:px-10 lg:grid-cols-3 lg:px-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <img src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" className="h-12 w-auto object-contain" />
            <div className="w-px h-8 bg-emerald-100" />
            <img src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" className="h-12 w-auto object-contain" />
          </div>
          <p className="max-w-md text-[0.92rem] leading-relaxed text-slate-500 font-medium">
            Sistem Informasi Pengabdian Masyarakat terpadu LPPM UIN SAIZU Purwokerto. 
            Membangun kemitraan dan pemberdayaan masyarakat yang berkelanjutan.
          </p>
        </div>

        <div className="space-y-8">
          <h3 className="font-display text-xs font-black uppercase tracking-[0.25em] text-emerald-950">Informasi Kontak</h3>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-emerald-600" />
              <span>Jl. Jend. A. Yani No. 40, Purwokerto, Jawa Tengah</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-emerald-600" />
              <span>(0281) 635624</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-emerald-600" />
              <span>lppm@uinsaizu.ac.id</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="font-display text-xs font-black uppercase tracking-[0.25em] text-emerald-950">Tautan Cepat</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-semibold text-slate-500">
            <Link href="/" className="hover:text-emerald-700 transition-colors">Beranda</Link>
            <Link href="/berita" className="hover:text-emerald-700 transition-colors">Warta KKN</Link>
            <Link href="/lokasi" className="hover:text-emerald-700 transition-colors">Sebaran Lokasi</Link>
            <Link href="/unduhan" className="hover:text-emerald-700 transition-colors">Pusat Unduhan</Link>
            <Link href="/login" className="hover:text-emerald-700 transition-colors">Akses Portal</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-emerald-100 px-6 pt-8 lg:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          &copy; {currentYear} LPPM UIN SAIZU Purwokerto
        </p>
      </div>
    </footer>
  );
}
