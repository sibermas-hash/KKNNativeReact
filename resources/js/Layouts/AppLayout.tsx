import type { PropsWithChildren } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

const flashStyles = {
  success: 'bg-green-50 border-green-400 text-green-700',
  error: 'bg-red-50 border-red-400 text-red-700',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
  info: 'bg-blue-50 border-blue-400 text-blue-700',
};

export default function AppLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  const { auth, flash } = usePage<PageProps>().props;
  const username = auth?.user?.username ?? auth?.user?.name ?? 'Guest';
  const isAuthenticated = Boolean(auth?.user);
  const flashItems = [
    { key: 'success', message: flash?.success },
    { key: 'error', message: flash?.error },
    { key: 'warning', message: flash?.warning },
    { key: 'info', message: flash?.info },
  ].filter((item) => item.message);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={title} />

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary">
                  KKN UIN SAIZU
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">{username}</span>
              {isAuthenticated && (
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Logout
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {flashItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-3">
          {flashItems.map((item) => (
            <div
              key={item.key}
              className={`border-l-4 p-4 ${
                flashStyles[item.key as keyof typeof flashStyles]
              }`}
            >
              <p className="text-sm">{item.message}</p>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

