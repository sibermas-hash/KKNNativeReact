import { Head, useForm, router } from '@inertiajs/react';
import type { FormEventHandlerType } from '@/types/events';
import {
  Upload,
  ShieldCheck,
  FileText,
  ArrowLeft,
  Send,
  CheckCircle2,
  IdCard,
  Info,
  ChevronRight,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FileDrop } from '@/Pages/Student/Register/Components/FileDrop';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

interface DocumentRequirement {
  field: string;
  label: string;
  description: string;
  required: boolean;
  icon: string;
  has_template?: boolean;
}

interface Props extends PageProps {
  period: {
    id: number;
    name: string;
    program_type: string | null;
    jenis: { name: string; code: string } | null;
  };
  registration: { id: number; status: string } | null;
  document_requirements: DocumentRequirement[];
  existing_documents: {
    has_health_certificate: boolean;
    has_parent_permission: boolean;
  };
  parent_permission_template: string;
}

const ICON_MAP: Record<string, typeof ShieldCheck> = {
  'shield-check': ShieldCheck,
  'file-text': FileText,
  'id-card': IdCard,
};

export default function UploadDokumen({
  period,
  registration,
  document_requirements,
  existing_documents,
  parent_permission_template,
}: Props) {
  const form = useForm<Record<string, File | string | null>>({
    health_certificate: null,
    parent_permission: null,
    passport_scan: null,
    notes: '',
  });

  const handleSubmit: FormEventHandlerType = (e) => {
    e.preventDefault();
    form.post(`/mahasiswa/pendaftaran/${period.id}/dokumen`, {
      forceFormData: true,
    });
  };

  const getExisting = (field: string): boolean => {
    if (field === 'health_certificate') return existing_documents.has_health_certificate;
    if (field === 'parent_permission') return existing_documents.has_parent_permission;
    return false;
  };

  const isAlreadySubmitted =
    registration?.status === 'document_submitted' || registration?.status === 'approved';

  return (
    <AppLayout title="Unggah Dokumen">
      <Head title={`Dokumen — ${period.name}`} />

      <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans px-4 sm:px-6">
        {/* Back Navigation */}
        <div className="pt-6">
          <button
            onClick={() => router.visit('/mahasiswa/daftar')}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Kembali ke Daftar KKN
          </button>
        </div>

        {/* Header */}
        <div className="pb-4 border-b border-emerald-50">
          <div className="flex items-center gap-2 mb-1">
            <Upload size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Unggah Persyaratan</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">{period.name}</h1>
          {period.jenis && (
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
              {period.jenis.name}
            </span>
          )}
          <p className="text-sm text-emerald-700 mt-2">
            Unggah dokumen persyaratan berikut untuk menyelesaikan pendaftaran KKN.
          </p>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            Pastikan dokumen yang diunggah jelas dan mudah dibaca. Format yang diterima:{' '}
            <strong>PDF, JPG, JPEG, PNG</strong> dengan ukuran maksimal <strong>2 MB</strong> per
            berkas.
          </p>
        </div>

        {/* Already Submitted Banner */}
        {isAlreadySubmitted && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Dokumen sudah diunggah</p>
              <p className="text-xs text-emerald-700">
                Anda dapat mengunggah ulang dokumen jika perlu memperbarui berkas.
              </p>
            </div>
          </div>
        )}

        {/* Document Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            {document_requirements.map((doc) => {
              const IconComponent = ICON_MAP[doc.icon] || FileText;
              const hasExisting = getExisting(doc.field);
              const fileSelected = form.data[doc.field] instanceof File;

              return (
                <div
                  key={doc.field}
                  className="bg-white border border-emerald-50 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Document Header */}
                  <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <IconComponent size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-950">{doc.label}</h3>
                        <p className="text-xs text-emerald-600">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.required && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                          Wajib
                        </span>
                      )}
                      {hasExisting && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                          <CheckCircle2 size={10} /> Sudah Ada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div className="p-5">
                    <FileDrop
                      file={form.data[doc.field] as File | null}
                      onChange={(f) => form.setData(doc.field as any, f)}
                      label={hasExisting ? `Ganti ${doc.label}` : `Unggah ${doc.label}`}
                      error={form.errors[doc.field]}
                      templateUrl={doc.has_template ? parent_permission_template : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="bg-white border border-emerald-50 rounded-2xl shadow-sm p-5">
            <label className="text-sm font-semibold text-emerald-950 block mb-2">
              Catatan Tambahan
            </label>
            <textarea
              value={(form.data.notes as string) ?? ''}
              onChange={(e) => form.setData('notes', e.target.value)}
              placeholder="Catatan opsional untuk admin (jika ada)..."
              rows={3}
              className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm text-emerald-800 placeholder:text-emerald-400 focus:border-emerald-300 focus:ring-emerald-200 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-emerald-600">
              Setelah mengunggah dokumen, pendaftaran akan ditinjau oleh admin LPPM.
            </p>
            <button
              type="submit"
              disabled={form.processing}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {form.processing ? 'Mengunggah...' : 'Kirim Dokumen & Daftar'}
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
