import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
 RefreshCw,
 Users,
 Link2,
 ShieldCheck,
 Database,
 Zap,
 CheckCircle2,
 Activity,
 Target,
 ArrowRight,
 ListFilter,
 Info,
 Loader2,
 ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PageHeader, 
  StatCard, 
  ContentPanel 
} from '@/Components/Premium';

interface Props {
 title: string;
 summary: {
 local_lecturers: number;
 with_master_link: number;
 with_user_account: number;
 last_synced_at: string | null;
 };
}

function formatSyncTime(value: string | null): string {
 if (!value) return 'BELUM TERDETEKSI';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return new Intl.DateTimeFormat('id-ID', {
 dateStyle: 'medium',
 timeStyle: 'short',
 }).format(date);
}

export default function DplSync({ summary }: Props) {
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
 <Head title="Pusat Sinkronisasi Dosen"/>

  <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
    <PageHeader 
      title="Sinkronisasi Dosen."
      subtitle="Otomasi transmisi data Dosen Pembimbing Lapangan melalui basis data pusat sistem informasi akademik universitas secara real-time."
      icon={RefreshCw}
      groupLabel="Data Master & Integrasi"
      stats={{
        label: 'Sinkronisasi Terakhir',
        value: formatSyncTime(summary.last_synced_at),
        icon: Activity
      }}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Data Lokal" value={summary.local_lecturers} icon={Users} variant="info" />
      <StatCard label="Koneksi Master" value={summary.with_master_link} icon={Link2} variant="success" />
      <StatCard label="Akun Sistem" value={summary.with_user_account} icon={ShieldCheck} variant="gray" />
      <StatCard label="Status Arus" value="STABIL" icon={Zap} variant="success" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Sinkronisasi Massal */}
      <ContentPanel
        title="Transmisi Kolektif"
        description="Sinkronisasi Massal Basis Data"
        icon={Database}
        padding={true}
      >
        <div className="space-y-8">
          <div className="bg-slate-50 border-2 border-emerald-50 rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 group-hover:rotate-12 transition-transform duration-700">
              <RefreshCw size={150} />
            </div>
            <p className="text-sm font-black text-emerald-950 leading-relaxed relative z-10 font-display">
              Prosedur ini memindai direktori dosen di sistem induk universitas untuk diperbarui ke dalam basis data KKN secara otomatis dan menyeluruh.
            </p>
            <div className="mt-8 space-y-4 relative z-10">
              {[
                'Perbaruan Identitas & NIP Kolektif',
                'Sinkronisasi Afiliasi Akademik',
                'Optimalisasi Akun Pengguna DPL',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest font-display">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={submitBulk}
            disabled={bulkForm.processing || targetedForm.processing}
            className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-4 text-xs tracking-[0.2em] disabled:opacity-50 active:scale-95 group font-display"
          >
            {bulkForm.processing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <RefreshCw size={24} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-700" />
            )}
            {bulkForm.processing ? 'SEDANG MENTRANSMISI...' : 'EKSEKUSI SINKRONISASI TOTAL'}
          </button>
        </div>
      </ContentPanel>

      {/* Sinkronisasi Terapan */}
      <ContentPanel
        title="Intervensi Spesifik"
        description="Sinkronisasi Target Berdasarkan NIP"
        icon={Target}
        padding={true}
      >
        <form onSubmit={submitTargeted} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-950 pl-1 leading-none flex items-center gap-3 uppercase tracking-widest font-display">
              <ListFilter size={14} strokeWidth={3} className="text-emerald-600" /> Daftar NIP Target
            </label>
            <textarea
              value={targetedForm.data.nip_list}
              onChange={(e) => targetedForm.setData('nip_list', e.target.value)}
              className="w-full px-6 py-6 rounded-2xl bg-slate-50 border-2 border-emerald-50 text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300 font-mono"
              placeholder={'19900101XXXXXXXX\n19900101XXXXXXXX'}
              rows={4}
            />
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-6 flex items-start gap-5 border border-emerald-100">
            <Info size={20} className="text-emerald-600 shrink-0 mt-1" strokeWidth={3} />
            <p className="text-[11px] font-black text-emerald-800 leading-relaxed font-display">
              Mode ini memfasilitasi perbaikan data administratif dosen secara instan untuk entri yang cacat atau belum terdaftar pada fase deployment.
            </p>
          </div>

          <button
            type="submit"
            disabled={targetedForm.processing || bulkForm.processing || targetedForm.data.nip_list.trim() === ''}
            className="h-16 w-full bg-emerald-950 hover:bg-black text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-4 text-xs tracking-[0.2em] disabled:opacity-50 active:scale-95 font-display"
          >
            {targetedForm.processing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <ArrowRight size={24} strokeWidth={3} />
            )}
            {targetedForm.processing ? 'SEDANG MEMPERBARUI...' : 'PERBARUI NIP SPESIFIK'}
          </button>
        </form>
      </ContentPanel>
    </div>

    {/* --- GOVERNANCE FOOTER --- */}
    <div className="bg-white rounded-3xl p-10 border-2 border-emerald-50 shadow-sm overflow-hidden group">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-emerald-950 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-black text-emerald-950 leading-none mb-2 font-display uppercase tracking-tight">Kedaulatan Data Master DPL.</h3>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-display">Protokol Pemeliharaan Sistem</span>
            </div>
          </div>
          <p className="text-sm font-bold text-emerald-800 leading-relaxed max-w-4xl font-display opacity-80">
            Sinkronisasi berkala menjamin data Dosen Pembimbing Lapangan tetap relevan dengan direktori kepegawaian universitas. Pastikan stabilitas koneksi backend dan endpoint API Master sebelum melakukan transmisi data kolektif dalam skala besar guna mencegah degradasi performa database.
          </p>
        </div>
      </div>
    </div>
 </div>
 </AppLayout>
 );
}


