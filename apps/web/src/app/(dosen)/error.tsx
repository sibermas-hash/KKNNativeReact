'use client';

import { useEffect } from 'react';

export default function DosenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Dosen Error]', error); }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] p-6 text-center">
        <h2 className="text-lg font-semibold text-[color:var(--profile-danger-text)]">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm text-[color:var(--profile-danger-text)]/90">Halaman mengalami error. Silakan coba lagi.</p>
        <button onClick={reset} className="mt-4 rounded-md bg-[color:var(--profile-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
