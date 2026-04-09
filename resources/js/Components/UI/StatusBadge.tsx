import Badge from './Badge';

type StatusMap = Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' }>;

const STATUS_MAP: StatusMap = {
    // Registration
    pending: { label: 'Menunggu verifikasi', variant: 'warning' },
    document_submitted: { label: 'Dokumen diajukan', variant: 'info' },
    approved: { label: 'Disetujui', variant: 'success' },
    rejected: { label: 'Ditolak', variant: 'danger' },
    completed: { label: 'Selesai', variant: 'success' },
    // Daily Report & Work Program
    draft: { label: 'Draf', variant: 'default' },
    submitted: { label: 'DIAJUKAN', variant: 'info' },
    revision: { label: 'Perlu revisi', variant: 'warning' },
    // Final Report
    reviewed: { label: 'Sudah ditinjau', variant: 'primary' },
    // Group
    active: { label: 'Aktif', variant: 'success' },
    closed: { label: 'Ditutup', variant: 'default' },
};

interface StatusBadgeProps {
 status: string;
 className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
 const config = STATUS_MAP[status] ?? { label: status, variant: 'default' as const };
 return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
