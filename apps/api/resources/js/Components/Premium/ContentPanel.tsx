import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface ContentPanelProps {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
  padding?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

const ContentPanel: React.FC<ContentPanelProps> = ({
  title,
  description,
  icon: Icon,
  children,
  padding = true,
  className,
  headerAction,
  footer,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border-2 border-cyan-100 shadow-sm overflow-hidden flex flex-col font-sans',
        className,
      )}
    >
      <div className="bg-slate-50/50 px-6 py-4 border-b border-cyan-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-cyan-600" strokeWidth={2.5} />}
          <div className="flex flex-col">
            <h2 className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider">
              {title}
            </h2>
            {description && (
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight mt-0.5 opacity-70">
                {description}
              </p>
            )}
          </div>
        </div>
        {headerAction && <div className="w-full sm:w-auto">{headerAction}</div>}
      </div>

      <div className={clsx('flex-1', padding && 'p-6')}>{children}</div>
      {footer && (
        <div className="bg-slate-50/30 px-6 py-4 border-t border-cyan-100 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentPanel;
