import React from 'react';

export default function DosenLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--profile-primary)] border-t-transparent" />
        <p className="text-xs font-bold text-[color:var(--profile-muted)] uppercase tracking-widest">Memuat…</p>
      </div>
    </div>
  );
}
