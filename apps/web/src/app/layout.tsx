import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers';

const metadataBase = (() => {
  const fallbackSiteUrl = process.env.NODE_ENV === 'production'
    ? 'https://sibermas.uinsaizu.ac.id'
    : 'http://localhost:3000';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || fallbackSiteUrl;

  try {
    return new URL(siteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
})();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

export const metadata: Metadata = {
  title: {
    default: 'SIBERMAS - KKN UIN Saizu',
    template: '%s | SIBERMAS',
  },
  description: 'Sistem Informasi Berbasis Masyarakat — Platform digital terintegrasi Pelaksanaan KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto.',
  metadataBase,
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIBERMAS',
  },
  openGraph: {
    type: 'website',
    siteName: 'SIBERMAS',
    title: 'SIBERMAS - KKN UIN Saizu',
    description: 'Platform digital terintegrasi Pelaksanaan KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="id" suppressHydrationWarning className="font-sans">
      <head>
        {/* DNS prefetch for API domain — only in production */}
        {process.env.NEXT_PUBLIC_API_URL?.startsWith('https://sibermas.uinsaizu.ac.id')
          ? <link rel="dns-prefetch" href="//api.uinsaizu.ac.id" />
          : null}
        <link rel="preconnect" href="//fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
