'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useState } from 'react';
import { Database, Search, Printer } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

interface RekapRow {
  id: number;
  uraian_kegiatan: string;
  satuan: string;
  volume: number;
  swadaya_mhs: number;
  swadaya_masyarakat: number;
  bantuan_pemerintah: number;
  donatur_lain: number;
  jumlah: number;
  keterangan?: string;
}

interface RekapData {
  kelompok?: { nama_kelompok?: string; lokasi?: { village_name?: string; district_name?: string; regency_name?: string }; periode?: { name?: string } };
  rekapitulasi?: RekapRow[];
  dpl?: { nama?: string };
}

function fmt(v: number) { return v?.toLocaleString('id-ID') ?? '0'; }

export default function AdminRekapitulasiPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedGroup, _setSelectedGroup] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'rekapitulasi', { search, group: selectedGroup }],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        rekapitulasi: { index: (p: Record<string, unknown>) => Promise<unknown> };
      }).rekapitulasi.index({ search: search || undefined, kelompok_id: selectedGroup || undefined });
      return (res as { data?: unknown }).data ?? res;
    },
  });

  // API may return single group rekap or list
  const isList = Array.isArray(data);
  const groups = isList ? (data as RekapData[]) : [];
  const single = !isList ? (data as RekapData | null) : null;

  const renderRekap = (rekap: RekapData, key?: number) => {
    const rows = rekap.rekapitulasi ?? [];
    const totals = rows.reduce(
      (acc, r) => ({ mhs: acc.mhs + (r.swadaya_mhs || 0), masy: acc.masy + (r.swadaya_masyarakat || 0), bant: acc.bant + (r.bantuan_pemerintah || 0), don: acc.don + (r.donatur_lain || 0), total: acc.total + (r.jumlah || 0) }),
      { mhs: 0, masy: 0, bant: 0, don: 0, total: 0 }
    );

    return (
      <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Group Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">{rekap.kelompok?.nama_kelompok ?? '-'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {rekap.kelompok?.lokasi?.village_name}, {rekap.kelompok?.lokasi?.district_name} · {rekap.kelompok?.periode?.name}
            </p>
            {rekap.dpl?.nama && <p className="text-xs text-slate-400">DPL: {rekap.dpl.nama}</p>}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer size={12} /> Cetak
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Belum ada data rekapitulasi</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-3">No</th>
                    <th className="p-3">Uraian Kegiatan</th>
                    <th className="p-3">Satuan</th>
                    <th className="p-3 text-right">Vol</th>
                    <th className="p-3 text-right">Swadaya Mhs</th>
                    <th className="p-3 text-right">Swadaya Masy</th>
                    <th className="p-3 text-right">Bantuan Pem</th>
                    <th className="p-3 text-right">Donatur</th>
                    <th className="p-3 text-right">Jumlah</th>
                    <th className="p-3">Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3 font-medium text-slate-900">{row.uraian_kegiatan}</td>
                      <td className="p-3 text-slate-500">{row.satuan}</td>
                      <td className="p-3 text-right tabular-nums">{row.volume}</td>
                      <td className="p-3 text-right tabular-nums">{fmt(row.swadaya_mhs)}</td>
                      <td className="p-3 text-right tabular-nums">{fmt(row.swadaya_masyarakat)}</td>
                      <td className="p-3 text-right tabular-nums">{fmt(row.bantuan_pemerintah)}</td>
                      <td className="p-3 text-right tabular-nums">{fmt(row.donatur_lain)}</td>
                      <td className="p-3 text-right tabular-nums font-bold text-slate-900">{fmt(row.jumlah)}</td>
                      <td className="p-3 text-slate-400 italic">{row.keterangan ?? '-'}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-black text-xs">
                    <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-slate-500">Total</td>
                    <td className="p-3 text-right tabular-nums">{fmt(totals.mhs)}</td>
                    <td className="p-3 text-right tabular-nums">{fmt(totals.masy)}</td>
                    <td className="p-3 text-right tabular-nums">{fmt(totals.bant)}</td>
                    <td className="p-3 text-right tabular-nums">{fmt(totals.don)}</td>
                    <td className="p-3 text-right tabular-nums bg-emerald-600 text-white">{fmt(totals.total)}</td>
                    <td className="p-3" />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {rows.map((row, i) => (
                <div key={row.id} className="rounded-xl bg-white border border-slate-100 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{row.uraian_kegiatan}</span>
                    <span className="text-[10px] text-slate-400">#{i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Satuan:</span> <span className="font-medium">{row.satuan}</span></div>
                    <div><span className="text-slate-400">Vol:</span> <span className="font-medium">{row.volume}</span></div>
                    <div><span className="text-slate-400">Mhs:</span> <span className="font-medium">{fmt(row.swadaya_mhs)}</span></div>
                    <div><span className="text-slate-400">Masy:</span> <span className="font-medium">{fmt(row.swadaya_masyarakat)}</span></div>
                    <div><span className="text-slate-400">Bantuan:</span> <span className="font-medium">{fmt(row.bantuan_pemerintah)}</span></div>
                    <div><span className="text-slate-400">Donatur:</span> <span className="font-medium">{fmt(row.donatur_lain)}</span></div>
                    {row.keterangan && <div className="col-span-2"><span className="text-slate-400">Ket:</span> <span className="italic">{row.keterangan}</span></div>}
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Jumlah</span>
                    <span className="text-base font-black text-emerald-700">{fmt(row.jumlah)}</span>
                  </div>
                </div>
              ))}
              {/* Total card */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 uppercase">Total Keseluruhan</span>
                <span className="text-lg font-black text-emerald-700">{fmt(totals.total)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Rekapitulasi Kegiatan"
        subtitle="Rekapitulasi anggaran dan kegiatan KKN per kelompok"
      />

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kelompok..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : isList && groups.length === 0 ? (
        <EmptyState icon={<Database size={48} />} title="Belum Ada Data Rekapitulasi" />
      ) : isList ? (
        <div className="space-y-6">{groups.map((g, i) => renderRekap(g, i))}</div>
      ) : single ? (
        renderRekap(single)
      ) : (
        <EmptyState icon={<Database size={48} />} title="Belum Ada Data Rekapitulasi" />
      )}
    </div>
  );
}
