import { useState, useEffect, type PropsWithChildren } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import Sidebar from '@/Components/Sidebar';
import PeriodSelector from '@/Components/PeriodSelector';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { ToastProvider, useToast } from '@/Contexts/ToastContext';
import BellDropdown from '@/Components/Layout/BellDropdown';

function AppLayoutContent({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  const { auth, flash } = usePage<PageProps>().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Convert flash messages to toasts
  useEffect(() => {
    if (flash?.success) toast({ title: 'Success', message: flash.success as string, priority: 'success' });
    if (flash?.error) toast({ title: 'Error', message: flash.error as string, priority: 'error' });
    if (flash?.warning) toast({ title: 'Warning', message: flash.warning as string, priority: 'warning' });
    if (flash?.info) toast({ title: 'Info', message: flash.info as string, priority: 'info' });
  }, [flash, toast]);

  return (
    <div className="min-h-screen bg-[#0a0f1d]">
      <Head title={title} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-[#0a0f1d]/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {title && (
            <h1 className="text-lg font-black text-white tracking-tight">{title}</h1>
          )}

          <div className="ml-auto flex items-center gap-4">
            <PeriodSelector />
            <BellDropdown />

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            <span className="hidden text-sm font-bold text-slate-300 sm:block">
              {auth?.user?.name}
            </span>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout(props: PropsWithChildren<{ title?: string }>) {
  return (
    <ToastProvider>
      <AppLayoutContent {...props} />
    </ToastProvider>
  );
}
