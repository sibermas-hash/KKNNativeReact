import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface ContentPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  padding?: boolean;
  className?: string;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  padding = true,
  className 
}) => {
  return (
    <div className={clsx(
      "bg-white rounded-2xl border-2 border-cyan-100 shadow-sm overflow-hidden flex flex-col font-sans",
      className
    )}>
      <div className="bg-slate-50/50 px-6 py-4 border-b border-cyan-100 flex justify-between items-center">
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
      </div>
      
      <div className={clsx(
        "flex-1",
        padding && "p-6"
      )}>
        {children}
      </div>
    </div>
  );
};

export default ContentPanel;
