import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    layout?: 'vertical' | 'horizontal';
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, id, className, layout = 'vertical', ...rest }, ref) => {
        const isHorizontal = layout === 'horizontal';

        return (
            <div className={clsx(
                isHorizontal ? 'flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6' : 'flex flex-col space-y-2'
            )}>
                {label && (
                    <label 
                        htmlFor={id} 
                        className={clsx(
                            "text-xs font-bold text-emerald-950 uppercase tracking-widest pl-1",
                            isHorizontal && "sm:min-w-[180px] sm:text-right sm:mt-3"
                        )}
                    >
                        {label}
                        {rest.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
                    </label>
                )}
                <div className="flex-1 w-full">
                    <textarea
                        ref={ref}
                        id={id}
                        rows={rest.rows ?? 4}
                        className={clsx(
                            'w-full rounded-xl border border-emerald-50/60 bg-white px-4 py-2.5 text-sm text-emerald-950 transition-all placeholder:text-black resize-none',
                            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                            error
                                ? 'border-rose-500 focus:ring-rose-500/20'
                                : 'hover:border-emerald-300',
                            rest.disabled && 'bg-gray-50 text-emerald-950 cursor-not-allowed border-emerald-50/60',
                            className,
                        )}
                        {...rest}
                    />
                    {error && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
                </div>
            </div>
        );
    },
);

FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
