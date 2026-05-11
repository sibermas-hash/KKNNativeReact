import React from 'react';

export default function BeritaLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-teal-800" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
