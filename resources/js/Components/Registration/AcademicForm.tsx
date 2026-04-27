import React from 'react';
import { RequirementNode } from '@/Pages/Student/Register/Components/RequirementNode';
import { Binary, UserCheck, GraduationCap, ClipboardCheck, Info } from 'lucide-react';

interface RequirementInfo {
  name: string;
  type: string;
  passed?: boolean;
  message?: string;
}

interface AcademicFormProps {
  student_academic?: {
    sks_completed: number;
    is_bta_ppi_passed: boolean;
    bta_ppi_status?: string | null;
    min_sks: number;
    semester?: number;
    gpa?: number | null;
  } | null;
  requirements?: string[]; // Daftar deskripsi syarat dari requirement_info.requirements
  eligibility_checks?: Record<string, any>; // Hasil validasi dari eligibility.checks
}

export const AcademicForm: React.FC<AcademicFormProps> = ({
  student_academic,
  requirements = [],
  eligibility_checks = {},
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-emerald-600 rounded-full" />
        <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.4em]">
          Kualifikasi & Status Mahasiswa
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ringkasan Profil Akademik */}
        <div className="md:col-span-1 p-8 rounded-[2.5rem] bg-emerald-950 text-white space-y-6 shadow-xl">
          <div className="flex items-center gap-3 opacity-60">
            <GraduationCap size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Profil Anda</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Semester</p>
              <p className="text-2xl font-bold">{student_academic?.semester || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total SKS</p>
              <p className="text-2xl font-bold">{student_academic?.sks_completed || 0}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">IPK Terakhir</p>
              <p className="text-2xl font-bold">{student_academic?.gpa || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Daftar Syarat Dinamis */}
        <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-white border border-emerald-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-600">
              <ClipboardCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Checklist Kelayakan</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-700 uppercase tracking-tight border border-emerald-100">
              <Info size={12} /> Data Real-time
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requirements.length > 0 ? (
              requirements.map((req, index) => {
                // Menentukan icon dan status 'ok' secara cerdas
                const isBta = req.toLowerCase().includes('bta');
                const isSks = req.toLowerCase().includes('sks');
                const isGpa = req.toLowerCase().includes('ipk');
                
                // Cari status ok dari eligibility_checks jika ada
                let ok = true;
                if (isSks) ok = eligibility_checks.min_sks?.passed ?? true;
                if (isBta) ok = eligibility_checks.bta_ppi?.passed ?? true;
                if (isGpa) ok = eligibility_checks.min_gpa?.passed ?? true;

                return (
                  <RequirementNode
                    key={index}
                    label={isBta ? "RELIGIUS" : isSks || isGpa ? "AKADEMIK" : "SYARAT"}
                    ok={ok}
                    value={req}
                    icon={isBta ? UserCheck : isSks ? Binary : GraduationCap}
                  />
                );
              })
            ) : (
              <p className="col-span-2 text-center text-xs font-bold text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-2xl uppercase tracking-widest">
                Tidak ada persyaratan khusus untuk skema ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

