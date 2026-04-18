import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
    open?: boolean;
    show?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'clean';
    processing?: boolean;
}

export default function ConfirmDialog({
    open,
    show,
    onClose,
    onConfirm,
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    confirmLabel = 'Ya, Lanjutkan',
    cancelLabel = 'Batal',
    confirmVariant = 'danger',
    processing = false,
}: ConfirmDialogProps) {
    const isVisible = open !== undefined ? open : (show !== undefined ? show : false);

    return (
        <Modal show={isVisible} onClose={onClose} title={title} maxWidth="sm">
                <p className="text-sm font-medium text-emerald-950">
                    {message}
                </p>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        {cancelLabel}
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm} loading={processing}>
                        {confirmLabel}
                    </Button>
                </div>
        </Modal>
    );
}
