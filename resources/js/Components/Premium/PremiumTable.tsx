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
          <tr className="border-b-2 border-emerald-50">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className={clsx(
                  "px-6 py-3 text-xs font-semibold text-emerald-800 uppercase tracking-wider",
                  header === 'Aksi' || header === 'Tindakan' ? "text-right" : "text-left",
                  index === 0 && React.isValidElement(header) ? "w-12 text-center" : ""
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f3f4f6]">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Layers size={40} className="text-[#e5e7eb] mb-2" strokeWidth={1} />
                  <span className="text-sm italic font-medium text-emerald-950/40">Data Kosong</span>
                  <p className="text-xs text-emerald-800">{emptyText}</p>
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
  <tr className={clsx("hover:bg-gray-50 transition-colors", className)}>
    {children}
  </tr>
);

export const PremiumTableCell: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className, align = 'left' }) => (
  <td className={clsx(
    "px-6 py-4 text-sm text-emerald-950 whitespace-nowrap",
    align === 'center' && "text-center",
    align === 'right' && "text-right",
    className
  )}>
    {children}
  </td>
);

export default PremiumTable;
