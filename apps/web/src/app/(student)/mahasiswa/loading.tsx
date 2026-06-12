import React from 'react';

export default function StudentLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat…</p>
      </div>
    </div>
  );
}
