import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

interface RequirementNodeProps {
  label: string;
  ok: boolean;
  value: string;
  icon: LucideIcon;
}

export const RequirementNode = ({
  label,
  ok,
  value,
  icon: Icon,
}: RequirementNodeProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -5 }}
    className={clsx(
      'p-6 rounded-xl border-2 transition-all relative overflow-hidden group',
      ok ? 'bg-white border-emerald-100/60 shadow-sm' : 'bg-rose-50/50 border-rose-100/50',
    )}
  >
    <div className="flex items-center gap-4 mb-4">
      <div
        className={clsx(
          'h-12 w-12 rounded-2xl flex items-center justify-center transition-all',
          ok
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
            : 'bg-white text-rose-500 border border-rose-100',
        )}
      >
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div className="space-y-0.5">
        <span className="block text-sm font-bold text-emerald-950 uppercase tracking-wider text-xs font-semibold">
          {label}
        </span>
        <span
          className={clsx(
            'block text-sm font-bold tracking-tight',
            ok ? 'text-black' : 'text-rose-950',
          )}
        >
          {value}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className={clsx('h-1.5 flex-1 rounded-full', ok ? 'bg-emerald-100' : 'bg-rose-100')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: ok ? '100%' : '20%' }}
          className={clsx('h-full rounded-full', ok ? 'bg-emerald-600' : 'bg-rose-500')}
        />
      </div>
      <span
        className={clsx(
          'text-sm font-bold font-semibold uppercase text-xs',
          ok ? 'text-emerald-600' : 'text-rose-600',
        )}
      >
        {ok ? 'TERPENUHI' : 'WAJIB'}
      </span>
    </div>
    <div
      className={clsx(
        'absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 pointer-events-none',
        ok ? 'text-bg-emerald-100' : 'text-rose-900',
      )}
    >
      <Icon size={100} />
    </div>
  </motion.div>
);
