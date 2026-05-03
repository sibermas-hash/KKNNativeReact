import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';

export const metadata: Metadata = {
  title: 'SIBERMAS - KKN UIN Saizu',
  description: 'Sistem Informasi KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
