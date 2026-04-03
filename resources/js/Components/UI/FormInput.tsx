import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, hint, id, className, ...rest }, ref) => (
        <div>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label}
                    {rest.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-sm transition placeholder:text-slate-400',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300',
                    className,
                )}
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    ),
);

FormInput.displayName = 'FormInput';
export default FormInput;
