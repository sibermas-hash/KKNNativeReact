"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@sibermas/constants";
import { studentApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, FileText, Upload } from "lucide-react";
import { BackButton } from "@/components/ui/shared";
import { useTheme } from "@/components/ui/theme-provider";
import { PRIMARY_CLASS, SOFT_CLASS } from "@/lib/theme-config";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — matches backend RegistrationDocumentService
const ALLOWED_TYPES = ["application/pdf"];
const ALLOWED_EXTENSIONS = [".pdf"];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `Ukuran file ${formatSize(file.size)} melebihi batas maksimal 5 MB.`;
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) return "Format file tidak didukung. Gunakan PDF.";
  }
  return null;
}

type Requirement = { field: string; label?: string; description?: string; template_url?: string; required?: boolean };
type UploadedDoc = {
  /** Legacy alias: some older responses used `field`. Prefer `document_type`. */
  field?: string;
  /** Canonical backend key — matches Requirement.field. */
  document_type?: string;
  file_name?: string;
  uploaded_at?: string;
};

/**
 * Normalize lookup key: check both `field` and `document_type` against the
 * Requirement field. Backend uses `document_type` (DokumenPesertaResource)
 * but some historical paths used `field`. Handle both defensively.
 */
function docMatchesField(doc: UploadedDoc, field: string): boolean {
  return doc.field === field || doc.document_type === field;
}

