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
    <div className="p-12 rounded-[3.5rem] bg-white border border-emerald-50/60 shadow-sm space-y-12 relative overflow-hidden">
      <div className="flex items-center gap-6 border-b border-[#f3f4f6] pb-8">
        <div className="h-12 w-12 rounded-xl bg-[#e8f5ee] text-emerald-600 flex items-center justify-center shadow-inner">
          <FileText size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.4em]">
            Data Ingestion
          </h3>
          <p className="text-xs font-bold text-emerald-950 uppercase mt-1 opacity-70">
            Verify administrative dossiers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* HEALTH DATA */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest">
              Medical Clearance
            </label>
            {student_academic?.has_health_certificate && (
              <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> Exists
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

        {/* GUARDIAN DATA */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-emerald-950 uppercase tracking-widest">
              Parent Permission
            </label>
            {student_academic?.has_parent_permission && (
              <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> Exists
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-[#f3f4f6]">
          <RequirementNode
            label="FISIK"
            ok={hasHealthCertificate}
            value="SURAT SEHAT"
            icon={ShieldCheck}
          />
          <RequirementNode
            label="IZIN"
            ok={hasParentPermission}
            value="SURAT IZIN"
            icon={FileCheck}
          />
      </div>
    </div>
  );
};
