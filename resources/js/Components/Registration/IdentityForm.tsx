import React from 'react';
import { RequirementNode } from '@/Pages/Student/Register/Components/RequirementNode';
import { MapPin, User, FileText } from 'lucide-react';
import type { DomicileSummary, ProfileSummary } from '@/Pages/Student/Register/types';

interface IdentityFormProps {
  domicile_profile?: DomicileSummary | null;
  biodata_profile?: ProfileSummary | null;
  hasVerifiedDomicile: boolean;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  domicile_profile,
  biodata_profile,
  hasVerifiedDomicile,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-[#16a34a] rounded-full" />
        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.4em]">
          Identity & Domicile
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-emerald-50/60 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <User size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Data Biodata</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-2">
              <span className="text-xs font-bold text-emerald-950 uppercase">NIK</span>
              <span className="text-xs font-bold text-emerald-950 tracking-tight">
                {biodata_profile?.nik || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-2">
              <span className="text-xs font-bold text-emerald-950 uppercase">Nama Ibu</span>
              <span className="text-xs font-bold text-emerald-950 tracking-tight">
                {biodata_profile?.mother_name || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white border border-emerald-50/60 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <MapPin size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Data Wilayah</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-2">
              <span className="text-xs font-bold text-emerald-950 uppercase">Provinsi</span>
              <span className="text-xs font-bold text-emerald-950 tracking-tight">
                {domicile_profile?.province_name || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-2">
              <span className="text-xs font-bold text-emerald-950 uppercase">Kabupaten/Kota</span>
              <span className="text-xs font-bold text-emerald-950 tracking-tight">
                {domicile_profile?.regency_name || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
         <RequirementNode
            label="DOMISILI"
            ok={hasVerifiedDomicile}
            value={hasVerifiedDomicile ? "TERVERIFIKASI" : "BELUM LENGKAP"}
            icon={MapPin}
          />
      </div>
    </div>
  );
};
