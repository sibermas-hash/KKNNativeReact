import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import {
  RefreshCw,
  Users,
  Database,
  Link2,
  Clock3,
  ShieldCheck,
  ListFilter,
} from 'lucide-react';

interface Props extends PageProps {
  title: string;
  summary: {
    local_students: number;
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
    <AppLayout title="Sinkron Mahasiswa">
      <Head title={title} />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sinkronisasi Mahasiswa</h1>
            <p className="mt-1 text-sm text-slate-500">
              Halaman ini dipakai untuk menarik data mahasiswa dari master kampus ke registry lokal. Mode utamanya adalah sinkron semua,
              dengan opsi resinkron untuk NIM tertentu bila hanya ada sebagian data yang ingin diperbarui.
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Mahasiswa Lokal</p>
                <p className="text-2xl font-black tracking-tight text-slate-900">{summary.local_students}</p>
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

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-1 text-sm text-amber-900">
              <p className="font-bold">Cara kerja sinkron sekarang:</p>
              <p className="text-xs font-medium leading-relaxed text-amber-800">
                `Sinkron semua mahasiswa` adalah jalur utama untuk menyegarkan registry lokal. `Resinkron NIM tertentu` dipakai jika hanya
                ada daftar mahasiswa tertentu yang ingin diperbarui tanpa menarik ulang seluruh data.
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
                <h2 className="text-lg font-bold text-slate-900">Sinkron Semua Mahasiswa</h2>
                <p className="text-sm text-slate-500">Menarik seluruh data mahasiswa dari API master kampus.</p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                Gunakan mode ini saat awal setup, setelah ada perubahan master kampus besar-besaran, atau ketika Anda ingin memastikan
                registry lokal kembali sinkron penuh.
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li>• Membuat atau memperbarui akun mahasiswa berdasarkan NIM</li>
                <li>• Menyegarkan identitas master seperti nama, fakultas, prodi, SKS, IPK, dan metadata sinkron</li>
                <li>• Tidak perlu memilih mahasiswa satu per satu</li>
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
                <h2 className="text-lg font-bold text-slate-900">Resinkron NIM Tertentu</h2>
                <p className="text-sm text-slate-500">Untuk pembaruan terarah tanpa menarik semua data.</p>
              </div>
            </div>

            <form onSubmit={submitTargeted} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Daftar NIM
                </label>
                <textarea
                  rows={8}
                  value={targetedForm.data.nim_list}
                  onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
                  placeholder={'Masukkan satu atau banyak NIM.\nPisahkan dengan enter, koma, atau titik koma.\nContoh:\n24010001\n24010002,24010003'}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                />
                {targetedForm.errors.nim_list && (
                  <p className="mt-2 text-xs font-semibold text-rose-500">{targetedForm.errors.nim_list}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-500">
                Mode ini cocok bila ada beberapa mahasiswa yang baru berubah di master kampus, atau ada data tertentu yang perlu dipaksa
                diperbarui tanpa menjalankan sinkron penuh.
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
                >
                  <RefreshCw size={16} className={targetedForm.processing ? 'animate-spin' : ''} />
                  {targetedForm.processing ? 'Memproses...' : 'Sinkron NIM Tertentu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
