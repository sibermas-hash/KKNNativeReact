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
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, error, options = [], placeholder, id, className, children, ...rest }, ref) => (
        <div>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label}
                    {rest.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <select
                ref={ref}
                id={id}
                className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-sm transition',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300',
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
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    ),
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
