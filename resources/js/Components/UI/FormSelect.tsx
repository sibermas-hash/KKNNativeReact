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
  <div>
    {label && (
      <label htmlFor={id} className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
        {label}
        {rest.required && <span className="ml-1 text-rose-500" aria-hidden="true">*</span>}
      </label>
    )}
    <div className="relative group">
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={clsx(
          'w-full rounded-2xl border bg-slate-50/50 px-5 py-4 text-sm font-semibold transition-all duration-300 appearance-none cursor-pointer',
          'focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/10'
            : 'border-slate-100 hover:border-emerald-200',
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
      <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none text-slate-400" aria-hidden="true">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {error && <p id={errorId} role="alert" className="mt-2 text-[10px] font-bold text-rose-600 uppercase tracking-widest">{error}</p>}
  </div>
 );
},
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
