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
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {rest.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
    )}
    <div className="relative group/input">
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400',
          'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'hover:border-slate-400',
          rest.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
          className,
        )}
        {...rest}
      />
    </div>
    {error && <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    {hint && !error && <p id={hintId} className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
 );
},
);

FormInput.displayName = 'FormInput';
export default FormInput;
