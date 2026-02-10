import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    processing?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin ingin melanjutkan?',
    confirmLabel = 'Ya, Lanjutkan',
    processing = false,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
            <p className="text-sm text-slate-600">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={processing}>
                    Batal
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={processing}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
