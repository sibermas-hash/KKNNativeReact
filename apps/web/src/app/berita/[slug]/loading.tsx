import React from 'react';

export default function BeritaSlugLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-teal-800" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mb-6 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
