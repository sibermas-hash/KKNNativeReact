import { LucideIcon } from 'lucide-react';

interface BriefingItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const BriefingItem = ({ label, value, icon: Icon }: BriefingItemProps) => {
  return (
    <div className="flex items-center gap-6 group">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 text-gray-400 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
          {label}
        </p>
        <p className="text-sm font-black text-gray-900 tracking-tight uppercase group-hover:text-bg-emerald-100 transition-colors">
          {value}
        </p>
      </div>
    </div>
  );
};
