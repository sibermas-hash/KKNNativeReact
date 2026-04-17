import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { Printer, Download, ArrowLeft, FileText, Database, Activity, Target, MapPin, Layers, ShieldCheck, Cpu } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';
import type { LucideIcon } from '@/types';

interface RekapRow { id: number; uraian_kegiatan: string; satuan: string; volume: number; swadaya_mhs: number; swadaya_masyarakat: number; bantuan_pemerintah: number; donatur_lain: number; jumlah: number; keterangan?: string; }
interface Lokasi { village_name: string; district_name: string; regency_name: string; }
interface Periode { name: string; }
interface KelompokData { id: number; nama_kelompok: string; lokasi: Lokasi; periode: Periode; }
interface DplData { nama: string; }
interface Props { kelompok: KelompokData; rekapitulasi: RekapRow[]; dpl: DplData; }

function formatCurrency(v: number): string { return v.toLocaleString('id-ID'); }

export default function AdminRekapitulasiIndex({ kelompok, rekapitulasi, dpl }: Props) {
 const totals = rekapitulasi.reduce((acc, item) => ({
 mhs: acc.mhs + (item.swadaya_mhs || 0),
 masy: acc.masy + (item.swadaya_masyarakat || 0),
 bant: acc.bant + (item.bantuan_pemerintah || 0),
 don: acc.don + (item.donatur_lain || 0),
 total: acc.total + (item.jumlah || 0)
 }), { mhs: 0, masy: 0, bant: 0, don: 0, total: 0 });

 return (
 <AppLayout title="Financial Audit">
 <Head title="Rekapitulasi Kegiatan | SIKKKN"/>

 <div className="space-y-4 font-sans text-black print:space-y-0">
 {/* --- HEADER --- */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
 <div className="space-y-0.5">
 <h1 className="text-base font-bold leading-none">Activity Recap & Fiscal Audit</h1>
 <p className="text-sm font-bold text-gray-900 font-semibold text-xs leading-none">Financial Oversight / Operational Ledger</p>
 </div>
 <div className="flex items-center gap-3">
 <Link href={route('admin.kelompok.index')} className="h-14 px-8 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold shadow-sm shadow-none flex items-center gap-3 text-sm transition-all active:scale-95 disabled:opacity-20"><ArrowLeft size={14} /> Back</Link>
 <div className="h-10 w-[1px] bg-slate-200 mx-2"/>
 <button onClick={() => window.print()} className="h-10 px-4 bg-white/90 backdrop-blur-xl border-gray-200/60 border-gray-200/60 rounded-xl flex items-center gap-2 text-sm font-bold font-semibold text-xs text-gray-900 hover:border-[#1a7a4a] hover:text-[#1a7a4a] transition-all shadow-sm shadow-emerald-900/5 transition-all"><Printer size={14} /> Print_Node</button>
 <Button className="h-10 px-6 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg flex items-center gap-3 shadow-sm shadow-none active:scale-95 group transition-all">
 <Download size={16} className="text-[#1a7a4a]"/>
 <span className="text-sm font-bold font-semibold text-xs">Inference_Export</span>
 </Button>
 </div>
 </div>

 {/* --- METRIC STRIP --- */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
 <RekapMetric label="Total Investment"value={`Rp ${formatCurrency(totals.total)}`} icon={Database} />
 <RekapMetric label="Swadaya Mhs"value={`Rp ${formatCurrency(totals.mhs)}`} icon={Activity} />
 <RekapMetric label="Sync Status"value="AUDITED"icon={ShieldCheck} />
 <RekapMetric label="Audit Mode"value="vFIN 1.2"icon={Cpu} />
 </div>

 {/* --- DOCUMENT CANVAS --- */}
 <section className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-0 print:m-0 print:p-0">
 <div className="p-8 space-y-8 print:p-0 print:space-y-4">
 {/* Doc Header */}
 <div className="text-center border-b-2 border-emerald-900 pb-4 mb-6">
 <h2 className="text-lg font-bold text-black font-bold text-center leading-none">REKAPITULASI LAPORAN KEGIATAN KKN</h2>
 <p className="text-sm font-bold text-gray-900 font-semibold text-xs mt-2">Lembaga Penelitian dan Pengabdian Masyarakat (LPPM) UIN Saizu</p>
 </div>

 {/* Info Registry */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 p-6 bg-gray-50 border border-gray-200/60 rounded-xl print:grid-cols-2 print:p-2 print:bg-white print:border-0 print:gap-y-1">
 <InfoItem label="Territory"value={kelompok.lokasi.village_name.toUpperCase()} icon={MapPin} />
 <InfoItem label="Group_ID"value={kelompok.nama_kelompok.toUpperCase()} icon={Layers} />
 <InfoItem label="District"value={kelompok.lokasi.district_name.toUpperCase()} />
 <InfoItem label="Temporal"value={kelompok.periode.name.toUpperCase()} />
 <InfoItem label="Regency"value={kelompok.lokasi.regency_name.toUpperCase()} />
 </div>

 {/* Data Ledger */}
 <div className="overflow-x-auto">
 <table className="w-full border-collapse border border-slate-400 text-sm font-sans">
 <thead>
 <tr className="bg-gray-50 text-black border-b border-slate-400">
 <th rowSpan={2} className="border border-slate-400 p-2 text-center font-bold w-8">No</th>
 <th rowSpan={2} className="border border-slate-400 p-2 text-left font-bold">Uraian Kegiatan</th>
 <th rowSpan={2} className="border border-slate-400 p-2 text-center font-bold w-14">Unit</th>
 <th rowSpan={2} className="border border-slate-400 p-2 text-center font-bold w-10">Vol</th>
 <th colSpan={4} className="border border-slate-400 p-2 text-center font-bold bg-slate-200">Fiscal Component (Rp)</th>
 <th rowSpan={2} className="border border-slate-400 p-2 text-right font-bold w-24 bg-[#16a34a] text-white">Total (Rp)</th>
 <th rowSpan={2} className="border border-slate-400 p-2 text-left font-bold w-32">Note</th>
 </tr>
 <tr className="bg-gray-50 text-sm border-b border-slate-400">
 <th className="border border-slate-400 p-1 text-center font-bold">Mhs</th>
 <th className="border border-slate-400 p-1 text-center font-bold">Masy</th>
 <th className="border border-slate-400 p-1 text-center font-bold">Gov</th>
 <th className="border border-slate-400 p-1 text-center font-bold">Other</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-100/60">
 {rekapitulasi.map((item, idx) => (
 <tr key={item.id} className="hover:bg-gray-50/50 transition-all font-medium text-black">
 <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
 <td className="border border-slate-400 p-2 font-bold">{item.uraian_kegiatan}</td>
 <td className="border border-slate-400 p-2 text-center font-bold text-gray-900">{item.satuan}</td>
 <td className="border border-slate-400 p-2 text-center tabular-nums">{item.volume}</td>
 <td className="border border-slate-400 p-2 text-right tabular-nums text-gray-900">{formatCurrency(item.swadaya_mhs)}</td>
 <td className="border border-slate-400 p-2 text-right tabular-nums text-gray-900">{formatCurrency(item.swadaya_masyarakat)}</td>
 <td className="border border-slate-400 p-2 text-right tabular-nums text-gray-900">{formatCurrency(item.bantuan_pemerintah)}</td>
 <td className="border border-slate-4 fundamental p-2 text-right tabular-nums text-gray-900">{formatCurrency(item.donatur_lain)}</td>
 <td className="border border-slate-400 p-2 text-right tabular-nums font-bold bg-gray-50">{formatCurrency(item.jumlah)}</td>
 <td className="border border-slate-400 p-2 text-slate-300">{item.keterangan || '-'}</td>
 </tr>
 ))}
 <tr className="bg-[#16a34a] text-white font-bold text-sm">
 <td colSpan={4} className="border border-emerald-700 p-3 text-right">Aggregate Total</td>
 <td className="border border-emerald-700 p-3 text-right tabular-nums text-gray-700">{formatCurrency(totals.mhs)}</td>
 <td className="border border-emerald-700 p-3 text-right tabular-nums text-gray-700">{formatCurrency(totals.masy)}</td>
 <td className="border border-emerald-700 p-3 text-right tabular-nums text-gray-700">{formatCurrency(totals.bant)}</td>
 <td className="border border-emerald-700 p-3 text-right tabular-nums text-gray-700">{formatCurrency(totals.don)}</td>
 <td className="border border-emerald-700 p-3 text-right tabular-nums bg-emerald-700 shadow-inner">{formatCurrency(totals.total)}</td>
 <td className="border border-emerald-700 p-3"></td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Signatures */}
 <div className="mt-16 grid grid-cols-2 gap-20 text-center text-sm font-bold font-semibold text-xs print:mt-12">
 <div className="space-y-20">
 <p className="text-gray-900">Dosen Pembimbing Lapangan (DPL)</p>
 <div className="space-y-1">
 <p className="text-black underline decoration-2 underline-offset-4">{dpl.nama}</p>
 <p className="text-sm text-slate-300">NIP. ................................</p>
 </div>
 </div>
 <div className="space-y-20">
 <p className="text-gray-900">Ketua Kelompok KKN</p>
 <div className="space-y-1">
 <p className="text-black underline decoration-2 underline-offset-4">{kelompok.nama_kelompok}</p>
 <p className="text-sm text-slate-300">NIM. ................................</p>
 </div>
 </div>
 </div>
 </div>
 </section>
 </div>

 <style dangerouslySetInnerHTML={{ __html: `
 @media print {
 @page { margin: 1.5cm; }
 body { background: white !important; }
 aside, header, footer, .print\\:hidden { display: none !important; }
 .lg\\:pl-64 { padding-left: 0 !important; }
 main { padding: 0 !important; }
 }
 `}} />
 </AppLayout>
 );
}

function RekapMetric({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
 return (
 <div className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-gray-300 transition-all group overflow-hidden relative">
 <div className="h-8 w-8 bg-gray-50 text-[#1a7a4a] rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
 <div className="flex flex-col z-10">
 <span className="text-sm font-bold text-gray-900 font-semibold text-xs leading-none mb-1">{label}</span>
 <span className="text-lg font-bold text-black tabular-nums leading-none group-hover:text-[#1a7a4a] transition-colors">{value}</span>
 </div>
 </div>
 );
}

function InfoItem({ label, value, icon: Icon }: { label: string, value: string, icon?:LucideIcon }) {
 return (
 <div className="flex items-center gap-4">
 <div className="w-24 text-sm font-bold text-gray-900 text-xs font-semibold shrink-0">{label}</div>
 <div className="text-slate-300 font-bold px-1">:</div>
 <div className="flex items-center gap-3">
 {Icon && <Icon size={12} className="text-[#1a7a4a]"/>}
 <span className="text-sm font-bold text-black">{value}</span>
 </div>
 </div>
 );
}
