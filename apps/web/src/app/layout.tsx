import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '700'],
});

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
    <html lang="id" suppressHydrationWarning className={`${fontSans.variable} ${fontSerif.variable}`}>
      <head>
        {/* DNS prefetch for API domain — only in production */}
        {process.env.NEXT_PUBLIC_API_URL?.startsWith('https://sibermas.uinsaizu.ac.id')
          ? <link rel="dns-prefetch" href="//api.uinsaizu.ac.id" />
          : null}
        <link rel="preconnect" href="//fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = 'default';
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                  var c = cookies[i].trim();
                  if (c.indexOf('sibermas_theme=') === 0) {
                    theme = c.substring('sibermas_theme='.length);
                    break;
                  }
                }
                
                var themes = {
                  default: {
                    '--profile-page': '#F7F9F8',
                    '--profile-text': '#102A26',
                    '--profile-muted': '#5B716C',
                    '--profile-surface': '#FFFFFF',
                    '--profile-surface-strong': '#ECF2F0',
                    '--profile-border': '#D8E2DF',
                    '--profile-soft': '#E6F2EF',
                    '--profile-soft-text': '#0F766E',
                    '--profile-primary': '#0F766E',
                    '--profile-primary-hover': '#0B5C56',
                    '--profile-accent': '#0E9F6E',
                    'background': 'radial-gradient(1200px 600px at 100% -10%, rgba(14,159,110,.10), transparent 60%), #F7F9F8'
                  },
                  ocean: {
                    '--profile-page': '#eef2ff',
                    '--profile-text': '#1e1b4b',
                    '--profile-muted': '#6366f1',
                    '--profile-surface': '#ffffff',
                    '--profile-surface-strong': '#f8faff',
                    '--profile-border': '#e0e7ff',
                    '--profile-soft': '#eef2ff',
                    '--profile-soft-text': '#4338ca',
                    '--profile-primary': '#4f46e5',
                    '--profile-primary-hover': '#4338ca',
                    '--profile-accent': '#0ea5e9',
                    'background': 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 50%, #f8fafc 100%)'
                  },
                  forest: {
                    '--profile-page': '#ecfdf5',
                    '--profile-text': '#14532d',
                    '--profile-muted': '#4d7c0f',
                    '--profile-surface': '#ffffff',
                    '--profile-surface-strong': '#f8fdf9',
                    '--profile-border': '#d1fae5',
                    '--profile-soft': '#ecfdf5',
                    '--profile-soft-text': '#065f46',
                    '--profile-primary': '#059669',
                    '--profile-primary-hover': '#047857',
                    '--profile-accent': '#ca8a04',
                    'background': 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fefce8 100%)'
                  },
                  midnight: {
                    '--profile-page': '#0f172a',
                    '--profile-text': '#e2e8f0',
                    '--profile-muted': '#94a3b8',
                    '--profile-surface': '#1e293b',
                    '--profile-surface-strong': '#162032',
                    '--profile-border': '#475569',
                    '--profile-soft': '#293548',
                    '--profile-soft-text': '#c7d2fe',
                    '--profile-primary': '#818cf8',
                    '--profile-primary-hover': '#a5b4fc',
                    '--profile-accent': '#38bdf8',
                    'background': '#0f172a'
                  },
                  rose: {
                    '--profile-page': '#fff1f2',
                    '--profile-text': '#4c0519',
                    '--profile-muted': '#be185d',
                    '--profile-surface': '#ffffff',
                    '--profile-surface-strong': '#fffbfc',
                    '--profile-border': '#fecdd3',
                    '--profile-soft': '#fff1f2',
                    '--profile-soft-text': '#be123c',
                    '--profile-primary': '#e11d48',
                    '--profile-primary-hover': '#be123c',
                    '--profile-accent': '#f97316',
                    'background': 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #fffbeb 100%)'
                  }
                };

                var config = themes[theme] || themes.default;
                var doc = document.documentElement;
                
                for (var key in config) {
                  if (config.hasOwnProperty(key)) {
                    if (key === 'background') {
                      doc.style.background = config[key];
                    } else {
                      doc.style.setProperty(key, config[key]);
                    }
                  }
                }
                if (theme === 'midnight') {
                  doc.classList.add('dark');
                } else {
                  doc.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[color:var(--profile-page,#ffffff)] font-sans antialiased text-[color:var(--profile-text)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
