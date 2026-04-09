import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';
import {
  RefreshCw,
  Users,
  Database,
  Link2,
  Clock3,
  ShieldCheck,
  ListFilter,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/Components/ui';

interface Props extends PageProps {
  title: string;
  summary: {
    local_students: number;
    with_master_link: number;
    last_synced_at: string | null;
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) return 'Belum pernah';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date).toUpperCase();
}

export default function StudentSync({ title, summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({
    nim_list: '',
  });

  function submitBulk() {
    bulkForm.post('/admin/mahasiswa/sinkron', {
      preserveScroll: true,
    });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    targetedForm.post('/admin/mahasiswa/sinkron', {
      preserveScroll: true,
    });
  }

  return (
    <AppLayout title="Sinkronisasi Mahasiswa">
      <Head title={title} />

      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="mx-auto max-w-[1600px] px-8 py-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60">
                  Sinkronisasi data mahasiswa
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-emerald-950 uppercase italic">
                SINKRONISASI <span className="text-emerald-500">MAHASISWA</span>
              </h1>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-1">
                Memperbarui data mahasiswa dari master kampus ke data lokal KKN.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white border border-emerald-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">Mahasiswa lokal</p>
                        <p className="text-2xl font-black tracking-tighter text-emerald-950 uppercase italic">
                            {summary.local_students.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="rounded bg-emerald-950 p-2 text-emerald-400 border border-emerald-800">
                        <Users size={20} />
                    </div>
                </div>
            </div>
            <div className="bg-white border border-emerald-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">Tertaut ke master</p>
                        <p className="text-2xl font-black tracking-tighter text-emerald-950 uppercase italic">
                            {summary.with_master_link.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="rounded bg-emerald-950 p-2 text-emerald-400 border border-emerald-800">
                        <Link2 size={20} />
                    </div>
                </div>
            </div>
            <div className="bg-white border border-emerald-100 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">Sinkron terakhir</p>
                        <p className="text-[11px] font-black tracking-widest text-emerald-950 uppercase italic">
                            {formatSyncTime(summary.last_synced_at)}
                        </p>
                    </div>
                    <div className="rounded bg-emerald-950 p-2 text-emerald-400 border border-emerald-800">
                        <Clock3 size={20} />
                    </div>
                </div>
            </div>
          </div>

          {/* Operational Advisory */}
          <div className="bg-emerald-950 border border-emerald-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={100} />
            </div>
            <div className="relative z-10 flex items-start gap-6">
                <div className="p-3 bg-emerald-500/20 rounded border border-emerald-500/40">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Panduan singkat</h4>
                    <p className="text-[10px] font-bold text-emerald-100/40 uppercase tracking-widest leading-relaxed max-w-4xl">
                        `Sinkronkan semua` adalah jalur utama untuk menyegarkan basis data. `Sinkronkan NIM tertentu` dipakai untuk koreksi parsial pada data tertentu tanpa memproses seluruh daftar.
                    </p>
                </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            {/* Bulk Section */}
            <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-5">
                  <div className="flex items-center gap-4">
                      <div className="rounded bg-emerald-950 p-2 text-emerald-400 border border-emerald-800">
                          <Database className="h-5 w-5" />
                      </div>
                      <div>
                          <h2 className="font-black text-emerald-950 uppercase tracking-tight text-[11px]">Sinkronisasi massal</h2>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Penyegaran penuh data mahasiswa</p>
                      </div>
                  </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                <div className="space-y-6">
                  <div className="p-6 bg-emerald-50/30 border border-emerald-100 space-y-4">
                    <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest leading-relaxed italic">
                      Direkomendasikan untuk inisialisasi sistem atau pembaruan data fakultas dan prodi secara menyeluruh.
                    </p>
                    <ul className="space-y-3">
                      {['Otomatis membuat atau memperbarui akun', 'Menyegarkan identitas dari master', 'Memperbarui SKS dan IPK terbaru'].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                          <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={submitBulk}
                  disabled={bulkForm.processing || targetedForm.processing}
                  className="h-14 bg-emerald-950 hover:bg-black font-black text-[11px] uppercase tracking-widest w-full rounded-none group"
                >
                  <RefreshCw size={18} className={clsx("group-hover:rotate-180 transition-transform duration-700", bulkForm.processing && "animate-spin")} />
                  {bulkForm.processing ? 'Memproses sinkronisasi...' : 'Sinkronkan semua mahasiswa'}
                </Button>
              </div>
            </section>

            {/* Targeted Section */}
            <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden">
              <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-5">
                  <div className="flex items-center gap-4">
                      <div className="rounded bg-emerald-950 p-2 text-emerald-400 border border-emerald-800">
                          <ListFilter className="h-5 w-5" />
                      </div>
                      <div>
                          <h2 className="font-black text-emerald-950 uppercase tracking-tight text-[11px]">Sinkronisasi terarah</h2>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Pembaruan untuk NIM tertentu</p>
                      </div>
                  </div>
              </div>
              <form onSubmit={submitTargeted} className="p-8 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">Daftar NIM</label>
                  <textarea
                    rows={6}
                    value={targetedForm.data.nim_list}
                    onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
                    placeholder={'Masukkan satu atau banyak NIM.\nPisahkan dengan enter, koma, atau titik koma.\nContoh:\n24010001\n24010002,24010003'}
                    className="w-full border border-emerald-100 bg-emerald-50/10 p-6 text-[11px] font-black text-emerald-950 uppercase tracking-widest outline-none transition focus:border-emerald-500 focus:bg-white min-h-[160px]"
                  />
                  {targetedForm.errors.nim_list && (
                    <p className="text-[9px] font-black text-rose-600 uppercase mt-2">{targetedForm.errors.nim_list}</p>
                  )}
                </div>

                <div className="p-4 border-l-2 border-emerald-500 bg-emerald-50/50">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
                        Mode ini cocok untuk memperbarui data dengan ruang lingkup terbatas.
                    </p>
                </div>

                <Button
                  type="submit"
                  disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
                  className="h-14 bg-emerald-600 hover:bg-emerald-700 font-black text-[11px] uppercase tracking-widest w-full rounded-none group"
                >
                  {targetedForm.processing ? (
                      <RefreshCw size={18} className="animate-spin" />
                  ) : (
                      <>
                        EKSEKUSI SINKRON TARGETED
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                      </>
                  )}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
