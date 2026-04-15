import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, MapPin, Activity, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { BriefingItem } from '@/Pages/Student/Register/Components/BriefingItem';
import { clsx } from 'clsx';

interface EnrollmentBriefingProps {
  selectedPeriod: {
    registration_mode_label?: string;
    placement_mode_label?: string;
  };
  domicile_profile?: { regency_name?: string } | null;
  readyToRegister: boolean;
  canSubmit: boolean;
  formProcessing: boolean;
  isRejectedRegistration: boolean;
  supportsSelfService: boolean;
}

export const EnrollmentBriefing = ({
  selectedPeriod,
  domicile_profile,
  readyToRegister,
  canSubmit,
  formProcessing,
  isRejectedRegistration,
  supportsSelfService,
}: EnrollmentBriefingProps) => {
  return (
    <div className="p-10 rounded-[3rem] bg-white border border-emerald-100/60 shadow-md sticky top-12 space-y-10">
      <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
        <div className="h-14 w-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
          <ShieldCheck size={28} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-black uppercase tracking-widest">
            Enrollment Briefing
          </h3>
          <p className="text-[12px] font-bold text-emerald-950 uppercase mt-1 opacity-70">
            Review & Deploy
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <BriefingItem
          label="Mode"
          value={selectedPeriod.registration_mode_label || 'Pribadi'}
          icon={UserCheck}
        />
        <BriefingItem
          label="Placement"
          value={selectedPeriod.placement_mode_label || 'Auto-Plot'}
          icon={MapPin}
        />
        <BriefingItem
          label="Origin Territory"
          value={domicile_profile?.regency_name || 'UNVERIFIED'}
          icon={Activity}
        />

        <div className="pt-6 border-t border-slate-50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold text-emerald-950 uppercase tracking-[0.3em]">
              Integrity Status
            </span>
            <span
              className={clsx(
                'text-[12px] font-bold uppercase tracking-widest',
                readyToRegister ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {readyToRegister ? 'VALID' : 'BLOCKED'}
            </span>
          </div>
          {!readyToRegister && (
            <motion.div
              animate={{ x: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4"
            >
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-900 leading-normal uppercase">
                Lengkapi prasyarat akademik dan dokumen untuk melanjutkan pendaftaran.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || formProcessing}
        className={clsx(
          'w-full py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.3em] shadow-2xl transition-all relative overflow-hidden group flex items-center justify-center gap-4',
          canSubmit && !formProcessing
            ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-2 active:scale-95'
            : 'bg-emerald-50/60 text-slate-300 cursor-not-allowed',
        )}
      >
        <AnimatePresence mode="wait">
          {formProcessing ? (
            <motion.div
              key="loading"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <RefreshCw size={20} />
            </motion.div>
          ) : (
            <motion.div key="ready" className="flex items-center gap-4">
              {isRejectedRegistration ? 'Resubmit Enrollment' : 'Deploy Application'}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-3 transition-transform"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {!supportsSelfService && (
        <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em] leading-relaxed">
            LPPM MANAGED SCHEME: SELEKSI INTERNAL AKTIF
          </p>
        </div>
      )}
    </div>
  );
};
