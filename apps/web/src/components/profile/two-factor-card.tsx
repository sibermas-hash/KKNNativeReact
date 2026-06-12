'use client';

import React from 'react';

export function TwoFactorCard(): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-slate-900">Keamanan Dua Faktor</h3>
      <p className="mt-1 text-xs font-semibold text-slate-500">Fitur 2FA sedang disiapkan. Pastikan password akun tetap kuat dan rahasia.</p>
    </div>
  );
}
