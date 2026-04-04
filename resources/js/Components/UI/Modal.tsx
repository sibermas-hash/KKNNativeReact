import { Fragment, type PropsWithChildren } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
 open: boolean;
 onClose: () => void;
 title?: string;
 maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const widths = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
 xl: 'max-w-xl',
 '2xl': 'max-w-2xl',
 '3xl': 'max-w-3xl',
};

export default function Modal({
 open,
 onClose,
 title,
 maxWidth = 'lg',
 children,
}: PropsWithChildren<ModalProps>) {
 return (
 <Transition show={open} as={Fragment}>
 <Dialog as="div" className="relative z-50" onClose={onClose}>
 <TransitionChild
 as={Fragment}
 enter="ease-out"
 enterFrom="opacity-0"
 enterTo="opacity-100"
 leave="ease-in"
 leaveFrom="opacity-100"
 leaveTo="opacity-0"
 >
 <div className="fixed inset-0 bg-black/40 />
 </TransitionChild>

 <div className="fixed inset-0 overflow-y-auto">
 <div className="flex min-h-full items-center justify-center p-4">
 <TransitionChild
 as={Fragment}
 enter="ease-out"
 enterFrom="opacity-0"
 enterTo="opacity-100"
 leave="ease-in"
 leaveFrom="opacity-100"
 leaveTo="opacity-0"
 >
 <DialogPanel
 className={`w-full ${widths[maxWidth]} rounded-lg bg-white p-6 ring-1 ring-slate-900/5`}
 >
 {title && (
 <div className="mb-4 flex items-center justify-between">
 <DialogTitle className="text-lg font-semibold text-slate-900">
 {title}
 </DialogTitle>
 <button
 onClick={onClose}
 className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
 >
 <XMarkIcon className="h-5 w-5" />
 </button>
 </div>
 )}
 {children}
 </DialogPanel>
 </TransitionChild>
 </div>
 </div>
 </Dialog>
 </Transition>
 );
}
