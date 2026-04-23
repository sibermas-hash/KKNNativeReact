import React from 'react';
import { clsx } from 'clsx';
import { Layers } from 'lucide-react';

interface TableProps {
  headers: (string | React.ReactNode)[];
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
}

const PremiumTable: React.FC<TableProps> = ({ 
  headers, 
  children, 
  isEmpty, 
  emptyText = "Belum ada data tersedia saat ini." 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-emerald-100 bg-slate-50/30">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className={clsx(
                  "px-6 py-4 text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] font-display",
                  (header === 'Aksi' || header === 'Tindakan' || header === 'Opsi') ? "text-right" : "text-left",
                  index === 0 && React.isValidElement(header) ? "w-12 text-center" : ""
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50/50">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100 mb-2">
                    <Layers size={32} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-950/20 font-display">Data Kosong</span>
                  <p className="text-xs font-bold text-emerald-800/40 uppercase tracking-tight max-w-xs leading-relaxed">{emptyText}</p>
                </div>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export const PremiumTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <tr className={clsx("hover:bg-emerald-50/30 transition-all duration-200 group", className)}>
    {children}
  </tr>
);

export const PremiumTableCell: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className, align = 'left' }) => (
  <td className={clsx(
    "px-6 py-5 text-[13px] font-medium text-emerald-950 whitespace-nowrap font-sans",
    align === 'center' && "text-center",
    align === 'right' && "text-right",
    className
  )}>
    {children}
  </td>
);

export default PremiumTable;
