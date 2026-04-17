import type { LucideIcon } from 'lucide-react';

interface BriefingItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const BriefingItem = ({ label, value, icon: Icon }: BriefingItemProps) => {
  return (
    <div className="flex items-center gap-6 group">
      <div className="h-12 w-12 rounded-2xl bg-emerald-50/30 text-gray-900 flex items-center justify-center shrink-0 border border-gray-200/60 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-gray-200 transition-all">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wider text-xs font-semibold leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-black tracking-tight uppercase group-hover:text-bg-emerald-100 transition-colors">
          {value}
        </p>
      </div>
    </div>
  );
};
