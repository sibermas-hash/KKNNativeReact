import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { Inter, Manrope, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['700', '800'],
  preload: true,
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-glass',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-neo',
  display: 'swap',
  weight: ['500', '600', '700'],
  preload: true,
});


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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo_kkn.png',
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
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable} ${manrope.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* DNS prefetch for API domain in production */}
        <link rel="dns-prefetch" href="//api.uinsaizu.ac.id" />
        <link rel="preconnect" href="//fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
