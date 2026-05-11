'use client';

/**
 * Client layout for /notifikasi.
 *
 * The notifikasi page uses React Query (`useQuery`) for the paginated
 * history. Without a `'use client'` layout in its own route segment,
 * Next.js 15 attempts static prerender of the page, which fails because
 * the QueryClient is only instantiated inside our root `<Providers>`
 * at runtime. This layout — a passthrough — signals to Next that the
 * entire subtree is client-rendered, matching the pattern used by
 * (admin), (student), and (dosen) role layouts.
 */
export default function NotifikasiLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
