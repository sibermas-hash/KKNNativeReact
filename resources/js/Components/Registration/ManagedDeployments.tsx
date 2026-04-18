import { motion } from 'framer-motion';
import { ManagedProgramCard } from '@/Pages/Student/Register/Components/ManagedProgramCard';
import type { PeriodOption } from '@/Pages/Student/Register/types';

interface ManagedDeploymentsProps {
  managed_programs: PeriodOption[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export const ManagedDeployments = ({ managed_programs }: ManagedDeploymentsProps) => {
  if (managed_programs.length === 0) return null;

  return (
    <motion.section variants={itemVariants} className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-1 w-24 bg-[#16a34a] rounded-full" />
        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-[0.4em]">
          Managed Deployments
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {managed_programs.map((program) => (
          <ManagedProgramCard key={program.id} program={program} />
        ))}
      </div>
    </motion.section>
  );
};
