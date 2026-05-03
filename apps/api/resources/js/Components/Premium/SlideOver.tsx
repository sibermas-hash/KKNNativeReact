import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'md',
}) => {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-cyan-950/20 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={clsx(
              'fixed inset-y-0 right-0 w-full z-[101] bg-white shadow-2xl flex flex-col font-sans',
              widthClasses[width],
            )}
          >
            {/* Header */}
            <div className="px-6 py-6 border-b border-cyan-50 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-cyan-950 tracking-tight leading-none uppercase">
                  {title}
                </h2>
                {description && (
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border-2 border-slate-100 text-slate-400 hover:text-cyan-600 hover:border-cyan-100 transition-all active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SlideOver;
