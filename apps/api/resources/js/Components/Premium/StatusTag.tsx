import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

interface StatusTagProps {
  status: string;
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  success: 'bg-[#ccfbf1] text-[#0f766e]',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  gray: 'bg-gray-100 text-emerald-800',
};

const ICONS = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
  info: Clock,
  gray: Clock,
};

export default function StatusTag({ status, label, variant, size = 'md' }: StatusTagProps) {
  const resolveVariant = (): keyof typeof VARIANTS => {
    if (variant) return variant;
    const s = status.toLowerCase();
    if (
      ['active', 'aktif', 'approved', 'setuju', 'disetujui', 'sukses', 'success', 'layak'].includes(
        s,
      )
    )
      return 'success';
    if (['pending', 'menunggu', 'waiting', 'process'].includes(s)) return 'warning';
    if (['inactive', 'nonaktif', 'rejected', 'ditolak', 'failure', 'error', 'gagal'].includes(s))
      return 'danger';
    return 'gray';
  };

  const v = resolveVariant();
  const Icon = ICONS[v];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
        VARIANTS[v],
        size === 'sm'
          ? 'px-2.5 py-0.5 text-xs'
          : size === 'md'
            ? 'px-3 py-1 text-xs'
            : 'px-4 py-1.5 text-sm',
      )}
    >
      {displayLabel}
    </span>
  );
}
