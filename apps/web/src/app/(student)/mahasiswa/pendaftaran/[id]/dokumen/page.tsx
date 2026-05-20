'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { rawApi, studentApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Eye, FileText, Upload, PartyPopper } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — matches backend RegistrationDocumentService
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWib(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB`;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `Ukuran file ${formatSize(file.size)} melebihi batas maksimal 5 MB.`;
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) return 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG.';
  }
  return null;
}

type Requirement = { field: string; label?: string; description?: string; template_url?: string; required?: boolean };
type UploadedDoc = {
  id?: number | string;
  /** Legacy alias: some older responses used `field`. Prefer `document_type`. */
  field?: string;
  /** Canonical backend key — matches Requirement.field. */
  document_type?: string;
  file_name?: string;
  uploaded_at?: string;
  file_exists?: boolean;
};

/**
 * Normalize lookup key: check both `field` and `document_type` against the
 * Requirement field. Backend uses `document_type` (DokumenPesertaResource)
 * but some historical paths used `field`. Handle both defensively.
 */
function docMatchesField(doc: UploadedDoc, field: string): boolean {
  if (doc.file_exists === false) return false;
  return doc.field === field || doc.document_type === field;
}

export default function UploadDokumenPage(): React.JSX.Element {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});

  const { data: formData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.student.registration.form, 'period-docs', Number(id)],
    queryFn: async () => {
      const res = await studentApi.registration.form();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  // Fetch previously uploaded documents
  const { data: statusData } = useQuery({
    queryKey: [...QUERY_KEYS.student.registration.status],
    queryFn: async () => {
      const res = await studentApi.registration.status();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const mutation = useMutation({
    mutationFn: (fd: FormData) => studentApi.documents(Number(id), fd),
    onSuccess: () => {
      toast.success('Dokumen berhasil diunggah');
      setUploadProgress(null);
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.status });
    },
    onError: (err: unknown) => {
      setUploadProgress(null);
      const e = err as { message?: string; code?: string; response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string; error?: { errors?: Record<string, string[]>; message?: string } } } };
      console.error('document upload failed', e);
      const apiErrors = e?.response?.data?.errors ?? e?.response?.data?.error?.errors;
      if (apiErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([key, msgs]) => { fieldErrors[key] = msgs[0]; });
        setErrors(fieldErrors);
        const firstField = Object.keys(apiErrors)[0];
        toast.error(`Gagal: ${apiErrors[firstField]?.[0] || 'Dokumen tidak valid'}`);
      } else {
        const status = e?.response?.status ? 'HTTP ' + e.response.status + ': ' : '';
        const message = e?.response?.data?.message ?? e?.response?.data?.error?.message ?? e?.message ?? 'Request gagal sebelum sampai server. Cek login, koneksi, atau coba refresh halaman.';
        toast.error(status + message);
      }
    },
  });

  const requirements: Requirement[] = ((formData?.document_requirements as Array<{ periode_id: number; requirements: Requirement[] }> | undefined) ?? [])
    .find((entry) => Number(entry.periode_id) === Number(id))?.requirements ?? [];

  // R11 audit fix: status endpoint mengembalikan { registrations: [...] }, tiap
  // registration punya relasi `dokumen`. Cari registration yang cocok dengan
  // periode ini, lalu ambil dokumennya. Sebelumnya (bug): kita cari field
  // `documents` / `uploaded_documents` di response yang tidak pernah ada →
  // `alreadyUploaded` selalu false sehingga mahasiswa selalu harus re-upload.
  const registrations = (statusData as { registrations?: Array<{ periode_id?: number; status?: string; rejection_reason?: string | null; dokumen?: UploadedDoc[]; documents?: UploadedDoc[] }> } | undefined)?.registrations ?? [];
  const matchingRegistration = registrations.find((r) => Number(r?.periode_id) === Number(id));
  const rawUploadedDocs: UploadedDoc[] = matchingRegistration?.documents ?? matchingRegistration?.dokumen ?? [];
  const uploadedDocs: UploadedDoc[] = matchingRegistration?.status === 'rejected' ? [] : rawUploadedDocs.filter((d) => d.file_exists !== false);
  const registrationStatus = String(matchingRegistration?.status ?? '');
  const hasUploadedDocs = uploadedDocs.length > 0;
  const canUpload = !(['document_verified', 'approved'].includes(registrationStatus) && hasUploadedDocs);
  const selectedFilesCount = Object.values(files).filter(Boolean).length;
  const isReplacingAny = Object.values(replacing).some(Boolean);

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      const error = validateFile(file);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
        setFiles((prev) => ({ ...prev, [field]: null }));
        toast.error(error);
        return;
      }
    }
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const viewExistingDocument = async (doc: UploadedDoc) => {
    const key = encodeURIComponent(String(doc.id ?? doc.document_type ?? doc.field));
    try {
      const res = await rawApi.get(`/student/registration/${Number(id)}/documents/${key}/view`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Gagal membuka dokumen. File mungkin tidak ada di storage.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpload) {
      toast.info('Dokumen sudah diverifikasi/disetujui admin.');
      return;
    }

    // Validate required documents are selected
    const missingRequired: string[] = [];
    requirements.forEach((req) => {
      if (req.required === false) return;
      const field = req.field;
      const alreadyUploaded = uploadedDocs.some((d) => docMatchesField(d, field));
      if (!files[field] && !alreadyUploaded) {
        missingRequired.push(req.label || field);
      }
    });

    if (missingRequired.length > 0) {
      toast.error(`Dokumen wajib belum dipilih: ${missingRequired.join(', ')}`);
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error('Perbaiki error pada file yang dipilih sebelum mengirim.');
      return;
    }

    const selectedFiles = Object.entries(files).filter(([, f]) => f !== null);
    if (selectedFiles.length === 0) {
      toast.error('Pilih minimal satu dokumen untuk diunggah.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    selectedFiles.forEach(([key, file]) => {
      if (file) {
        fd.delete(key);
        fd.append(key, file);
      }
    });
    setUploadProgress(0);
    mutation.mutate(fd);
  };

  if (isLoading) {
    return <div className="mx-auto max-w-2xl"><div className="h-32 animate-pulse rounded-2xl bg-slate-200" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Upload Dokumen Persyaratan</h1>
        <p className="mt-1 text-sm text-slate-500">Format: PDF, JPG, atau PNG. Maksimal 5 MB per file.</p>
      </div>

      {!canUpload && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Dokumen sudah diverifikasi/disetujui admin. Upload ulang tidak tersedia.
        </div>
      )}

      {canUpload && hasUploadedDocs && registrationStatus !== 'rejected' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Dokumen sudah diunggah. Tidak perlu upload lagi. File input disembunyikan. Klik "Ganti / unggah ulang file ini" hanya jika ingin mengganti sebelum diverifikasi admin.
        </div>
      )}

      {registrationStatus === 'rejected' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          Pendaftaran ditolak admin. Silakan upload ulang dokumen yang benar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {requirements.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada requirement dokumen untuk periode ini.</p>
        ) : requirements.map((requirement) => {
          const field = String(requirement.field || '');
          const label = String(requirement.label || field);
          const description = String(requirement.description || '');
          const templateUrl = typeof requirement.template_url === 'string' ? requirement.template_url : '';
          const required = requirement.required !== false;
          const existingDoc = uploadedDocs.find((d) => docMatchesField(d, field));
          const selectedFile = files[field];
          const fieldError = errors[field];
          const showFileInput = canUpload && (!existingDoc || replacing[field]);

          return (
            <div key={field} className={`rounded-xl border p-4 ${fieldError ? 'border-rose-200 bg-rose-50/50' : existingDoc ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    {label} {required && <span className="text-rose-500">*</span>}
                  </label>
                  {description && <p className="text-xs text-slate-500">{description}</p>}
                  <p className="mt-1 text-xs font-medium text-amber-700">PDF, JPG, atau PNG, maksimal 5 MB.</p>
                </div>
                {templateUrl && (
                  <a href={`/api/v1/student/registration/${Number(id)}/documents/${field}/template`} target="_blank" rel="noreferrer"
                    className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                    Unduh Template
                  </a>
                )}
              </div>

              {/* Previously uploaded indicator */}
              {existingDoc && !selectedFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={14} />
                  <span>Sudah diunggah: {existingDoc.file_name || 'dokumen'}</span>
                  {existingDoc.uploaded_at && <span className="text-emerald-500">({formatWib(existingDoc.uploaded_at)})</span>}
                  <button type="button" onClick={() => viewExistingDocument(existingDoc)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"><Eye size={12}/> Lihat dokumen</button>
                </div>
              )}

              {existingDoc && canUpload && !replacing[field] && (
                <button
                  type="button"
                  onClick={() => setReplacing((prev) => ({ ...prev, [field]: true }))}
                  className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Ganti file ini
                </button>
              )}

              {showFileInput && (
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  name={field}
                  disabled={!canUpload}
                  onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                />
              )}

              {/* Selected file info */}
              {selectedFile && !fieldError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <FileText size={12} /> {selectedFile.name} ({formatSize(selectedFile.size)})
                </p>
              )}

              {/* Error */}
              {fieldError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertCircle size={12} /> {fieldError}
                </p>
              )}
            </div>
          );
        })}

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="rounded-lg bg-teal-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
              <Upload size={14} className="animate-bounce" /> Mengunggah dokumen...
            </div>
          </div>
        )}

        {canUpload && (selectedFilesCount > 0 || !hasUploadedDocs || isReplacingAny) ? (
          <button
            type="submit"
            disabled={mutation.isPending || Object.keys(errors).length > 0 || selectedFilesCount === 0}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Mengunggah...' : selectedFilesCount > 0 ? 'Kirim Dokumen' : 'Pilih file terlebih dahulu'}
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
            Semua dokumen wajib sudah diunggah. Tidak ada file baru yang perlu dikirim.
          </div>
        )} 
      </form>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <PartyPopper size={34} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Selamat!</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Dokumen persyaratan KKN berhasil diunggah. Pendaftaran Anda sekarang menunggu verifikasi admin.
            </p>
            <button
              type="button"
              onClick={() => router.push('/mahasiswa/cek-pendaftaran')}
              className="mt-5 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700"
            >
              Lihat Status Pendaftaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
