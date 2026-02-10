import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, id, className, ...rest }, ref) => (
        <div>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label}
                    {rest.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={id}
                rows={rest.rows ?? 4}
                className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition placeholder:text-slate-400',
                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300',
                    className,
                )}
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    ),
);

FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
