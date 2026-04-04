import Badge from './Badge';

type StatusMap = Record<string, { label: string; variant: 'berhasil' | 'peringatan' | 'danger' | 'info' | 'default' | 'primary' }>;

const STATUS_MAP: StatusMap = {
 // Registration
 pending: { label: 'Menunggu', variant: 'peringatan' },
 document_submitted: { label: 'Dokumen Diajukan', variant: 'info' },
 approved: { label: 'Disetujui', variant: 'berhasil' },
 rejected: { label: 'Ditolak', variant: 'danger' },
 completed: { label: 'Selesai', variant: 'berhasil' },
 // Daily Report & Work Program
 draft: { label: 'Draf', variant: 'default' },
 submitted: { label: 'Diajukan', variant: 'info' },
 revision: { label: 'Revisi', variant: 'peringatan' },
 // Final Report
 reviewed: { label: 'Sudah Direview', variant: 'primary' },
 // Group
 active: { label: 'Aktif', variant: 'berhasil' },
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
