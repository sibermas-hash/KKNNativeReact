import { FileCheck, Download } from 'lucide-react';
import { clsx } from 'clsx';

interface FileDropProps {
  file: File | null;
  onChange: (f: File | null) => void;
  label: string;
  error?: string;
  templateUrl?: string | null;
}

export const FileDrop = ({
  file,
  onChange,
  label,
  error,
  templateUrl,
}: FileDropProps) => {
  return (
    <div className="relative group/file">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      <div
        className={clsx(
          'p-8 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center text-center gap-4',
          file
            ? 'border-emerald-500 bg-emerald-50/30'
            : 'border-slate-100 bg-slate-50/50 group-hover/file:border-emerald-200 group-hover/file:bg-emerald-50/20',
          error && 'border-rose-500 bg-rose-50/30',
        )}
      >
        <div
          className={clsx(
            'h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all',
            file
              ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100'
              : 'bg-white text-slate-300 group-hover/file:text-emerald-500 group-hover/file:scale-110',
            error && 'bg-rose-500 text-white',
          )}
        >
          {file ? (
            <FileCheck size={32} strokeWidth={2.5} />
          ) : (
            <Download size={32} strokeWidth={2.5} />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">
            {file ? file.name : error || label}
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">
            PDF/JPG MAX 2MB
          </p>
        </div>
        {templateUrl && (
          <a
            href={templateUrl}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 text-[9px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.3em] flex items-center gap-2 relative z-20"
          >
            GET TEMPLATE <Download size={10} strokeWidth={3} />
          </a>
        )}
      </div>
      {error && (
        <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">
          {error}
        </p>
      )}
    </div>
  );
};
