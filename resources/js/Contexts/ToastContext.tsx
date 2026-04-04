import { createContext, useCallback, useContext, useMemo, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import {
 CheckCircleIcon,
 ExclamationTriangleIcon,
 InformationCircleIcon,
 XCircleIcon,
 XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastPriority = 'success' | 'warning' | 'error' | 'info';

interface ToastAction {
 label: string;
 href: string;
}

interface Toast {
 id: string;
 title: string;
 message?: string;
 priority: ToastPriority;
 action?: ToastAction;
 duration?: number;
}

interface ToastContextValue {
 toasts: Toast[];
 toast: (options: Omit<Toast, 'id'>) => void;
 dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
 toasts: [],
 toast: () => undefined,
 dismiss: () => undefined,
});

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const toastConfig: Record<
 ToastPriority,
 {
 icon: IconComponent;
 border: string;
 background: string;
 iconColor: string;
 }
> = {
 success: {
 icon: CheckCircleIcon,
 border: 'border-emerald-500/40',
 background: 'bg-emerald-500/15',
 iconColor: 'text-emerald-400',
 },
 warning: {
 icon: ExclamationTriangleIcon,
 border: 'border-amber-500/40',
 background: 'bg-amber-500/15',
 iconColor: 'text-amber-400',
 },
 error: {
 icon: XCircleIcon,
 border: 'border-red-500/40',
 background: 'bg-red-500/15',
 iconColor: 'text-red-400',
 },
 info: {
 icon: InformationCircleIcon,
 border: 'border-blue-500/40',
 background: 'bg-blue-500/15',
 iconColor: 'text-blue-400',
 },
};

export function useToast() {
 return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
 const [toasts, setToasts] = useState<Toast[]>([]);
 const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

 const dismiss = useCallback((id: string) => {
 if (timers.current[id]) {
 window.clearTimeout(timers.current[id]);
 delete timers.current[id];
 }

 setToasts((current) => current.filter((toast) => toast.id !== id));
 }, []);

 const toast = useCallback(
 (options: Omit<Toast, 'id'>) => {
 const id = Math.random().toString(36).slice(2);
 const duration = options.duration ?? (options.priority === 'error' ? 8000 : 5000);

 setToasts((current) => [{ ...options, id, duration }, ...current].slice(0, 5));
 timers.current[id] = window.setTimeout(() => dismiss(id), duration);
 },
 [dismiss],
 );

 const value = useMemo(
 () => ({
 toasts,
 toast,
 dismiss,
 }),
 [dismiss, toast, toasts],
 );

 return (
 <ToastContext.Provider value={value}>
 {children}
 <ToastContainer toasts={toasts} onDismiss={dismiss} />
 </ToastContext.Provider>
 );
}

function ToastContainer({
 toasts,
 onDismiss,
}: {
 toasts: Toast[];
 onDismiss: (id: string) => void;
}) {
 return (
 <div className="fixed bottom-6 right-6 z-[9999] flex w-80 flex-col gap-3">
 {toasts.map((toast) => {
 const config = toastConfig[toast.priority];
 const Icon = config.icon;

 return (
 <div
 key={toast.id}
 className={`relative overflow-hidden rounded-lg border p-5 shadow-lg ${config.border} ${config.background}`}
 style={{ background: 'rgba(15, 23, 42, 0.92)' }}
 >
 <div className="flex gap-4">
 <Icon className={`mt-0.5 h-6 w-6 flex-shrink-0 ${config.iconColor}`} />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-white">{toast.title}</p>
 {toast.message && (
 <p className="mt-1 text-xs leading-relaxed text-slate-300">{toast.message}</p>
 )}
 {toast.action && (
 <a
 href={toast.action.href}
 className={`mt-3 inline-block text-xs font-semibold underline ${config.iconColor}`}
 >
 {toast.action.label}
 </a>
 )}
 </div>
 <button
 type="button"
 onClick={() => onDismiss(toast.id)}
 className="rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
 >
 <XMarkIcon className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 );
}
