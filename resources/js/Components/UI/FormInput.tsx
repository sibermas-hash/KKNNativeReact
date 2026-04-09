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
  <div>
    {label && (
      <label htmlFor={id} className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 italic">
        {label}
        {rest.required && <span className="ml-1 text-rose-500" aria-hidden="true">*</span>}
      </label>
    )}
    <div className="relative group">
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clsx(
          'w-full rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 px-5 py-4 text-sm font-semibold transition-all duration-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-slate-100',
          'focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20',
          error
            ? 'border-rose-300 dark:border-rose-700/50 focus:border-rose-500 dark:focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-500/10 bg-rose-50/10 dark:bg-rose-950/20'
            : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-slate-600',
          className,
        )}
        {...rest}
      />
    </div>
    {error && <p id={errorId} role="alert" className="mt-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">{error}</p>}
    {hint && !error && <p id={hintId} className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{hint}</p>}
  </div>
 );
},
);

FormInput.displayName = 'FormInput';
export default FormInput;
