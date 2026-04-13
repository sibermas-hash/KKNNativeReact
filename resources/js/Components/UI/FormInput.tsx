import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, hint, id, className, ...rest }, ref) => {
        const errorId = error && id ? `${id}-error` : undefined;
        const hintId = hint && id ? `${id}-hint` : undefined;
        const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

        return (
            <div className="flex flex-col space-y-2">
                {label && (
                    <label htmlFor={id} className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        {label}
                        {rest.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
                    </label>
                )}
                <div className="flex-1 w-full">
                    <div className="relative group/input">
                        <input
                            ref={ref}
                            id={id}
                            aria-invalid={!!error}
                            aria-describedby={describedBy}
                            className={clsx(
                                'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400',
                                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                error
                                    ? 'border-rose-500 focus:ring-rose-500/20'
                                    : 'hover:border-slate-400',
                                rest.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
                                className,
                            )}
                            {...rest}
                        />
                    </div>
                    {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
                    {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
                </div>
            </div>
        );
    },
);

FormInput.displayName = 'FormInput';
export default FormInput;
