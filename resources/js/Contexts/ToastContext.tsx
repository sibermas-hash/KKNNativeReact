import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
 CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon,
 InformationCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

// ── Types ──────────────────────────────────────────────────────────────────────
export type ToastPriority = 'success' | 'warning' | 'error' | 'info'

interface Toast {
 id: string
 title: string
 message?: string
 priority: ToastPriority
 action?: { label: string; href: string }
 duration?: number
}

interface ToastContextValue {
 toasts: Toast[]
 toast: (opts: Omit<Toast, 'id'>) => void
 dismiss: (id: string) => void
}

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
 toasts: [], toast: () => { }, dismiss: () => { },
})

export const useToast = () => useContext(ToastContext)

// ── Config ─────────────────────────────────────────────────────────────────────
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const toastConfig: Record<ToastPriority, {
 icon: IconComponent; border: string; bg: string; iconColor: string
}> = {
 success: { icon: CheckCircleIcon, border: 'border-emerald-500/40', bg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
 warning: { icon: ExclamationTriangleIcon, border: 'border-amber-500/40', bg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
 error: { icon: XCircleIcon, border: 'border-red-500/40', bg: 'bg-red-500/15', iconColor: 'text-red-400' },
 info: { icon: InformationCircleIcon, border: 'border-blue-500/40', bg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
 const [toasts, setToasts] = useState<Toast[]>([])
 const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

 const dismiss = useCallback((id: string) => {
 clearTimeout(timers.current[id])
 setToasts(prev => prev.filter(t => t.id !== id))
 }, [])

 const toast = useCallback((opts: Omit<Toast, 'id'>) => {
 const id = Math.random().toString(36).slice(2)
 const duration = opts.duration ?? (opts.priority === 'error' ? 8000 : 5000)

 setToasts(prev => [{ ...opts, id }, ...prev].slice(0, 5)) // max 5

 timers.current[id] = setTimeout(() => dismiss(id), duration)
 }, [dismiss])

 return (
 <ToastContext.Provider value={{ toasts, toast, dismiss }}>
 {children}
 <ToastContainer toasts={toasts} onDismiss={dismiss} />
 </ToastContext.Provider>
 )
}

// ── Toast Container ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
 return (
 <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80">
 {toasts.map(t => {
 const cfg = toastConfig[t.priority]
 const Icon = cfg.icon
 return (
 <div key={t.id}
 className={`relative rounded-lg border p-5 overflow-hidden
 ${cfg.border} ${cfg.bg}`}
 style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
 <div className="flex gap-4">
 <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
 <div className="flex-1 min-w-0">
 <p className="text-white text-sm font-semibold">{t.title}</p>
 {t.message && (
 <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">{t.message}</p>
 )}
 {t.action && (
 <a href={t.action.href}
 className={`inline-block mt-3 text-xs font-semibold underline ${cfg.iconColor}`}>
 {t.action.label} →
 </a>
 )}
 </div>
 <button onClick={() => onDismiss(t.id)}
 className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 self-start">
 <XMarkIcon className="w-4 h-4" />
 </button>
 </div>
 {/* Status bar */}
 <div className={`absolute bottom-0 left-0 h-1 ${cfg.iconColor.replace('text', 'bg')} opacity-20`}
 style={{ width: '100%' }} />
 </div>
 )
}

