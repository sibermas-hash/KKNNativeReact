import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  groupLabel?: string;
  stats?: {
    label: string;
    value: string | number;
    icon?: LucideIcon;
  };
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  groupLabel, 
  stats,
  children 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200 pt-2">
      <div className="space-y-2">
        {(groupLabel || Icon) && (
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-gray-700" />}
            {groupLabel && <span className="text-sm font-medium text-gray-700">{groupLabel}</span>}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-700 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {stats && (
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
            {stats.icon && (
              <div className="h-9 w-9 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
                <stats.icon size={18} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-700 leading-none mb-1">{stats.label}</span>
              <span className="text-sm font-bold text-gray-900 leading-none">{stats.value}</span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
