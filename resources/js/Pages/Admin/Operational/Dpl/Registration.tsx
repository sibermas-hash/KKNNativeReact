import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { ClipboardList, UserCheck, Clock, XCircle, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';
import type { PageProps } from '@/types';

interface Dosen {
  id: number;
  nama: string;
  nip: string;
  is_cpns: boolean;
  is_tugas_belajar: boolean;
  fakultas: string;
}

interface Periode {
  id: number;
  name: string;
  jenis: string | null;
}

interface Registration {
  id: number;
  status: string;
  is_active: boolean;
  max_kelompok_kkn: number;
  current_groups: number;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string | null;
  dosen: Dosen;
  periode: Periode;
}

interface Props {
  registrations: Registration[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
  stats: { total: number; pending: number; approved: number; rejected: number };
  filters: { search: string; status: string };
}

const statusMap: Record<string, { tag: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { tag: 'warning', label: 'Menunggu' },
  approved: { tag: 'success', label: 'Disetujui' },
  rejected: { tag: 'danger', label: 'Ditolak' },
};

export default function DplRegistration({ registrations, pagination, stats, filters }: Props) {
  const { flash } = usePage<PageProps>().props;
  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [selected, setSelected] = useState<number[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null; bulk: boolean }>({ open: false, id: null, bulk: false });
  const [rejectReason, setRejectReason] = useState('');
  const [maxGroups, setMaxGroups] = useState(5);

  const handleSearch = () => {
    router.get('/admin/dosen/pendaftaran-dpl', { search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }, { preserveState: true, replace: true });
  };

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    router.get('/admin/dosen/pendaftaran-dpl', { search: search || undefined, status: s !== 'all' ? s : undefined }, { preserveState: true, replace: true });
  };

  const approve = (id: number) => {
    if (!confirm('Setujui pendaftaran DPL ini?')) return;
    router.patch(`/admin/dosen/pendaftaran-dpl/${id}/setujui`, { max_kelompok_kkn: maxGroups }, { preserveScroll: true });
  };

  const submitReject = () => {
    if (!rejectReason.trim()) return;
    if (rejectModal.bulk) {
      router.post('/admin/dosen/pendaftaran-dpl/tolak-massal', { ids: selected, rejection_reason: rejectReason }, { preserveScroll: true, onSuccess: () => { setRejectModal({ open: false, id: null, bulk: false }); setRejectReason(''); setSelected([]); } });
    } else if (rejectModal.id) {
      router.patch(`/admin/dosen/pendaftaran-dpl/${rejectModal.id}/tolak`, { rejection_reason: rejectReason }, { preserveScroll: true, onSuccess: () => { setRejectModal({ open: false, id: null, bulk: false }); setRejectReason(''); } });
    }
  };

  const bulkApprove = () => {
    if (!confirm(`Setujui ${selected.length} pendaftaran DPL sekaligus?`)) return;
    router.post('/admin/dosen/pendaftaran-dpl/setujui-massal', { ids: selected, max_kelompok_kkn: maxGroups }, { preserveScroll: true, onSuccess: () => setSelected([]) });
  };

  const toggleSelect = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const toggleAll = () => {
    const pendingIds = registrations.filter((r) => r.status === 'pending').map((r) => r.id);
    setSelected(selected.length === pendingIds.length ? [] : pendingIds);
  };

  const pendingIds = registrations.filter((r) => r.status === 'pending').map((r) => r.id);
  const statusTabs = [
    { key: 'all', label: 'Semua', count: stats.total },
    { key: 'pending', label: 'Menunggu', count: stats.pending },
    { key: 'approved', label: 'Disetujui', count: stats.approved },
    { key: 'rejected', label: 'Ditolak', count: stats.rejected },
  ];

  return (
    <AppLayout title="Pendaftaran DPL">
      <Head title="Pendaftaran DPL" />
      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950">
        <PageHeader
          title="Pendaftaran DPL."
          subtitle="Kelola permohonan dosen yang mendaftar sebagai Dosen Pembimbing Lapangan (DPL)."
          icon={ClipboardList}
          groupLabel="Kelompok & Penugasan"
          stats={{ label: 'Menunggu Verifikasi', value: `${stats.pending}`, icon: Clock }}
        />

        {/* FLASH */}
        <AnimatePresence>
          {(flash as any)?.success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-800">
              <CheckCircle2 size={16} className="inline mr-2" />{(flash as any).success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pendaftaran" value={stats.total} icon={ClipboardList} />
          <StatCard label="Menunggu Verifikasi" value={stats.pending} icon={Clock} variant="warning" />
          <StatCard label="Disetujui" value={stats.approved} icon={UserCheck} variant="success" />
          <StatCard label="Ditolak" value={stats.rejected} icon={XCircle} variant="danger" />
        </div>

        {/* BULK ACTIONS */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">{selected.length} dipilih</span>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs font-bold text-emerald-800">Maks. Kelompok:</label>
                <input type="number" min={1} max={20} value={maxGroups} onChange={(e) => setMaxGroups(Number(e.target.value))} className="w-16 h-8 text-xs font-bold text-center border border-emerald-200 rounded-lg" />
              </div>
              <button onClick={bulkApprove} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95">
                Setujui Semua
              </button>
              <button onClick={() => setRejectModal({ open: true, id: null, bulk: true })} className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95">
                Tolak Semua
              </button>
              <button onClick={() => setSelected([])} className="h-9 px-4 bg-white border border-gray-200 text-emerald-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95">
                Batal
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE */}
        <ContentPanel
          title="Daftar Pendaftaran DPL"
          description="Permohonan dosen untuk menjadi DPL"
          icon={ClipboardList}
          padding={false}
          headerAction={
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {statusTabs.map((t) => (
                  <button key={t.key} onClick={() => handleStatusFilter(t.key)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider ${statusFilter === t.key ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-800 hover:text-emerald-950'}`}>
                    {t.label} <span className="ml-1 text-emerald-600">{t.count}</span>
                  </button>
                ))}
              </div>
              <SearchInput placeholder="Cari nama atau NIP..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} className="w-64" />
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950/40 uppercase tracking-widest">
                Halaman <strong className="text-emerald-950 tabular-nums">{pagination.current_page}</strong> dari {pagination.last_page} — Total {pagination.total} pendaftaran
              </span>
              {pagination.last_page > 1 && (
                <div className="flex gap-1">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).slice(0, 5).map((p) => (
                    <button key={p} onClick={() => router.get('/admin/dosen/pendaftaran-dpl', { ...filters, page: p }, { preserveState: true })}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${p === pagination.current_page ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-emerald-950 hover:bg-emerald-50'}`}>{p}</button>
                  ))}
                </div>
              )}
            </div>
          }
        >
          <PremiumTable
            headers={[
              ...(pendingIds.length > 0 ? [''] : []),
              'Dosen', 'NIP', 'Fakultas', 'Periode', 'Tanggal Daftar', 'Status', 'Aksi',
            ]}
            isEmpty={registrations.length === 0}
            emptyText="Belum ada pendaftaran DPL."
          >
            {registrations.map((reg) => {
              const st = statusMap[reg.status] || statusMap.pending;
              return (
                <PremiumTableRow key={reg.id}>
                  {pendingIds.length > 0 && (
                    <PremiumTableCell>
                      {reg.status === 'pending' && (
                        <input type="checkbox" checked={selected.includes(reg.id)} onChange={() => toggleSelect(reg.id)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      )}
                    </PremiumTableCell>
                  )}
                  <PremiumTableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[#e8f5ee] text-[#1a7a4a] flex items-center justify-center text-xs font-bold border border-emerald-50">
                        {reg.dosen.nama.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-tight">{reg.dosen.nama}</span>
                        {(reg.dosen.is_cpns || reg.dosen.is_tugas_belajar) && (
                          <div className="flex gap-1">
                            {reg.dosen.is_cpns && <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">CPNS</span>}
                            {reg.dosen.is_tugas_belajar && <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">TB</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <span className="text-xs font-bold text-[#1a7a4a] font-mono tracking-wider">{reg.dosen.nip}</span>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <span className="text-xs font-semibold text-emerald-950">{reg.dosen.fakultas}</span>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <span className="text-xs font-bold text-emerald-950">{reg.periode.name}</span>
                  </PremiumTableCell>
                  <PremiumTableCell>
                    <span className="text-xs font-semibold text-emerald-800">{reg.created_at || '-'}</span>
                  </PremiumTableCell>
                  <PremiumTableCell align="center">
                    <StatusTag status={st.tag} label={st.label} size="sm" />
                    {reg.status === 'rejected' && reg.rejection_reason && (
                      <p className="text-[10px] font-semibold text-rose-600 mt-1 max-w-[140px] truncate" title={reg.rejection_reason}>{reg.rejection_reason}</p>
                    )}
                  </PremiumTableCell>
                  <PremiumTableCell align="right">
                    {reg.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => approve(reg.id)}
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Setujui
                        </button>
                        <button onClick={() => { setRejectModal({ open: true, id: reg.id, bulk: false }); setRejectReason(''); }}
                          className="h-8 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5">
                          <XCircle size={12} /> Tolak
                        </button>
                      </div>
                    ) : reg.status === 'approved' ? (
                      <span className="text-[11px] font-bold text-emerald-600">{reg.approved_at}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-400">—</span>
                    )}
                  </PremiumTableCell>
                </PremiumTableRow>
              );
            })}
          </PremiumTable>
        </ContentPanel>

        {/* SELECT ALL for pending */}
        {pendingIds.length > 1 && statusFilter !== 'approved' && statusFilter !== 'rejected' && (
          <div className="flex justify-center">
            <button onClick={toggleAll} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors">
              {selected.length === pendingIds.length ? 'Batal pilih semua' : `Pilih semua ${pendingIds.length} yang menunggu`}
            </button>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-tight">Tolak Pendaftaran DPL</h3>
                  <p className="text-xs font-semibold text-emerald-800">{rejectModal.bulk ? `${selected.length} pendaftaran akan ditolak` : 'Berikan alasan penolakan'}</p>
                </div>
              </div>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Tuliskan alasan penolakan..." rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setRejectModal({ open: false, id: null, bulk: false })} className="h-9 px-4 bg-white border border-gray-200 text-emerald-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95">Batal</button>
                <button onClick={submitReject} disabled={!rejectReason.trim()} className="h-9 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95">Tolak</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
