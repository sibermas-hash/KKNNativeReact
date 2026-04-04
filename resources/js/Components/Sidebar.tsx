import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef } from 'react';
import type { PageProps } from '@/types';
import {
 LayoutDashboard,
 Calendar,
 MapPin,
 Users2,
 Users,
 ClipboardList,
 FileText,
 Star,
 FolderKanban,
 BarChart3,
 ShieldCheck,
 Award,
 Hammer,
 RefreshCw,
 Shuffle,
 FileSpreadsheet,
 SlidersHorizontal,
 GraduationCap,
 Globe,
 Download,
 Megaphone
} from 'lucide-react';

interface NavItem {
 label: string;
 href: string;
 icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
 title: string;
 items: NavItem[];
}

const adminNav: NavGroup[] = [
 {
 title: 'Utama',
 items: [
 { label: 'Dasbor', href: '/admin', icon: LayoutDashboard },
 ],
 },
 {
 title: 'Data Master',
 items: [
 { label: 'Tahun Akademik', href: '/admin/academic-years', icon: Calendar },
 { label: 'Periode KKN', href: '/admin/periods', icon: Calendar },
 { label: 'Lokasi KKN', href: '/admin/locations', icon: MapPin },
 { label: 'Dosen (DPL)', href: '/admin/dpl', icon: Users },
 { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: GraduationCap },
 { label: 'Cek Eligibility', href: '/admin/eligibility', icon: ShieldCheck },
 ],
 },
 {
 title: 'Operasional',
 items: [
 { label: 'Kelompok', href: '/admin/groups', icon: Users2 },
 { label: 'Penugasan DPL', href: '/admin/dpl/assignment', icon: Users },
 { label: 'Transfer Peserta', href: '/admin/peserta/transfer', icon: Shuffle },
 { label: 'Pengguna', href: '/admin/users', icon: Users },
 { label: 'Pendaftaran', href: '/admin/registrations', icon: ClipboardList },
 ],
 },
 {
 title: 'Integrasi',
 items: [
 { label: 'Sinkronisasi Mahasiswa', href: '/admin/mahasiswa/sync', icon: RefreshCw },
 { label: 'Sinkronisasi DPL', href: '/admin/dpl/sync', icon: RefreshCw },
 ],
 },
 {
 title: 'Aktivitas & Laporan',
 items: [
 { label: 'Pusat Laporan', href: '/admin/reports', icon: FileText },
 { label: 'Laporan Harian', href: '/admin/reports/daily', icon: FileText },
 { label: 'Proker', href: '/admin/reports/work-programs', icon: FolderKanban },
 { label: 'Laporan Akhir', href: '/admin/reports/final', icon: FileText },
 { label: 'Evaluasi & Nilai', href: '/admin/evaluations', icon: BarChart3 },
 { label: 'Generator Nilai', href: '/admin/grade-generator', icon: FileSpreadsheet },
 { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: Award },
 { label: 'Input Nilai Manual', href: '/admin/grades', icon: BarChart3 },
 { label: 'Pembekalan', href: '/admin/workshops', icon: Calendar },
 { label: 'Log Audit', href: '/admin/audit-log', icon: ShieldCheck },
 ],
 },
 {
 title: 'Manajemen Konten',
 items: [
 { label: 'Profil LPPM', href: '/admin/content/profile', icon: Globe },
 { label: 'Skema KKN', href: '/admin/content/schemes', icon: FolderKanban },
 { label: 'Warta', href: '/admin/announcements', icon: Megaphone },
 { label: 'Repositori', href: '/admin/downloads', icon: Download },
 ],
 },
 {
 title: 'Pengaturan',
 items: [
 { label: 'Sistem Nilai', href: '/admin/grading-settings', icon: Hammer },
 { label: 'Sertifikat', href: '/admin/settings/certificate', icon: Award },
 { label: 'Pengaturan Sistem', href: '/admin/settings/system', icon: SlidersHorizontal },
 ],
 },
];

const dplNav: NavGroup[] = [
 {
 title: 'Dasbor',
 items: [
 { label: 'Dasbor DPL', href: '/dpl', icon: LayoutDashboard },
 { label: 'Kelompok Saya', href: '/dpl/groups', icon: Users2 },
 ],
 },
 {
 title: 'Kegiatan Bimbingan',
 items: [
 { label: 'Laporan Harian', href: '/dpl/daily-reports', icon: FileText },
 { label: 'Laporan Akhir', href: '/dpl/final-reports', icon: FileText },
 { label: 'Evaluasi Mahasiswa', href: '/dpl/evaluations', icon: Star },
 { label: 'Generator Nilai', href: '/admin/grade-generator', icon: FileSpreadsheet },
 ],
 },
];

const facultyAdminNav: NavGroup[] = [
 {
 title: 'Nilai Fakultas',
 items: [
 { label: 'Dasbor', href: '/dashboard', icon: LayoutDashboard },
 { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: Award },
 ],
 },
];

