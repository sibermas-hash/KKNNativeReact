import React from 'react';
import { FileText, ShieldCheck, FileCheck, UploadCloud, AlertCircle } from 'lucide-react';
import { FileDrop } from '@/Pages/Student/Register/Components/FileDrop';
import { RequirementNode } from '@/Pages/Student/Register/Components/RequirementNode';

interface DynamicDocument {
  name: string;
  key: string;
  type: 'upload' | 'db_check';
}

interface DocumentUploadProps {
  form: {
    data: any;
    setData: (key: string, value: any) => void;
    errors: Partial<Record<string, string>>;
  };
  student_academic?: any;
  dynamic_documents?: DynamicDocument[]; // Diambil dari requirement_info.requirements yang filternya 'upload'
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  form,
  student_academic,
  dynamic_documents = [],
}) => {
  // Filter hanya yang tipe 'upload'
  const uploadRequirements = dynamic_documents.filter(d => d.type === 'upload');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-emerald-600 rounded-full" />
        <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.4em]">
          Unggah Berkas Pendukung
        </h3>
      </div>

      {uploadRequirements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {uploadRequirements.map((doc, index) => {
            const fieldKey = `dynamic_files.${doc.key}`;
            const isExisting = student_academic?.[`has_${doc.key}`] || false;

            return (
              <div 
                key={doc.key || index} 
                className="p-8 rounded-[2.5rem] bg-white border border-emerald-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <UploadCloud size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {doc.name}
                    </span>
                  </div>
                  {isExisting && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-tight">
                      <ShieldCheck size={12} /> Terverifikasi
                    </span>
                  )}
                </div>
                
                <FileDrop
                  file={form.data.dynamic_files?.[doc.key] || null}
                  onChange={(f) => {
                    const currentFiles = { ...(form.data.dynamic_files || {}) };
                    currentFiles[doc.key] = f;
                    form.setData('dynamic_files', currentFiles);
                  }}
                  label={doc.name}
                  error={form.errors[fieldKey]}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
          <FileCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada dokumen yang perlu diunggah.</p>
        </div>
      )}
    </div>
  );
};

