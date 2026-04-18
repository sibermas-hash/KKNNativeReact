import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    layout?: 'vertical' | 'horizontal';
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, hint, id, className, layout = 'vertical', ...rest }, ref) => {
        const errorId = error && id ? `${id}-error` : undefined;
        const hintId = hint && id ? `${id}-hint` : undefined;
        const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

        const isHorizontal = layout === 'horizontal';

        return (
            <div className={clsx(
                isHorizontal ? 'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6' : 'flex flex-col space-y-2'
            )}>
                {label && (
                    <label 
                        htmlFor={id} 
                        className={clsx(
                            "text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1",
                            isHorizontal && "sm:min-w-[180px] sm:text-right"
                        )}
                    >
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
                                'w-full rounded-xl border border-emerald-50/60 bg-white px-4 py-2.5 text-sm text-emerald-950 transition-all placeholder:text-black',
                                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                error
                                    ? 'border-rose-500 focus:ring-rose-500/20'
                                    : 'hover:border-emerald-300',
                                rest.disabled && 'bg-gray-50 text-emerald-950 cursor-not-allowed border-emerald-50/60',
                                className,
                            )}
                            {...rest}
                        />
                    </div>
                    {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
                    {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-emerald-950">{hint}</p>}
                </div>
            </div>
        );
    },
);

FormInput.displayName = 'FormInput';
export default FormInput;
