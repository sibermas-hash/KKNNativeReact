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
} from 'lucide-react';

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
    return 'Belum pernah sinkron';
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
    <AppLayout title="Sinkron Dosen">
      <Head title={title} />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sinkronisasi Master Dosen</h1>
            <p className="mt-1 text-sm text-slate-500">
              Halaman ini dipakai untuk menarik data dosen dari master kampus ke registry lokal KKN. Sinkron di sini hanya membuat atau
              memperbarui data dosen lokal, bukan membuat akun login DPL.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dosen Lokal</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.local_lecturers}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Link2 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tertaut ke Master</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.with_master_link}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sinkron Terakhir</p>
                <p className="text-sm font-bold text-slate-900">{formatSyncTime(summary.last_synced_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <div className="space-y-1 text-sm text-sky-900">
              <p className="font-bold">Cara kerja sinkron dosen sekarang:</p>
              <p className="text-xs font-medium leading-relaxed text-sky-800">
                `Sinkron semua dosen` dipakai untuk menyegarkan master lokal secara penuh. `Resinkron NIP tertentu` dipakai jika hanya ada
                beberapa dosen yang perlu diperbarui. Akun login DPL tetap dikelola terpisah saat dosen diaktifkan pada periode KKN.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sinkron Semua Dosen</h2>
                <p className="text-sm text-slate-500">Menarik seluruh data dosen dari API master kampus.</p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                Gunakan mode ini saat awal setup, setelah ada perubahan besar pada master dosen, atau ketika Anda ingin memastikan registry
                dosen lokal kembali sinkron penuh.
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li>• Membuat atau memperbarui identitas dosen berdasarkan NIP</li>
                <li>• Menyegarkan nama, fakultas, gender, tanggal lahir, dan metadata sinkron</li>
                <li>• Tidak otomatis membuat akun login atau aktivasi DPL</li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={submitBulk}
                disabled={bulkForm.processing || targetedForm.processing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
              >
                <RefreshCw size={16} className={bulkForm.processing ? 'animate-spin' : ''} />
                {bulkForm.processing ? 'Menyinkronkan...' : 'Sinkron Semua'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ListFilter size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Resinkron NIP Tertentu</h2>
                <p className="text-sm text-slate-500">Untuk pembaruan dosen terarah tanpa menarik semua data.</p>
              </div>
            </div>

            <form onSubmit={submitTargeted} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Daftar NIP
                </label>
                <textarea
                  rows={8}
                  value={targetedForm.data.nip_list}
                  onChange={(event) => targetedForm.setData('nip_list', event.target.value)}
                  placeholder={'Masukkan satu atau banyak NIP.\nPisahkan dengan enter, koma, atau titik koma.\nContoh:\n198700010010\n198700010011,198700010012'}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                />
                {targetedForm.errors.nip_list && (
                  <p className="mt-2 text-xs font-semibold text-rose-500">{targetedForm.errors.nip_list}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-500">
                Mode ini cocok bila hanya ada dosen tertentu yang baru diperbaiki di master kampus, atau ada data yang ingin diperbarui
                ulang tanpa menjalankan sinkron penuh.
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nip_list.trim() === ''}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
                >
                  <RefreshCw size={16} className={targetedForm.processing ? 'animate-spin' : ''} />
                  {targetedForm.processing ? 'Memproses...' : 'Sinkron NIP Tertentu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
