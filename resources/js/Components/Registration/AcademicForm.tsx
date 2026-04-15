import React from 'react';
import { RequirementNode } from '@/Pages/Student/Register/Components/RequirementNode';
import { Binary, UserCheck, GraduationCap } from 'lucide-react';

interface AcademicFormProps {
  student_academic?: {
    sks_completed: number;
    is_bta_ppi_passed: boolean;
    bta_ppi_status?: string | null;
    min_sks: number;
    semester?: number;
  } | null;
  qualifiedBySks: boolean;
  qualifiedByBta: boolean;
}

export const AcademicForm: React.FC<AcademicFormProps> = ({
  student_academic,
  qualifiedBySks,
  qualifiedByBta,
}) => {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-emerald-600 rounded-full" />
        <h3 className="text-xs font-bold text-black uppercase tracking-[0.4em]">
          Academic & Religious Standing
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 rounded-[3rem] bg-white border border-emerald-100/60 shadow-sm space-y-8">
          <div className="flex items-center gap-4 text-emerald-600">
            <GraduationCap size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">Status Akademik</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-emerald-950 uppercase tracking-wider">Semester</p>
              <p className="text-2xl font-bold text-black">{student_academic?.semester || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-emerald-950 uppercase tracking-wider">Total SKS</p>
              <p className="text-2xl font-bold text-black">{student_academic?.sks_completed || 0}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-50">
             <RequirementNode
                label="AKADEMIK"
                ok={qualifiedBySks}
                value={`${student_academic?.sks_completed ?? 0} / ${student_academic?.min_sks ?? 100} SKS`}
                icon={Binary}
              />
          </div>
        </div>

        <div className="p-10 rounded-[3rem] bg-white border border-emerald-100/60 shadow-sm space-y-8">
          <div className="flex items-center gap-4 text-emerald-600">
            <UserCheck size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">Status Religius</span>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold text-emerald-950 uppercase tracking-wider">Status BTA-PPI</p>
            <p className="text-xl font-bold text-black uppercase">
              {student_academic?.bta_ppi_status || (student_academic?.is_bta_ppi_passed ? 'LULUS' : 'BELUM LULUS')}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <RequirementNode
              label="RELIGIUS"
              ok={qualifiedByBta}
              value="BTA-PPI"
              icon={UserCheck}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
