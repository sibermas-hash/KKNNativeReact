import Link from 'next/link';
import clsx from 'clsx';
import { BadgeCheck, Lock, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

type StatusType = 'approved' | 'pending' | 'rejected' | 'draft' | 'revision' | 'submitted' | string;

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DISETUJUI' },
  disetujui: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'DISETUJUI' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU' },
  menunggu: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU' },
  submitted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'MENUNGGU REVIEW' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'DITOLAK' },
  ditolak: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'DITOLAK' },
  revision: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'REVISI' },
  draft: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'DRAFT' },
  unregistered: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', label: 'BELUM DAFTAR' },
};

export function StatusBadge({ status, size = 'sm' }: { status: StatusType; size?: 'sm' | 'md' }) {
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
}) {
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
}) {
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

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
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

export function DataTable({ columns, children }: { columns: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            {columns.map((col) => <th key={col} className="p-4 font-black uppercase tracking-wider">{col}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-lg font-black text-slate-700">{title}</p>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
