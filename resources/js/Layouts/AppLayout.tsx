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
    <div className="min-h-screen bg-white text-slate-700">
      <Head title={title ? `${title} - KKN UIN SAIZU` : 'SIM-KKN UIN SAIZU'} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center gap-4 bg-white border-b border-slate-200 px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="hidden lg:block text-lg font-semibold text-slate-900">{title}</h1>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded text-sm">
              <span className="text-slate-600">{auth?.user?.name}</span>
            </div>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            >
              Keluar
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-6 py-6 w-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <p>© 2026 UIN SAIZU - Manajemen KKN</p>
          <span>V3.1.2</span>
        </footer>
      </div>
    </div>
  );
}