const studentNav: NavGroup[] = [
 {
 title: 'Dasbor',
 items: [
 { label: 'Dasbor Saya', href: '/student', icon: LayoutDashboard },
 { label: 'Pendaftaran', href: '/student/register', icon: ClipboardList },
 ],
 },
 {
 title: 'Kegiatan KKN',
 items: [
 { label: 'Posko Kelompok', href: '/student/posko', icon: MapPin },
 { label: 'Laporan Harian', href: '/student/daily-reports', icon: FileText },
 { label: 'Program Kerja', href: '/student/work-programs', icon: FolderKanban },
 { label: 'Laporan Akhir', href: '/student/final-report', icon: FileText },
 { label: 'Cek Nilai', href: '/student/evaluations', icon: Award },
 ],
 },
];

function getNavForRole(roles: string[]): NavGroup[] {
 const norm = roles.map(r => r.toLowerCase());
 if (norm.includes('admin') || norm.includes('superadmin')) return adminNav;
 if (norm.includes('faculty_admin') || norm.includes('admin fakultas') || norm.includes('administrator fakultas')) return facultyAdminNav;
 if (norm.includes('dpl') || norm.includes('dosen')) return dplNav;
 return studentNav;
}

interface SidebarProps {
 open: boolean;
 onClose: () => void;
}

const SIDEBAR_SCROLL_KEY = 'kkn-sidebar-scroll-top';

export default function Sidebar({ open, onClose }: SidebarProps) {
 const { auth, url } = usePage<PageProps & { url: string }>().props;
 
 // Handle different role formats from Spatie (sometimes objects, sometimes strings)
 const rawRoles = auth.user?.roles ?? [];
 const roles = Array.isArray(rawRoles) 
 ? rawRoles.map(r => typeof r === 'object' ? (r as any).name : String(r))
 : [];

 const navGroups = getNavForRole(roles);
 const currentPath = typeof url === 'string' ? url : window.location.pathname;
 const navRef = useRef<HTMLElement | null>(null);

 useLayoutEffect(() => {
 const nav = navRef.current;

 if (!nav) {
 return;
 }

 const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
 const targetScrollTop = savedScrollTop !== null ? Number(savedScrollTop) : 0;

 nav.scrollTop = targetScrollTop;

 const restoreOnNextFrame = window.requestAnimationFrame(() => {
 nav.scrollTop = targetScrollTop;
 });

 const persistScrollPosition = () => {
 window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
 };

 nav.addEventListener('scroll', persistScrollPosition);

 return () => {
 window.cancelAnimationFrame(restoreOnNextFrame);
 persistScrollPosition();
 nav.removeEventListener('scroll', persistScrollPosition);
 };
 }, [currentPath]);

 return (
 <>
 {/* Mobile Overlay */}
 {open && (
 <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={onClose} />
 )}

 <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>

  {/* Logo Sinar Dunia Style */}
  <div className="h-20 flex items-center gap-4 px-6 border-b-4 border-emerald-500 bg-white">
  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
  <Globe className="w-6 h-6" />
  </div>
  <div>
  <span className="font-black text-[13px] text-slate-950 tracking-tighter block leading-none uppercase">UIN <span className="text-emerald-500">Prof. K.H. Saifuddin Zuhri</span></span>
  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">SIM_PORTAL_V3</span>
  </div>
  </div>

 {/* Navigation */}
 <nav ref={navRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
 {navGroups.map((group) => (
 <div key={group.title} className="space-y-1">
 <h3 className="px-3 text-xs font-semibold text-slate-500">
 {group.title}
 </h3>
 <div className="space-y-1">
 {group.items.map((item) => {
 const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => {
 if (navRef.current) {
 window.sessionStorage.setItem(
 SIDEBAR_SCROLL_KEY,
 String(navRef.current.scrollTop),
 );
 }
 if (window.innerWidth < 1024) onClose();
 }}
  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all relative overflow-hidden group ${
  isActive
  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
  : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
  }`}
  >
  {isActive && (
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
  )}
  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} />
  <span className="uppercase tracking-widest text-[11px]">{item.label}</span>
  </Link>
 );
 })}
 </div>
 </div>
 ))}
 </nav>

 {/* User Card */}
 <div className="p-3 border-t border-slate-200">
 <div className="flex items-center gap-2 p-2 rounded bg-slate-100">
 <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold">
 {auth.user?.name?.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0 flex-1">
 <span className="text-xs font-semibold text-slate-900 truncate">{auth.user?.name}</span>
 <Link href="/logout" method="post" as="button" className="text-[10px] text-red-500 hover:text-red-600 font-medium">
 Keluar
 </Link>
 </div>
 </div>
 </div>
 </aside>
 </>
 );
}
