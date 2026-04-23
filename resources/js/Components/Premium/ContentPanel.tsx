import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ContentPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: boolean;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  headerAction, 
  footer,
  children,
  padding = true
}) => {
  return (
    <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-emerald-50 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="h-10 w-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
              <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] font-display">{title}</h3>
            {description && <p className="text-sm font-medium text-emerald-800/50 font-elegant italic mt-0.5 lowercase tracking-tight">{description}</p>}
          </div>
        </div>
        {headerAction && (
          <div className="flex items-center gap-3">
            {headerAction}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={clsx(padding && "p-5")}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-emerald-50 bg-slate-50/30">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentPanel;
