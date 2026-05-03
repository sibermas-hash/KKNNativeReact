import { FileCheck, Download, UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';

interface FileDropProps {
  file: File | null;
  onChange: (f: File | null) => void;
  label: string;
  error?: string;
  templateUrl?: string | null;
}

export const FileDrop = ({ file, onChange, label, error, templateUrl }: FileDropProps) => {
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
          'p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center text-center gap-4',
          file
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-emerald-100 bg-emerald-50/20 group-hover/file:border-emerald-300 group-hover/file:bg-emerald-50/40',
          error && 'border-rose-300 bg-rose-50/30',
        )}
      >
        <div
          className={clsx(
            'h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            file
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50'
              : 'bg-white text-emerald-300 border border-emerald-100 group-hover/file:text-emerald-600 group-hover/file:scale-110 group-hover/file:shadow-md',
            error && 'bg-rose-500 text-white shadow-lg shadow-rose-200/50',
          )}
        >
          {file ? (
            <FileCheck size={28} strokeWidth={2} />
          ) : (
            <UploadCloud size={28} strokeWidth={2} />
          )}
        </div>
        <div className="space-y-1.5">
          <p
            className={clsx(
              'text-sm font-semibold tracking-tight truncate max-w-[220px]',
              file ? 'text-emerald-950' : error ? 'text-rose-700' : 'text-emerald-950',
            )}
          >
            {file ? file.name : error || label}
          </p>
          <p className="text-xs text-emerald-700/60 font-medium">Format: PDF / JPG — Maks. 2 MB</p>
        </div>
        {templateUrl && (
          <a
            href={templateUrl}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 text-xs font-semibold transition-colors relative z-20"
          >
            <Download size={12} strokeWidth={2.5} />
            Unduh Template
          </a>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-600 text-center">{error}</p>}
    </div>
  );
};
