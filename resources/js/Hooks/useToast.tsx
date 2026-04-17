import type { ReactNode} from 'react';
import { createContext, useContext, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    show: (message: string, type: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const show = useCallback((message: string, type: ToastType, duration = 3000) => {
        const id = `${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, message, type, duration };
        
        setToasts((prev) => [...prev, toast]);
        
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((message: string, duration?: number) => show(message, 'success', duration), [show]);
    const error = useCallback((message: string, duration?: number) => show(message, 'error', duration ?? 5000), [show]);
    const warning = useCallback((message: string, duration?: number) => show(message, 'warning', duration), [show]);
    const info = useCallback((message: string, duration?: number) => show(message, 'info', duration), [show]);

    const value: ToastContextType = { show, success, error, warning, info };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </AnimatePresence>
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const variants = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200',
            icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
            text: 'text-black',
            progress: 'bg-emerald-500',
        },
        error: {
            bg: 'bg-rose-50 border-rose-200',
            icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
            text: 'text-rose-900',
            progress: 'bg-rose-500',
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
            text: 'text-amber-900',
            progress: 'bg-amber-500',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: <Info className="w-5 h-5 text-blue-600" />,
            text: 'text-blue-900',
            progress: 'bg-blue-500',
        },
    };

    const style = variants[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, x: 400 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`${style.bg} border rounded-lg p-4 shadow-lg pointer-events-auto flex items-start gap-3 min-w-[300px]`}
        >
            <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
                <p className={`${style.text} text-sm font-semibold break-words`}>{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 text-gray-900 hover:text-gray-600 transition-colors"
                aria-label="Tutup notifikasi"
            >
                <X className="w-4 h-4" />
            </button>
            {toast.duration && toast.duration > 0 && (
                <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                    style={{ originX: 0 }}
                    className={`absolute bottom-0 left-0 right-0 h-1 ${style.progress} rounded-b-lg`}
                />
            )}
        </motion.div>
    );
}
