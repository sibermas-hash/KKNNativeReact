import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
  RefreshCw,
  Users,
  Link2,
  Clock3,
  ShieldCheck,
  Database,
  ListFilter,
  Binary,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  title: string;
  summary: {
    local_lecturers: number;
    with_master_link: number;
    last_synced_at: string | null;
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) {
    return 'Belum Pernah';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DplSync({ title, summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({
    nip_list: '',
  });

  function submitBulk() {
    bulkForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    targetedForm.post('/admin/dosen/sinkron', {
      preserveScroll: true,
    });
  }

  return (
    <AppLayout title="Sinkronisasi Dosen">
      <Head title="Sinkronisasi Data Master DPL" />

      <div className="min-h-screen bg-white pb-32">
        {/* EMERALD SYSTEM HEADER */}
        <div className="bg-white border-b border-emerald-50 px-8 py-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60">
                        Pusat Sinkronisasi Basis Data
                    </span>
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-emerald-950 uppercase italic">
                    SINKRON <span className="text-emerald-500">DOSEN</span>
                </h1>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-1">
                    Integrasi registry lokal dengan Master Data Kampus.
                </p>
            </div>

            <div className="flex items-center gap-8 shadow-xl bg-emerald-950 border border-emerald-900 px-8 py-4">
                <div className="flex flex-col border-r border-white/5 pr-8">
                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">Status sinkron</span>
                    <span className="text-xs font-black text-white italic tracking-widest uppercase">OPERASIONAL</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">Terakhir</span>
                    <span className="text-xs font-black text-white italic tracking-widest uppercase">{formatSyncTime(summary.last_synced_at)}</span>
                </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
            {/* TELEMETRY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-emerald-100 p-8 shadow-sm group hover:border-emerald-500 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 flex items-center justify-center bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Dosen Lokal</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-950">{summary.local_lecturers} <span className="text-xs text-emerald-100 not-italic uppercase font-bold tracking-widest">UNIT</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-emerald-100 p-8 shadow-sm group hover:border-emerald-500 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 flex items-center justify-center bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <Link2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Tautan Master</p>
                            <p className="text-2xl font-black italic tracking-tighter text-emerald-950">{summary.with_master_link} <span className="text-xs text-emerald-100 not-italic uppercase font-bold tracking-widest">UNIT</span></p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-emerald-100 p-8 shadow-sm group hover:border-emerald-500 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 flex items-center justify-center bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                            <Clock3 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Data Segar</p>
                            <p className="text-sm font-black italic tracking-tighter text-emerald-950 uppercase">{formatSyncTime(summary.last_synced_at)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROTOCOL ALERT */}
            <div className="bg-emerald-950 border border-emerald-900 p-8 shadow-2xl relative overflow-hidden group text-white">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-white -rotate-12 transition-transform group-hover:rotate-0 duration-1000">
                    <ShieldCheck size={120} />
                </div>
                <div className="flex items-start gap-6 relative z-10">
                    <div className="p-3 bg-emerald-500 text-emerald-950">
                        <Binary size={20} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 italic">Protokol Antarmuka Sinkronisasi</h4>
                        <p className="text-[10px] font-bold text-emerald-100/60 leading-relaxed uppercase tracking-widest italic leading-loose">
                            Sistem ini menghubungkan pangkalan data KKN dengan Master Data Universitas untuk validasi identitas tenaga pendidik. Pastikan data master telah diperbarui sebelum melakukan sinkronisasi lokal untuk akurasi penugasan.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-12 xl:grid-cols-2 lg:items-stretch">
                {/* BULK SYNC */}
                <section className="bg-white border border-emerald-100 shadow-sm flex flex-col group hover:border-emerald-500 transition-all overflow-hidden text-emerald-950">
                    <div className="p-10 flex flex-col gap-8 flex-1">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-emerald-950 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Database size={24} />
                            </div>
                            <div>
                                <h2 className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.2em] italic">Sinkronisasi Massal</h2>
                                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Sinkronisasi seluruh data</p>
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-50/20 border border-emerald-50 space-y-6">
                            <p className="text-[10px] font-black text-emerald-900/60 uppercase tracking-widest leading-relaxed italic border-l-2 border-emerald-500 pl-4">
                                Gunakan prosedur ini untuk kalibrasi total registry lokal. Sistem akan menarik seluruh data dosen aktif dari Master Kampus.
                            </p>
                            <ul className="space-y-3">
                                {['Verifikasi Identitas NIP', 'Pembaruan Fakultas & Metadata', 'Normalisasi Gender & Usia'].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-[9px] font-black text-emerald-300 uppercase tracking-widest italic">
                                        <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="px-10 py-8 bg-emerald-50/10 border-t border-emerald-50 flex justify-end">
                        <button
                            type="button"
                            onClick={submitBulk}
                            disabled={bulkForm.processing || targetedForm.processing}
                            className="h-14 px-10 bg-emerald-950 text-white font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-emerald-600 transition-all flex items-center gap-4 active:scale-95 shadow-xl disabled:opacity-30"
                        >
                            <RefreshCw size={16} className={clsx(bulkForm.processing && 'animate-spin')} />
                            {bulkForm.processing ? 'PROSES SINKRON...' : 'JALANKAN SINKRON MASSAL'}
                        </button>
                    </div>
                </section>

                {/* TARGETED SYNC */}
                <section className="bg-white border border-emerald-100 shadow-sm flex flex-col group hover:border-emerald-500 transition-all overflow-hidden text-emerald-950">
                    <div className="p-10 flex flex-col gap-8 flex-1">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-emerald-950 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <ListFilter size={24} />
                            </div>
                            <div>
                                <h2 className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.2em] italic">Resinkron Terarah</h2>
                                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Pembaruan dosen tertentu</p>
                            </div>
                        </div>

                        <form onSubmit={submitTargeted} className="space-y-6 flex-1 flex flex-col">
                            <div className="space-y-3 flex-1 flex flex-col">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-300 italic border-l-2 border-emerald-500 pl-4">Daftar NIP</label>
                                <textarea
                                    rows={8}
                                    value={targetedForm.data.nip_list}
                                    onChange={(event) => targetedForm.setData('nip_list', event.target.value)}
                                    placeholder={'MASUKKAN NIP DI SINI...\nPISAHKAN DENGAN BARIS, KOMA, ATAU TITIK KOMA.'}
                                    className="w-full flex-1 bg-white border border-emerald-100 p-6 text-[11px] font-black uppercase tracking-widest italic text-emerald-950 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-50"
                                />
                                {targetedForm.errors.nip_list && (
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{targetedForm.errors.nip_list}</p>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nip_list.trim() === ''}
                                    className="h-14 px-10 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-emerald-950 transition-all flex items-center gap-4 active:scale-95 shadow-xl disabled:opacity-30"
                                >
                                    <Zap size={16} className={clsx(targetedForm.processing && 'animate-spin')} />
                                    {targetedForm.processing ? 'MEMPROSES...' : 'SINKRONKAN NIP TERPILIH'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
