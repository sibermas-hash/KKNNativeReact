import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

interface RequirementNodeProps {
  label: string;
  ok: boolean;
  value: string;
  icon: LucideIcon;
}

export const RequirementNode = ({ label, ok, value, icon: Icon }: RequirementNodeProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4 }}
    className={clsx(
      'p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group',
      ok
        ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md'
        : 'bg-rose-50/50 border-rose-100',
    )}
  >
    <div className="flex items-center gap-4 mb-4">
      <div
        className={clsx(
          'h-11 w-11 rounded-xl flex items-center justify-center transition-all',
          ok
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50'
            : 'bg-white text-rose-500 border border-rose-200',
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="space-y-0.5">
        <span className="block text-xs font-semibold text-emerald-700/70 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={clsx(
            'block text-sm font-bold tracking-tight',
            ok ? 'text-emerald-950' : 'text-rose-950',
          )}
        >
          {value}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2.5">
      <div className={clsx('h-1.5 flex-1 rounded-full', ok ? 'bg-emerald-100' : 'bg-rose-100')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: ok ? '100%' : '20%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={clsx('h-full rounded-full', ok ? 'bg-emerald-500' : 'bg-rose-400')}
        />
      </div>
      <span
        className={clsx(
          'text-xs font-semibold uppercase',
          ok ? 'text-emerald-600' : 'text-rose-600',
        )}
      >
        {ok ? 'Terpenuhi' : 'Wajib'}
      </span>
    </div>
    {/* Background decorative icon */}
    <div
      className={clsx(
        'absolute -bottom-3 -right-3 opacity-[0.04] rotate-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-0 pointer-events-none',
        ok ? 'text-emerald-600' : 'text-rose-600',
      )}
    >
      <Icon size={90} />
    </div>
  </motion.div>
);
