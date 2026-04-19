import React from 'react';
import { FileText, ShieldCheck, FileCheck } from 'lucide-react';
import { FileDrop } from '@/Pages/Student/Register/Components/FileDrop';
import { RequirementNode } from '@/Pages/Student/Register/Components/RequirementNode';

interface DocumentUploadProps {
  form: {
    data: {
      health_certificate: File | null;
      parent_permission: File | null;
    };
    setData: (key: string, value: File | string | boolean | null) => void;
    errors: Partial<Record<string, string>>;
  };
  student_academic?: {
    has_health_certificate: boolean;
    has_parent_permission?: boolean;
    parent_permission_template?: string | null;
    [key: string]: unknown;
  } | null;
  hasHealthCertificate: boolean;
  hasParentPermission: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  form,
  student_academic,
  hasHealthCertificate,
  hasParentPermission,
}) => {
  return (
    <div className="space-y-10">
      {/* Section Heading — konsisten dengan IdentityForm & AcademicForm */}
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-[#16a34a] rounded-full" />
        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.4em]">
          Unggah Dokumen Persyaratan
        </h3>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Surat Keterangan Sehat */}
        <div className="p-10 rounded-[3rem] bg-white border border-emerald-50/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-emerald-600">
              <ShieldCheck size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Surat Keterangan Sehat
              </span>
            </div>
            {student_academic?.has_health_certificate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <ShieldCheck size={12} />
                Sudah Ada
              </span>
            )}
          </div>
          <FileDrop
            file={form.data.health_certificate}
            onChange={(f) => form.setData('health_certificate', f)}
            label="Surat Keterangan Sehat"
            error={form.errors.health_certificate}
          />
        </div>

        {/* Surat Izin Orang Tua */}
        <div className="p-10 rounded-[3rem] bg-white border border-emerald-50/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-emerald-600">
              <FileText size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Surat Izin Orang Tua
              </span>
            </div>
            {student_academic?.has_parent_permission && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <ShieldCheck size={12} />
                Sudah Ada
              </span>
            )}
          </div>
          <FileDrop
            file={form.data.parent_permission}
            onChange={(f) => form.setData('parent_permission', f)}
            label="Surat Izin Orang Tua"
            error={form.errors.parent_permission}
            templateUrl={student_academic?.parent_permission_template}
          />
        </div>
      </div>

      {/* Status Kelengkapan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RequirementNode
          label="KESEHATAN"
          ok={hasHealthCertificate}
          value="SURAT KETERANGAN SEHAT"
          icon={ShieldCheck}
        />
        <RequirementNode
          label="PERIZINAN"
          ok={hasParentPermission}
          value="SURAT IZIN ORANG TUA"
          icon={FileCheck}
        />
      </div>
    </div>
  );
};
