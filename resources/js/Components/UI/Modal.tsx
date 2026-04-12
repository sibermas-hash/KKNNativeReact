import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';

interface ModalProps {
    children: React.ReactNode;
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
    closeable?: boolean;
    onClose: () => void;
    title?: string;
}

export default function Modal({
    children,
    show,
    maxWidth = '2xl',
    closeable = true,
    onClose,
    title,
}: ModalProps) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '4xl': 'sm:max-w-4xl',
        '7xl': 'sm:max-w-7xl',
    };

    return (
        <Transition show={show} as={Fragment} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                onClose={close}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-emerald-950/20 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-4 scale-95"
                        >
                            <Dialog.Panel
                                className={clsx(
                                    'w-full transform overflow-hidden bg-white border border-emerald-50 p-6 text-left align-middle shadow-2xl shadow-emerald-900/10 transition-all font-sans antialiased rounded-3xl',
                                    maxWidthClass[maxWidth]
                                )}
                            >
                                {title && (
                                    <Dialog.Title
                                        as="h3"
                                        className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-950 mb-6 border-b border-emerald-50 pb-4"
                                    >
                                        {title}
                                    </Dialog.Title>
                                )}
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
