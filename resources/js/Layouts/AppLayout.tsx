import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { User } from '@/types';
import { 
  Menu, 
  ChevronDown, 
  LogOut, 
  Bell, 
  Search
} from 'lucide-react';
import Sidebar from '@/Components/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { auth } = usePage<{ auth: { user: User | null } }>().props;

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans text-slate-700">
      <Head title={title ? `${title} - KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

      {/* Google Fonts - Refined Selection */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* TOP NAVBAR - CLEAN & AIRY */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-white/70 backdrop-blur-md px-8 border-b border-slate-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-50 lg:hidden transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Page Info Area */}
          <div className="hidden lg:flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            
            {/* Breadcrumbs - Inline & Subtle */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {breadcrumbs.map((bc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {bc.href ? (
                      <Link href={bc.href} className="hover:text-primary transition-colors">{bc.label}</Link>
                    ) : (
                      <span>{bc.label}</span>
                    )}
                    {i < breadcrumbs.length - 1 && <span className="text-slate-300">/</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            {/* SEARCH BOX - MINIMAL */}
            <div className="hidden md:flex items-center relative group">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search system..." 
                    className="bg-slate-50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/10 transition-all w-64"
                />
            </div>

            <div className="h-6 w-px bg-slate-100 hidden sm:block" />

            {/* NOTIFICATIONS */}
            <button className="relative p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* USER PROFILE - CLEAN */}
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-sm font-black border border-primary/20 shadow-sm transition-transform group-hover:scale-105 duration-300">
                {auth?.user?.name?.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-none">{auth?.user?.name}</p>
                <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tight">{auth?.user?.roles?.[0] || 'Member'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>

            {/* QUICK LOGOUT */}
            <Link
              href="/logout"
              method="post"
              as="button"
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 hover:border-red-100"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* MAIN BACKGROUND WITH TEXTURE */}
        <main className="flex-1 px-8 py-10 w-full relative">
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-50 to-transparent -z-10" />
          
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>

        {/* REFINED FOOTER */}
        <footer className="px-10 py-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
          <p className="text-[11px] font-bold uppercase tracking-widest leading-none">
            © 2026 UIN SAIZU <span className="mx-2 text-slate-200">|</span> <span className="text-primary italic">Manajemen KKN</span>
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-[11px] font-black hover:text-slate-600 transition-colors">HELP DESK</Link>
            <div className="w-1 h-1 rounded-full bg-slate-200 mt-1" />
            <span className="text-[11px] font-black">V3.1.2</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
