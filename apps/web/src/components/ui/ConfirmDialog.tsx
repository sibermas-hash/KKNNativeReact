'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const CONFIRM_COLORS = {
  danger: 'bg-rose-600 hover:bg-rose-700',
  warning: 'bg-amber-500 hover:bg-amber-600',
  info: 'bg-emerald-600 hover:bg-emerald-700',
};

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmText = 'Konfirmasi', variant = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable[0]?.focus();
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    el.addEventListener('keydown', handleTab);
    return () => el.removeEventListener('keydown', handleTab);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog" aria-modal="true" aria-labelledby="confirm-title"
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 ring-1 ring-slate-200"
          >
            <h2 id="confirm-title" className="text-base font-black text-slate-900 text-center mb-2">{title}</h2>
            {description && <p className="text-sm text-slate-500 text-center mb-4">{description}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">
                Batal
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={clsx('flex-1 h-10 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]', CONFIRM_COLORS[variant])}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
