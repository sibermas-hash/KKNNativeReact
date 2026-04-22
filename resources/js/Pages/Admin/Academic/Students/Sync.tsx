import type { FormEvent } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, LucideIcon } from '@/types';
import {
  RefreshCw,
  Users,
  Database,
  Link2,
  ListFilter,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Activity,
  Search,
  ChevronRight
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
  if (!value) return 'Belum Pernah';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function StudentSync({ summary }: Props) {
  const bulkForm = useForm({});
  const targetedForm = useForm({ nim_list: '' });

  function submitBulk() {
    bulkForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
  }

  function submitTargeted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    targetedForm.post('/admin/mahasiswa/sinkron', { preserveScroll: true });
  }

  return (
    <AppLayout title="Sinkronisasi Mahasiswa">
      <Head title="Sinkronisasi Mahasiswa KKN"/>

      <div className="space-y-6 font-sans pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-[#1a7a4a]" />
                <span className="text-sm font-medium text-emerald-800">Integrasi Data Master</span>
             </div>
             <h1 className="text-2xl font-bold text-emerald-950 leading-tight">Sinkronisasi Data Mahasiswa</h1>
             <p className="text-sm text-emerald-800 max-w-2xl mt-1">
                Pusat integrasi data untuk menyelaraskan identitas dan riwayat studi mahasiswa antara sistem KKN dan database induk universitas.
             </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <div className="px-3 py-1.5 bg-gray-50 border border-emerald-50 rounded-lg text-xs text-emerald-800">
                Update Terakhir: <strong className="text-emerald-950">{formatSyncTime(summary.last_synced_at)}</strong>
             </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            label="Data KKN Lokal"
            value={summary.local_students.toLocaleString('id-ID')} 
            icon={Users} 
            desc="Total Mahasiswa Terdaftar"
          />
          <MetricCard 
            label="Terhubung Master"
            value={summary.with_master_link.toLocaleString('id-ID')} 
            icon={Link2} 
            desc="Identitas Terverifikasi"
          />
          <MetricCard 
            label="Koneksi Sistem"
            value="AKTIF"
            icon={Activity} 
            desc="Koneksi Jembatan API"
          />
        </div>

        {/* SYNC METHODS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sinkronisasi Menyeluruh */}
          <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-3">
              <div className="h-10 w-10 bg-[#e8f5ee] text-[#1a7a4a] rounded-lg flex items-center justify-center">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-950">Sinkronisasi Menyeluruh</h3>
                <p className="text-xs font-bold text-[#1a7a4a] uppercase tracking-tighter">Pembaruan Database Masal</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Proses ini akan menarik seluruh data mahasiswa aktif dari server pusat universitas untuk menyelaraskan database operasional KKN.
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    'Pembaruan Identitas & Biodata',
                    'Validasi Program Studi & Fakultas',
                    'Sinkronisasi Status Akademik',
                    'Kalibrasi Riwayat Kelompok'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-emerald-800">
                      <CheckCircle2 size={16} className="text-[#1a7a4a] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={submitBulk}
                disabled={bulkForm.processing || targetedForm.processing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a] focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {bulkForm.processing ? (
                  <Loader2 size={18} className="animate-spin"/>
                ) : (
                  <RefreshCw size={18} />
                )}
                {bulkForm.processing ? 'Memproses Sinkronisasi...' : 'Mulai Sinkronisasi Masif'}
              </button>
            </div>
          </div>

          {/* Sinkronisasi Terarah */}
          <div className="bg-white border border-emerald-50 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 text-emerald-800 rounded-lg flex items-center justify-center">
                <ListFilter size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-950">Sinkronisasi Spesifik</h3>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">Target Berdasarkan NIM</p>
              </div>
            </div>

            <form onSubmit={submitTargeted} className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="flex-1 space-y-2">
                <label htmlFor="sync-nim-list" className="block text-xs font-medium text-emerald-800">Daftar NIM (Nomor Induk Mahasiswa)</label>
                <textarea
                  id="sync-nim-list"
                  rows={4}
                  value={targetedForm.data.nim_list}
                  onChange={(event) => targetedForm.setData('nim_list', event.target.value)}
                  placeholder="Masukkan NIM (pisahkan dengan Enter atau Koma)"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#f3f4f6]0 focus:ring-[#1a7a4a] sm:text-sm font-mono"
                />
                {targetedForm.errors.nim_list && (
                  <p className="text-xs text-red-500 mt-1">{targetedForm.errors.nim_list}</p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Gunakan mode ini untuk perbaikan data individu secara presisi tanpa membebani server pusat universitas.
                </p>
              </div>

              <button
                type="submit"
                disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nim_list.trim() === ''}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {targetedForm.processing ? (
                  <Loader2 size={18} className="animate-spin"/>
                ) : (
                  <ArrowRight size={18} />
                )}
                {targetedForm.processing ? 'Sedang Memproses...' : 'Sinkronkan NIM Terpilih'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string, value: string, icon: LucideIcon, desc: string }) {
  return (
    <div className="bg-white border border-emerald-50 rounded-xl p-5 flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-emerald-800 mb-1">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-emerald-950 leading-none">{value}</span>
        </div>
        <span className="text-xs text-[#1a7a4a] mt-1 font-medium">{desc}</span>
      </div>
      <div className="h-12 w-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[#1a7a4a] shrink-0">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  );
}
