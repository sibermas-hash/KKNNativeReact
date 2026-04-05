import Badge from './Badge';

type StatusMap = Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' }>;

const STATUS_MAP: StatusMap = {
    // Registration
    pending: { label: 'MENUNGGU_VERIFIKASI', variant: 'warning' },
    document_submitted: { label: 'DOKUMEN_DIAJUKAN', variant: 'info' },
    approved: { label: 'DISETUJUI_OPERASIONAL', variant: 'success' },
    rejected: { label: 'DITOLAK_ADMINISTRASI', variant: 'danger' },
    completed: { label: 'MISI_SELESAI', variant: 'success' },
    // Daily Report & Work Program
    draft: { label: 'DRAFT_ARSIP', variant: 'default' },
    submitted: { label: 'DIAJUKAN', variant: 'info' },
    revision: { label: 'REVISI_DPL', variant: 'warning' },
    // Final Report
    reviewed: { label: 'SUDAH_DIBACA', variant: 'primary' },
    // Group
    active: { label: 'AKUN_AKTIF', variant: 'success' },
    closed: { label: 'AKUN_NONAKTIF', variant: 'default' },
};

interface StatusBadgeProps {
 status: string;
 className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
 const config = STATUS_MAP[status] ?? { label: status, variant: 'default' as const };
 return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
