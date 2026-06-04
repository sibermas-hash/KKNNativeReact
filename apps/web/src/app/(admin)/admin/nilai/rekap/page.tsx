import React from 'react';
import { BackButton } from '@/components/ui/shared';

export default function RekapNilaiPage(): React.JSX.Element {
  return (
    <div className="space-y-4 p-6">
      <BackButton href="/admin/nilai" label="Kembali ke Nilai" />
      <h1 className="text-2xl font-bold">Rekap Nilai</h1>
      <p>Modul dalam pengembangan.</p>
    </div>
  );
}
