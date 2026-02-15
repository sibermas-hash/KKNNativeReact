import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/Components/Sidebar';
import PeriodSelector from '@/Components/PeriodSelector';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { auth } = usePage().props as any;

  return (
    <div className="min-h-screen bg-surface-base font-sans selection:bg-primary/20 selection:text-primary">
      <Head title={title ? `${title} - KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

      {/* Design System Injection for Outfit Font */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Header - Glassmorphism Light */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-100 bg-white/80 px-8 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2.25 text-slate-500 transition-all hover:bg-slate-100 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary opacity-50" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none px-2">{title}</h1>
          </div>

          <div className="ml-auto flex items-center gap-6">
            {/* Global Dynamic Period Selector */}
            <div className="hidden sm:block">
              <PeriodSelector />
            </div>

            <div className="h-8 w-px bg-slate-100 hidden sm:block" />

            <div className="flex items-center gap-3 group px-4 py-2 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-black shadow-sm group-hover:bg-primary transition-colors">
                {auth?.user?.name?.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black text-slate-900 tracking-tight leading-none uppercase">{auth?.user?.name}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{auth?.user?.roles?.[0] || 'User'}</p>
              </div>
              <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            </div>

            <Link
              href="/logout"
              method="post"
              as="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
              title="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-8 py-10 max-w-[1600px] mx-auto w-full transition-all duration-500">
          {/* Page Breadcrumbs - Minimalist */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
              {breadcrumbs.map((bc, i) => (
                <div key={i} className="flex items-center gap-2">
                  {bc.href ? (
                    <Link href={bc.href} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">{bc.label}</Link>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{bc.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="text-slate-300 text-xs">/</span>}
                </div>
              ))}
            </div>
          )}
          {children}
        </main>

        {/* Footer - Subtle */}
        <footer className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 LPPM UIN Saizu - Management Intelligence Platform</p>
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 italic">Privacy Secured</span>
            <span className="px-3 py-1 bg-primary/5 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest border border-primary/10">v2.1.0-STABLE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
