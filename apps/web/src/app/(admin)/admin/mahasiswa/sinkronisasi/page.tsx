import Link from 'next/link';
import { ArrowLeft, DatabaseZap, ShieldCheck, Clock3 } from 'lucide-react';

export default function SyncPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Link href="/admin/mahasiswa" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Kembali ke Direktori Mahasiswa
      </Link>
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Sinkronisasi Data</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Sinkronisasi Mahasiswa</h1>
        <p className="mt-2 max-w-2xl text-sm text-cyan-50">Area ini disiapkan untuk sinkronisasi SIAKAD. Data yang terkunci tidak akan ditimpa proses sinkronisasi.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><DatabaseZap className="text-cyan-600" /><h2 className="mt-3 font-black text-slate-800">Import Data</h2><p className="mt-1 text-sm text-slate-500">Modul sinkronisasi batch sedang disiapkan.</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><ShieldCheck className="text-emerald-600" /><h2 className="mt-3 font-black text-slate-800">Lock Aman</h2><p className="mt-1 text-sm text-slate-500">Field lock mahasiswa tetap dihormati.</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><Clock3 className="text-amber-600" /><h2 className="mt-3 font-black text-slate-800">Riwayat</h2><p className="mt-1 text-sm text-slate-500">Log sinkronisasi akan ditampilkan di sini.</p></div>
      </div>
    </div>
  );
}
