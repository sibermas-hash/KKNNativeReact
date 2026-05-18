'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';

type StatusType = 'approved' | 'completed' | 'pending' | 'rejected' | 'draft' | 'revision' | 'submitted' | string;

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DISETUJUI' },
  disetujui: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DISETUJUI' },
  completed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'SELESAI' },
  selesai: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'SELESAI' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU' },
  menunggu: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU' },
  submitted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU REVIEW' },
  document_submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'DOKUMEN MASUK' },
  document_verified: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'DOKUMEN TERVERIFIKASI' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'DITOLAK' },
  ditolak: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'DITOLAK' },
  revision: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'REVISI' },
  draft: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'DRAFT' },
  unregistered: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'BELUM DAFTAR' },
};

export function StatusBadge({ status, size = 'sm' }: { status: StatusType; size?: 'sm' | 'md' }): React.JSX.Element {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.draft;
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded border font-black uppercase tracking-wider', config.bg, config.text, config.border, size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs')}>
      {config.label}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, suffix, color = 'emerald' }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  suffix?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo';
}): React.JSX.Element {
  const colorClasses = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600', indigo: 'bg-indigo-50 text-indigo-600' };
  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-xl p-5 flex items-center gap-5 shadow-sm">
      <div className={clsx('h-12 w-12 rounded-lg flex items-center justify-center shrink-0', colorClasses[color])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-black text-slate-900 tabular-nums">{value}</span>
          {suffix && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

export function NavButton({ href, icon: Icon, label }: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}): React.JSX.Element {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-emerald-100 hover:bg-emerald-50 transition-all group">
      <div className="p-2 bg-slate-50 text-slate-400 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <Icon size={16} />
      </div>
      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-900 transition-colors uppercase tracking-tight">{label}</span>
      <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function DataTable({ columns, children }: { columns: React.ReactNode[]; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            {columns.map((col, idx) => <th key={idx} className="p-4 font-black uppercase tracking-wider">{col}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

type ResponsiveColumn<T> = {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  render: (row: T) => React.ReactNode;
};

export function ResponsiveTable<T>({ columns, data, keyExtractor, rowActions, onRowClick }: {
  columns: ResponsiveColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}): React.JSX.Element {
  const visibleCols = columns.filter((c) => !c.hideOnMobile);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className={clsx('p-4 font-black uppercase tracking-wider', col.hideOnMobile && 'hidden lg:table-cell')}>
                  {col.label}
                </th>
              ))}
              {rowActions && <th className="p-4 font-black uppercase tracking-wider text-xs text-slate-500">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-slate-50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/50'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx('p-4', col.hideOnMobile && 'hidden lg:table-cell')}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && <td className="p-4">{rowActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick?.(row)}
            className={clsx(
              'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 space-y-3',
              onRowClick && 'cursor-pointer active:bg-slate-50'
            )}
          >
            {visibleCols.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 min-w-[80px]">
                  {col.label}
                </span>
                <span className="text-sm text-slate-800 text-right">
                  {col.render(row)}
                </span>
              </div>
            ))}
            {rowActions && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                {rowActions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-lg font-black text-slate-700">{title}</p>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Re-export from dedicated file for tree-shaking
export { ConfirmDialog } from './ConfirmDialog';
