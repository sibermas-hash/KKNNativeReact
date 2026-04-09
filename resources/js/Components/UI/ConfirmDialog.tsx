import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'clean';
    processing?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    confirmLabel = 'Ya, Lanjutkan',
    confirmVariant = 'danger',
    processing = false,
}: ConfirmDialogProps) {
    return (
        <Modal show={open} onClose={onClose} title={title} maxWidth="sm">
            <div className="space-y-6">
                <p className="text-[11px] font-black uppercase tracking-tight text-emerald-900 leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={processing} className="h-9 px-4">
                        Batal
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm} loading={processing} className="h-9 px-6">
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
