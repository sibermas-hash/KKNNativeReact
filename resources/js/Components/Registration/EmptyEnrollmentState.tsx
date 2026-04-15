import { motion } from 'framer-motion';
import { FolderKanban } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const EmptyEnrollmentState = () => {
  return (
    <motion.div
      variants={itemVariants}
      className="p-20 text-center rounded-[4rem] bg-white border border-dashed border-emerald-100/60 group"
    >
      <div className="h-24 w-24 bg-emerald-50/30 rounded-[2.5rem] mx-auto flex items-center justify-center border border-emerald-100/60 mb-8 text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
        <FolderKanban size={48} />
      </div>
      <h3 className="text-2xl font-bold text-black uppercase tracking-tighter mb-4">
        No Active Enrollment Cycle
      </h3>
      <p className="text-[12px] font-bold text-emerald-950 uppercase tracking-widest leading-loose max-w-md mx-auto">
        Pantau terus portal informasi LPPM untuk jadwal pendaftaran KKN Reguler Cycle
        2026/2027.
      </p>
    </motion.div>
  );
};
