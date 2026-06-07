'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dosenApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/shared';
import { UserCheck, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores';

export default function DaftarDplPage(): React.JSX.Element {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ periode_id: '', notes: '' });
  const [showStatement, setShowStatement] = useState(false);
  const [signature, setSignature] = useState({ nama: '', nip: user?.username ?? '' });

  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['dosen', 'available-periods'],
    queryFn: async () => {
      const res = await api.get('/dosen/available-periods');
      return res;
    },
  });

  const { data: eligibilityData } = useQuery({
    queryKey: ['dosen', 'dpl-eligibility'],
    queryFn: async () => {
      const res = await api.get('/dosen/dpl-eligibility');
      return res;
    },
  });

  const eligibility = (eligibilityData || {}) as { eligible?: boolean; has_nidn?: boolean; has_passed_workshop?: boolean; reasons?: string[]; registrations?: Array<{ id: number; periode_name?: string; status?: string }> };
  const periods = (Array.isArray(periodsData) ? periodsData : []) as Array<{ id: number; name: string; is_active?: boolean }>;
  const selectedPeriod = periods.find((period) => String(period.id) === formData.periode_id);

  const submitMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => dosenApi.daftarDpl(data),
    onSuccess: () => {
      toast.success('Pendaftaran DPL berhasil dikirim');
      setFormData({ periode_id: '', notes: '' });
      setSignature({ nama: '', nip: user?.username ?? '' });
      setShowStatement(false);
      qc.invalidateQueries({ queryKey: ['dosen', 'dashboard'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Gagal mendaftar sebagai DPL');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.periode_id) {
      toast.error('Periode wajib diisi');
      return;
    }
    setSignature((prev) => ({ ...prev, nip: prev.nip || user?.username || '' }));
    if (eligibility.eligible === false) {
      toast.error('Anda belum memenuhi syarat pendaftaran DPL');
      return;
    }
    setShowStatement(true);
  };

  const handleConfirmStatement = () => {
    if (!signature.nama.trim()) {
      toast.error('Nama tanpa gelar wajib diisi sebagai tanda tangan elektronik');
      return;
    }
    if (!signature.nip.trim()) {
      toast.error('NIP/NIDN wajib diisi sebagai tanda tangan elektronik');
      return;
    }
    submitMut.mutate({
      periode_id: parseInt(formData.periode_id),
      notes: [
        formData.notes || null,
        'Pernyataan DPL disetujui secara elektronik.',
        `Tanda tangan: ${signature.nama.trim()} (${signature.nip.trim()})`,
      ].filter(Boolean).join('\n'),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pendaftaran DPL" subtitle="Daftar sebagai Dosen Pembimbing Lapangan (DPL)" />

      <div className="rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-4 flex gap-3">
        <AlertCircle size={20} className="text-[color:var(--profile-primary)] shrink-0 mt-0.5" />
        <div className="text-sm text-[color:var(--profile-text)]">
          <p className="font-bold mb-1">Informasi Pendaftaran DPL</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-[color:var(--profile-muted)]">
            <li>Pendaftaran akan diverifikasi oleh admin</li>
            <li>Dosen wajib memiliki NIDN dan telah lulus Workshop Pembekalan DPL</li>
            <li>Penempatan kelompok/lokasi sepenuhnya ditentukan oleh admin</li>
            <li>Setelah disetujui, Anda dapat mengakses menu DPL</li>
          </ul>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${eligibility.eligible ? 'border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)]' : 'border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)]'}`}>
        <p className="text-sm font-black">Status Kelayakan DPL</p>
        <div className="mt-2 grid gap-2 text-xs font-bold md:grid-cols-2">
          <span>NIDN: {eligibility.has_nidn ? 'Terisi' : 'Belum terisi'}</span>
          <span>Workshop: {eligibility.has_passed_workshop ? 'Lulus' : 'Belum lulus'}</span>
        </div>
        {eligibility.reasons && eligibility.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
            {eligibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        )}
        {eligibility.registrations && eligibility.registrations.length > 0 && (
          <div className="mt-3 space-y-1 text-xs">
            {eligibility.registrations.map((reg) => <p key={reg.id}>Pendaftaran {reg.periode_name || '-'}: <strong>{reg.status}</strong></p>)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-6 space-y-5">
        <div>
          <label className="block text-xs font-black text-[color:var(--profile-text)] uppercase tracking-wider mb-2">Periode KKN <span className="text-red-500">*</span></label>
          <select value={formData.periode_id} onChange={(e) => setFormData({ ...formData, periode_id: e.target.value })} className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-2.5 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--profile-soft)]" required>
            <option value="" className="bg-[color:var(--profile-surface)] text-[color:var(--profile-text)]">Pilih periode...</option>
            {periods.map((period) => <option key={period.id} value={period.id} className="bg-[color:var(--profile-surface)] text-[color:var(--profile-text)]">{period.name}</option>)}
          </select>
          {periodsLoading && <p className="text-xs text-[color:var(--profile-muted)] mt-1">Memuat periode...</p>}
          <p className="text-xs text-[color:var(--profile-muted)] mt-1">Pilih periode KKN yang akan Anda ikuti sebagai calon DPL</p>
        </div>

        <div>
          <label className="block text-xs font-black text-[color:var(--profile-text)] uppercase tracking-wider mb-2">Catatan (Opsional)</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-2.5 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--profile-soft)] min-h-[100px]" placeholder="Catatan tambahan untuk admin..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitMut.isPending || periodsLoading || periods.length === 0 || eligibility.eligible === false} className="flex items-center gap-2 rounded-xl bg-[color:var(--profile-primary)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-colors">
            <UserCheck size={16} />
            {submitMut.isPending ? 'Mengirim...' : 'Daftar Sebagai DPL'}
          </button>
        </div>
      </form>

      {showStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--profile-overlay)] backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[color:var(--profile-border)] p-5">
              <div>
                <h2 className="text-lg font-black text-[color:var(--profile-text)]">Pernyataan Kesediaan Menjadi DPL</h2>
                <p className="text-sm text-[color:var(--profile-muted)]">Baca dengan saksama sebelum mengirim pendaftaran.</p>
              </div>
              <button type="button" onClick={() => setShowStatement(false)} className="rounded-lg p-2 text-[color:var(--profile-muted)] hover:bg-[color:var(--profile-soft)] hover:text-[color:var(--profile-text)]"><X size={18} /></button>
            </div>

            <div className="space-y-5 p-6 text-sm leading-7 text-[color:var(--profile-text)]">
              <p>Yang bertanda tangan secara elektronik di bawah ini:</p>
              <div className="rounded-xl bg-[color:var(--profile-soft)] p-4 border border-[color:var(--profile-border)]">
                <p><span className="font-bold text-[color:var(--profile-text)]">Nama akun:</span> {user?.name ?? '-'}</p>
                <p><span className="font-bold text-[color:var(--profile-text)]">NIP/NIDN:</span> {user?.username ?? '-'}</p>
                <p><span className="font-bold text-[color:var(--profile-text)]">Periode:</span> {selectedPeriod?.name ?? '-'}</p>
              </div>
              <p>Dengan ini menyatakan bahwa saya bersedia mendaftarkan diri sebagai calon Dosen Pembimbing Lapangan (DPL) KKN dan, apabila ditetapkan oleh panitia, saya berkomitmen untuk:</p>
              <ol className="list-decimal space-y-2 pl-5 text-[color:var(--profile-text)]">
                <li>melaksanakan tugas DPL secara profesional, bertanggung jawab, berintegritas, dan menjunjung tinggi nama baik institusi;</li>
                <li>membimbing, mendampingi, mengarahkan, serta melakukan monitoring terhadap mahasiswa peserta KKN sesuai ketentuan yang berlaku;</li>
                <li>menaati seluruh pedoman, jadwal, mekanisme pelaporan, evaluasi, dan kebijakan pelaksanaan KKN yang ditetapkan oleh panitia;</li>
                <li>bersedia ditempatkan pada lokasi, kelompok, wilayah, atau skema KKN mana pun sesuai kebutuhan dan keputusan panitia;</li>
                <li>tidak memilih sendiri kelompok, mahasiswa, lokasi, desa, kecamatan, kabupaten, atau bentuk penempatan lainnya;</li>
                <li>bersedia berkoordinasi dengan panitia, pemerintah/mitra lokasi KKN, dan pihak terkait demi kelancaran pelaksanaan KKN;</li>
                <li>siap menerima konsekuensi administratif apabila tidak melaksanakan tugas dan kewajiban sebagai DPL sesuai ketentuan.</li>
              </ol>
              <p>Pernyataan ini saya buat dengan sebenar-benarnya, secara sadar, tanpa paksaan dari pihak mana pun, untuk digunakan sebagaimana mestinya.</p>

              <div className="grid gap-3 rounded-xl border border-[color:var(--profile-border)] p-4 md:grid-cols-2">
                <label className="block text-xs font-black uppercase tracking-wider text-[color:var(--profile-text)]">Nama tanpa gelar <span className="text-red-500">*</span>
                  <input value={signature.nama} onChange={(e) => setSignature({ ...signature, nama: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-3 text-sm font-semibold normal-case tracking-normal focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--profile-soft)]" placeholder="Contoh: Shofiyulloh" />
                </label>
                <label className="block text-xs font-black uppercase tracking-wider text-[color:var(--profile-text)]">NIP/NIDN <span className="text-red-500">*</span>
                  <input value={signature.nip} onChange={(e) => setSignature({ ...signature, nip: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-3 text-sm font-semibold normal-case tracking-normal focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--profile-soft)]" placeholder="NIP/NIDN" />
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[color:var(--profile-border)] p-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowStatement(false)} className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] px-5 py-2.5 text-sm font-bold text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)]">Batal</button>
              <button type="button" onClick={handleConfirmStatement} disabled={submitMut.isPending} className="rounded-xl bg-[color:var(--profile-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">{submitMut.isPending ? 'Mengirim...' : 'Setuju dan Kirim Pendaftaran'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
