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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-8 w-8 bg-[#e8f5ee] text-[#1a7a4a] rounded-lg flex items-center justify-center">
              <Icon size={16} />
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-600">{description}</p>}
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
        <div className="px-5 py-3 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentPanel;
