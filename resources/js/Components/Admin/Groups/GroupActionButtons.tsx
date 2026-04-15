import { Link } from '@inertiajs/react';
import { Download, Plus } from 'lucide-react';

interface GroupActionButtonsProps {
  canManage: boolean;
  onOpenCreateForm: () => void;
}

export const GroupActionButtons = ({ canManage, onOpenCreateForm }: GroupActionButtonsProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Unit <span className="text-emerald-600">Pelaksana.</span>
        </h1>
        <p className="text-sm font-medium text-emerald-950 max-w-2xl">
          Otoritas penempatan mahasiswa dan strategi distribusi wilayah kerja terpadu KKN UIN SAIZU.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <Link
          href="/admin/kelompok/template"
          className="h-11 px-6 bg-white border border-emerald-100 text-emerald-600 rounded-xl font-bold transition-all hover:bg-emerald-50 flex items-center gap-3 active:scale-95 text-[12px] uppercase tracking-widest"
        >
          <Download size={18} />
          Format Impor
        </Link>
        <button
          onClick={onOpenCreateForm}
          disabled={!canManage}
          className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 disabled:opacity-20 text-[12px] uppercase tracking-widest border border-emerald-500"
        >
          <Plus size={18} />
          Inisialisasi Unit
        </button>
      </div>
    </div>
  );
};