export default function UploadDokumenPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { config: themeConfig, surfaceClass } = useTheme();

  const { data: formData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.student.registration.form, "period-docs", Number(id)],
    queryFn: async () => {
      const res = await studentApi.registration.form();
      return res as unknown as Record<string, unknown>;
    },
  });

  // Fetch previously uploaded documents
  const { data: statusData } = useQuery({
    queryKey: [...QUERY_KEYS.student.registration.status],
    queryFn: async () => {
      const res = await studentApi.registration.status();
      return res as unknown as Record<string, unknown>;
    },
  });

  const mutation = useMutation({
    mutationFn: (fd: FormData) => studentApi.documents(Number(id), fd),
    onSuccess: () => {
      toast.success("Dokumen berhasil diunggah");
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.status });
      router.push("/mahasiswa/cek-pendaftaran");
    },
    onError: (err: unknown) => {
      setUploadProgress(null);
      const e = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string; error?: { errors?: Record<string, string[]>; message?: string } } } };
      const apiErrors = e?.response?.data?.errors ?? e?.response?.data?.error?.errors;
      if (apiErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([key, msgs]) => { fieldErrors[key] = msgs[0]; });
        setErrors(fieldErrors);
        const firstField = Object.keys(apiErrors)[0];
        toast.error(`Gagal: ${apiErrors[firstField]?.[0] || "Dokumen tidak valid"}`);
      } else {
        toast.error(e?.response?.data?.message ?? e?.response?.data?.error?.message ?? "Gagal mengunggah dokumen. Periksa koneksi dan coba lagi.");      }
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
  const uploadedDocs: UploadedDoc[] = matchingRegistration?.status === "rejected" ? [] : rawUploadedDocs;
  const registrationStatus = String(matchingRegistration?.status ?? "");
  const hasUploadedDocs = uploadedDocs.length > 0;
  const canUpload = !(["document_verified", "approved"].includes(registrationStatus) && hasUploadedDocs);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpload) {
      toast.info("Dokumen sudah diverifikasi/disetujui admin.");
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
      toast.error(`Dokumen wajib belum dipilih: ${missingRequired.join(", ")}`);
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error("Perbaiki error pada file yang dipilih sebelum mengirim.");
      return;
    }

    const selectedFiles = Object.entries(files).filter(([, f]) => f !== null);
    if (selectedFiles.length === 0) {
      toast.error("Pilih minimal satu dokumen untuk diunggah.");
      return;
    }

    const fd = new FormData(e.currentTarget as HTMLFormElement);
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
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/mahasiswa/pendaftaran" label="Kembali ke Pendaftaran" />
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--profile-text)]">Upload Dokumen Persyaratan</h1>
        <p className="mt-1 text-sm text-[color:var(--profile-muted)]">Format: PDF. Maksimal 5 MB per file.</p>
      </div>

      {!canUpload && (
        <div className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-4 text-sm font-medium text-[color:var(--profile-warning-text)]">
          Dokumen sudah diverifikasi/disetujui admin. Upload ulang tidak tersedia.
        </div>
      )}

      {registrationStatus === "rejected" && (
        <div className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] p-4 text-sm font-medium text-[color:var(--profile-danger-text)]">
          Pendaftaran ditolak admin. Silakan upload ulang dokumen yang benar.
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className={`space-y-5 border border-[color:var(--profile-border)] p-6 ${themeConfig.shadow} ${surfaceClass}`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        {requirements.length === 0 ? (
          <p className="text-sm text-[color:var(--profile-muted)]">Tidak ada requirement dokumen untuk periode ini.</p>
        ) : requirements.map((requirement) => {
          const field = String(requirement.field || "");
          const label = String(requirement.label || field);
          const description = String(requirement.description || "");
          const templateUrl = typeof requirement.template_url === "string" ? requirement.template_url : "";
          const required = requirement.required !== false;
          const existingDoc = uploadedDocs.find((d) => docMatchesField(d, field));
          const selectedFile = files[field];
          const fieldError = errors[field];

          return (
            <div 
              key={field} 
              className={`rounded-xl border p-4 ${
                fieldError 
                  ? "border-[color:var(--profile-border)] bg-[color:var(--profile-danger)]" 
                  : existingDoc 
                    ? "border-[color:var(--profile-border)] bg-[color:var(--profile-soft)]" 
                    : "border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[color:var(--profile-text)]">
                    {label} {required && <span className="text-[color:var(--profile-danger-text)]">*</span>}
                  </label>
                  {description && <p className="text-xs text-[color:var(--profile-muted)]">{description}</p>}
                </div>
                {templateUrl && (
                  <a href={`/api/v1/student/registration/${Number(id)}/documents/${field}/template`} target="_blank" rel="noreferrer"
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${SOFT_CLASS} border`}>
                    Unduh Template
                  </a>
                )}
              </div>

              {/* Previously uploaded indicator */}
              {existingDoc && !selectedFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-[color:var(--profile-soft)] px-3 py-2 text-xs font-medium text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]">
                  <CheckCircle2 size={14} />
                  <span>Sudah diunggah: {existingDoc.file_name || "dokumen"}</span>
                  {existingDoc.uploaded_at && <span className="text-[color:var(--profile-soft-text)] opacity-85">({existingDoc.uploaded_at})</span>}
                </div>
              )}

              <input
                type="file"
                accept="application/pdf,.pdf"
                name={field}
                disabled={!canUpload}
                onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                className="w-full text-sm text-[color:var(--profile-muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-[color:var(--profile-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--profile-soft-text)] hover:file:opacity-90 cursor-pointer file:cursor-pointer disabled:cursor-not-allowed"
              />

              {/* Selected file info */}
              {selectedFile && !fieldError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[color:var(--profile-muted)]">
                  <FileText size={12} /> {selectedFile.name} ({formatSize(selectedFile.size)})
                </p>
              )}

              {/* Error */}
              {fieldError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[color:var(--profile-danger-text)]">
                  <AlertCircle size={12} /> {fieldError}
                </p>
              )}
            </div>
          );
        })}

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="rounded-lg bg-[color:var(--profile-soft)] p-3 border border-[color:var(--profile-border)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--profile-soft-text)]">
              <Upload size={14} className="animate-bounce" /> Mengunggah dokumen...
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !canUpload || Object.keys(errors).length > 0}
          className={`w-full rounded-xl py-3 text-sm font-black disabled:opacity-50 ${PRIMARY_CLASS}`}
        >
          {mutation.isPending ? "Mengunggah..." : "Kirim Dokumen"}
        </button>
      </form>
    </div>
  );
}
