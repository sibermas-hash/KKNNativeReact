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
 ({ label, error, options = [], placeholder, id, className, children, ...rest }, ref) => {
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy = errorId || undefined;

  return (
  <div className="space-y-1">
    {label && (
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {rest.required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
    )}
    <div className="relative group/select">
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all appearance-none cursor-pointer',
          'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'hover:border-slate-400',
          rest.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
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
      <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none text-emerald-400" aria-hidden="true">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {error && <p id={errorId} role="alert" className="mt-1.5 text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">{error}</p>}
  </div>
 );
},
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
