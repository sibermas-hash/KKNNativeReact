import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, id, className, ...rest }, ref) => (
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {label && (
                <label htmlFor={id} className="text-xs sm:text-sm font-semibold text-slate-700 sm:w-[150px] sm:min-w-[150px] sm:flex-shrink-0 sm:mt-2.5 whitespace-nowrap">
                    {label}
                    {rest.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <div className="flex-1 w-full">
                <textarea
                    ref={ref}
                    id={id}
                    rows={rest.rows ?? 4}
                    className={clsx(
                        'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 resize-none',
                        'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'hover:border-slate-400',
                        rest.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
                        className,
                    )}
                    {...rest}
                />
                {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
            </div>
        </div>
    ),
);

FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
