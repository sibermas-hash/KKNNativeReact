import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { DosenDetail, EditForm, MahasiswaDetail, User, UserDetailPayload } from '../lib/user-types';
import { normalizeAvatarUrl } from '../lib/user-helpers';

type Props = {
  editingId: number | null;
  detailData: UserDetailPayload | null | undefined;
  detailLoading: boolean;
  detailErrorMessage: string | null;
  editForm: EditForm;
  editMutation: UseMutationResult<unknown, unknown, { id: number; payload: Record<string, unknown> }>;
  closeEditModal: () => void;
  handleSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  updateUserField: <K extends keyof User>(key: K, value: User[K]) => void;
  updateMahasiswaField: <K extends keyof MahasiswaDetail>(key: K, value: MahasiswaDetail[K]) => void;
  updateDosenField: <K extends keyof DosenDetail>(key: K, value: DosenDetail[K]) => void;
};

export function EditUserDialog(props: Props) {
  const { editingId, detailData, detailLoading, detailErrorMessage, editForm, editMutation, closeEditModal, handleSubmitEdit, updateUserField, updateMahasiswaField, updateDosenField } = props;
  if (editingId === null) return null;
  return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') closeEditModal(); }}
        >
          <form
            onSubmit={handleSubmitEdit}
            className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl space-y-6 my-auto max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-data-title"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm shrink-0">
                  {normalizeAvatarUrl(detailData?.user?.avatar_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizeAvatarUrl(detailData?.user?.avatar_url) ?? ''} alt={detailData?.user?.name || 'Avatar pengguna'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-cyan-50 text-lg font-black text-cyan-700">
                      {(detailData?.user?.name || editForm.user.name || '?').toString().slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 id="edit-data-title" className="font-black text-slate-900 text-lg">Edit Data Pengguna</h3>
                  <p className="text-xs text-slate-500 mt-1">NIM / NIP di-lock (tidak dapat diubah).</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">Foto profil/Avatar ditampilkan untuk verifikasi visual.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Tutup"
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            ) : detailErrorMessage ? (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                {detailErrorMessage}
              </div>
            ) : (
              <>
                {/* User-level */}
                <section className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Akun</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Username</span>
                      <input
                        value={String(editForm.user.username ?? '')}
                        onChange={(e) => updateUserField('username', e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Nama (Akun)</span>
                      <input
                        value={String(editForm.user.name ?? '')}
                        onChange={(e) => updateUserField('name', e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Email</span>
                      <input
                        type="email"
                        value={String(editForm.user.email ?? '')}
                        onChange={(e) => updateUserField('email', e.target.value)}
                        placeholder="Kosongkan jika belum ada"
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={!!editForm.user.is_active}
                        onChange={(e) => updateUserField('is_active', e.target.checked)}
                      />
                      Akun aktif
                    </label>
                  </div>
                </section>

                {/* Mahasiswa */}
                {detailData?.mahasiswa && (
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Data Mahasiswa</h4>
                    <div className="text-[10px] font-bold text-slate-500">
                      NIM: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{editForm.mahasiswa.nim}</code> (locked)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Nama Lengkap" value={editForm.mahasiswa.nama} onChange={(v) => updateMahasiswaField('nama', v)} />
                      <TextField label="NIK" value={editForm.mahasiswa.nik} onChange={(v) => updateMahasiswaField('nik', v)} placeholder="16 digit" />
                      <TextField label="Nama Ibu" value={editForm.mahasiswa.mother_name} onChange={(v) => updateMahasiswaField('mother_name', v)} />
                      <TextField label="Phone" value={editForm.mahasiswa.phone} onChange={(v) => updateMahasiswaField('phone', v)} />
                      <TextField label="Tempat Lahir" value={editForm.mahasiswa.birth_place} onChange={(v) => updateMahasiswaField('birth_place', v)} />
                      <TextField label="Tanggal Lahir" type="date" value={editForm.mahasiswa.birth_date} onChange={(v) => updateMahasiswaField('birth_date', v)} />
                      <SelectField label="Gender" value={editForm.mahasiswa.gender} options={[{ value: '', label: '-' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} onChange={(v) => updateMahasiswaField('gender', v)} />
                      <TextField label="Ukuran Baju" value={editForm.mahasiswa.shirt_size} onChange={(v) => updateMahasiswaField('shirt_size', v)} />
                      <NumberField label="Angkatan" value={editForm.mahasiswa.batch_year} onChange={(v) => updateMahasiswaField('batch_year', v)} />
                      <NumberField label="Semester" value={editForm.mahasiswa.semester} onChange={(v) => updateMahasiswaField('semester', v)} />
                      <NumberField label="SKS Lulus" value={editForm.mahasiswa.sks_completed} onChange={(v) => updateMahasiswaField('sks_completed', v)} />
                      <NumberField label="IPK" value={editForm.mahasiswa.gpa} onChange={(v) => updateMahasiswaField('gpa', v)} step={0.01} />
                      <TextField label="Status BTA-PPI" value={editForm.mahasiswa.status_bta_ppi} onChange={(v) => updateMahasiswaField('status_bta_ppi', v)} placeholder="LULUS / BELUM" />
                      <TextField label="Status Aktif" value={editForm.mahasiswa.status_aktif} onChange={(v) => updateMahasiswaField('status_aktif', v)} placeholder="AKTIF / CUTI / LULUS" />
                      <NumberField label="Fakultas ID" value={editForm.mahasiswa.fakultas_id} onChange={(v) => updateMahasiswaField('fakultas_id', v)} />
                      <NumberField label="Prodi ID" value={editForm.mahasiswa.prodi_id} onChange={(v) => updateMahasiswaField('prodi_id', v)} />
                      <TextField label="Email API" value={editForm.mahasiswa.api_email} onChange={(v) => updateMahasiswaField('api_email', v)} />
                      <TextField label="Status Nikah" value={editForm.mahasiswa.marital_status} onChange={(v) => updateMahasiswaField('marital_status', v)} />
                      <div className="sm:col-span-2">
                        <TextField label="Alamat" value={editForm.mahasiswa.alamat} onChange={(v) => updateMahasiswaField('alamat', v)} />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.mahasiswa.is_paid_ukt}
                          onChange={(e) => updateMahasiswaField('is_paid_ukt', e.target.checked)}
                        />
                        UKT sudah dibayar
                      </label>
                    </div>
                  </section>
                )}

                {/* Dosen */}
                {detailData?.dosen && (
                  <section className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Data Dosen</h4>
                    <div className="text-[10px] font-bold text-slate-500">
                      NIP: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{editForm.dosen.nip}</code> (locked)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Nama Lengkap" value={editForm.dosen.nama} onChange={(v) => updateDosenField('nama', v)} />
                      <TextField label="Nama + Gelar" value={editForm.dosen.nama_gelar} onChange={(v) => updateDosenField('nama_gelar', v)} />
                      <TextField label="NIDN" value={editForm.dosen.nidn} onChange={(v) => updateDosenField('nidn', v)} />
                      <TextField label="NIK" value={editForm.dosen.nik} onChange={(v) => updateDosenField('nik', v)} placeholder="16 digit" />
                      <TextField label="Phone" value={editForm.dosen.phone} onChange={(v) => updateDosenField('phone', v)} />
                      <TextField label="Jabatan" value={editForm.dosen.jabatan} onChange={(v) => updateDosenField('jabatan', v)} />
                      <TextField label="Pangkat" value={editForm.dosen.pangkat} onChange={(v) => updateDosenField('pangkat', v)} />
                      <TextField label="Golongan" value={editForm.dosen.golongan} onChange={(v) => updateDosenField('golongan', v)} />
                      <TextField label="Pendidikan Terakhir" value={editForm.dosen.pendidikan_terakhir} onChange={(v) => updateDosenField('pendidikan_terakhir', v)} />
                      <TextField label="Tempat Lahir" value={editForm.dosen.tempat_lahir} onChange={(v) => updateDosenField('tempat_lahir', v)} />
                      <TextField label="Tanggal Lahir" type="date" value={editForm.dosen.birth_date} onChange={(v) => updateDosenField('birth_date', v)} />
                      <SelectField label="Gender" value={editForm.dosen.gender} options={[{ value: '', label: '-' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} onChange={(v) => updateDosenField('gender', v)} />
                      <TextField label="Status Aktif" value={editForm.dosen.status_aktif} onChange={(v) => updateDosenField('status_aktif', v)} />
                      <TextField label="Status Pegawai" value={editForm.dosen.status_pegawai} onChange={(v) => updateDosenField('status_pegawai', v)} />
                      <NumberField label="Fakultas ID" value={editForm.dosen.fakultas_id} onChange={(v) => updateDosenField('fakultas_id', v)} />
                      <div className="sm:col-span-2">
                        <TextField label="Alamat" value={editForm.dosen.alamat} onChange={(v) => updateDosenField('alamat', v)} />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.dosen.is_cpns}
                          onChange={(e) => updateDosenField('is_cpns', e.target.checked)}
                        />
                        CPNS
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!editForm.dosen.is_tugas_belajar}
                          onChange={(e) => updateDosenField('is_tugas_belajar', e.target.checked)}
                        />
                        Tugas Belajar
                      </label>
                    </div>
                  </section>
                )}
              </>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editMutation.isPending || detailLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50"
              >
                {editMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" />
    </label>
  );
}

function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <input type="number" step={step} value={value === null || value === undefined ? '' : value} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string | null | undefined; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
