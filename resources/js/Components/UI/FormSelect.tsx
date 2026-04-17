import { type SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface Option {
    value: string | number;
    label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options?: Option[];
    placeholder?: string;
    layout?: 'vertical' | 'horizontal';
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, error, options = [], placeholder, id, className, children, layout = 'vertical', ...rest }, ref) => {
        const errorId = error && id ? `${id}-error` : undefined;
        const describedBy = errorId || undefined;

        const isHorizontal = layout === 'horizontal';

        return (
            <div className={clsx(
                isHorizontal ? 'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6' : 'flex flex-col space-y-2'
            )}>
                {label && (
                    <label 
                        htmlFor={id} 
                        className={clsx(
                            "text-xs font-bold text-gray-900 uppercase tracking-widest pl-1",
                            isHorizontal && "sm:min-w-[180px] sm:text-right"
                        )}
                    >
                        {label}
                        {rest.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
                    </label>
                )}
                <div className="flex-1 w-full">
                    <div className="relative group/select">
                        <select
                            ref={ref}
                            id={id}
                            aria-invalid={!!error}
                            aria-describedby={describedBy}
                            className={clsx(
                                'w-full rounded-xl border border-gray-200/60 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all appearance-none cursor-pointer',
                                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                error
                                    ? 'border-rose-500 focus:ring-rose-500/20'
                                    : 'hover:border-emerald-300',
                                rest.disabled && 'bg-gray-50 text-gray-900 cursor-not-allowed border-gray-200/60',
                                'pr-10',
                                className,
                            )}
                            {...rest}
                        >
                            {placeholder && <option value="">{placeholder}</option>}
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                            {children}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-900" aria-hidden="true">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    {error && <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
                </div>
            </div>
        );
    },
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
