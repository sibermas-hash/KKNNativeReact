import { motion } from 'framer-motion';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PeriodOption } from '@/Pages/Student/Register/types';

interface SchemeSelectionMatrixProps {
  periods: PeriodOption[];
  selectedPeriodId: string;
  onPeriodChange: (id: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export const SchemeSelectionMatrix = ({
  periods,
  selectedPeriodId,
  onPeriodChange,
}: SchemeSelectionMatrixProps) => {
  return (
    <motion.div variants={itemVariants} className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-1 w-24 bg-emerald-600 rounded-full" />
          <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.4em]">
            Scheme Selection
          </h2>
        </div>
        <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">
          {periods.length} Programs Available
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {periods.map((period) => (
          <button
            key={period.id}
            type="button"
            onClick={() => onPeriodChange(String(period.id))}
            className={clsx(
              'text-left p-10 rounded-[3rem] border-2 transition-all duration-500 group relative overflow-hidden',
              selectedPeriodId === String(period.id)
                ? 'border-emerald-500 bg-white ring-8 ring-emerald-50 shadow-2xl'
                : 'border-emerald-50 bg-white hover:border-emerald-100 hover:shadow-xl',
            )}
          >
            <div className="flex justify-between items-start mb-8">
              <div
                className={clsx(
                  'h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all',
                  selectedPeriodId === String(period.id)
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                    : 'bg-emerald-50/30 text-emerald-950 group-hover:bg-emerald-50 group-hover:text-emerald-600',
                )}
              >
                <FolderKanban size={28} strokeWidth={2.5} />
              </div>
              {period.registration?.status && (
                <span
                  className={clsx(
                    'px-5 py-2 rounded-2xl text-[12px] font-bold uppercase tracking-widest',
                    period.registration.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100',
                  )}
                >
                  {period.registration.status === 'approved' ? 'CONFIRMED' : 'PENDING'}
                </span>
              )}
            </div>
            <div className="space-y-2 mb-8">
              <h3
                className={clsx(
                  'text-2xl font-bold tracking-tighter uppercase',
                  selectedPeriodId === String(period.id) ? 'text-bg-emerald-100' : 'text-emerald-950',
                )}
              >
                {period.nama}
              </h3>
              <p className="text-xs font-bold text-emerald-950 uppercase tracking-widest opacity-70">
                {period.program_type_label || period.jenis || 'KKN Scheme'} &bull; Deadline:{' '}
                {period.registration_end}
              </p>
            </div>
            <div
              className={clsx(
                'flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.2em] transition-all',
                selectedPeriodId === String(period.id)
                  ? 'text-emerald-600'
                  : 'text-emerald-400 group-hover:text-emerald-600',
              )}
            >
              Select Program{' '}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-2 transition-transform"
              />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
