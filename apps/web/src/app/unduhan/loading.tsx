import React from 'react';

export default function UnduhanLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-teal-800" />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
