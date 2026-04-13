import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, LucideIcon } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

interface WarningMessageProps {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  icon?: LucideIcon;
}

export const WarningMessage = ({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = AlertCircle,
}: WarningMessageProps) => (
  <motion.div
    variants={itemVariants}
    className="rounded-[2.5rem] bg-rose-950 p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
      <Icon size={120} />
    </div>
    <div className="h-20 w-20 rounded-[2rem] bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-rose-900/50 relative z-10 border-4 border-rose-500/20">
      <Icon size={32} strokeWidth={2.5} />
    </div>
    <div className="flex-1 text-center md:text-left relative z-10">
      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-2">
        {title}
      </h3>
      <p className="text-sm font-bold text-rose-200/60 leading-relaxed uppercase tracking-wide max-w-xl">
        {description}
      </p>
    </div>
    <Link
      href={actionHref}
      className="px-10 py-5 bg-white text-rose-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-rose-100 transition-all hover:-translate-y-1 active:scale-95 relative z-10"
    >
      {actionLabel}
    </Link>
  </motion.div>
);
