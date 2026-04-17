import { useState } from 'react';
import { Search, Filter, ChevronDown, RefreshCw, Layers, Binary, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface GroupSearchFilterProps {
  initialSearch: string;
  initialPeriodId: string;
  initialStatus: string;
  periods: Array<{ id: number; name: string }>;
  onApplyFilters: (filters: { search: string; periodId: string; status: string }) => void;
}

export const GroupSearchFilter = ({
  initialSearch,
  initialPeriodId,
  initialStatus,
  periods,
  onApplyFilters,
}: GroupSearchFilterProps) => {
  const [search, setSearch] = useState(initialSearch);
  const [periodId, setPeriodId] = useState(initialPeriodId);
  const [status, setStatus] = useState(initialStatus);
  const [showFilters, setShowFilters] = useState(false);

  const handleApply = () => {
    onApplyFilters({ search, periodId, status });
  };

  const handleReset = () => {
    setSearch('');
    setPeriodId('');
    setStatus('');
    onApplyFilters({ search: '', periodId: '', status: '' });
  };

  const activeFilterCount = (search ? 1 : 0) + (periodId ? 1 : 0) + (status ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 flex flex-col lg:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search
            size={20}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="w-full h-12 pl-16 pr-6 bg-emerald-50/10 border border-gray-200/30 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#f3f4f6]0 transition-all outline-none placeholder:text-gray-900/20"
            placeholder="Cari Kelompok, Lokasi, atau Pembimbing..."
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border',
              showFilters
                ? 'bg-[#16a34a] text-white border-emerald-600'
                : 'bg-white text-gray-600 hover:text-emerald-600 hover:border-emerald-200'
            )}
          >
            <Filter size={18} /> 
            {activeFilterCount > 0 ? `Katalog (${activeFilterCount})` : 'Katalog'}
          </button>
          <button
            onClick={handleApply}
            className="h-12 px-8 bg-emerald-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all border border-emerald-900 shadow-lg shadow-emerald-900/20"
          >
            Terapkan
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-t border-gray-200/50 overflow-hidden"
          >
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Layers size={14} className="text-[#1a7a4a]" /> Sesi Akademik
                    </label>
                    <div className="relative group/select">
                      <select
                        value={periodId}
                        onChange={(e) => setPeriodId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 outline-none transition-all focus:border-[#f3f4f6]0 appearance-none pr-10 cursor-pointer uppercase tracking-tight"
                      >
                        <option value="">Semua Periode</option>
                        {(periods || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name?.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <RefreshCw size={14} className="text-[#1a7a4a]" /> Status Operasional
                    </label>
                    <div className="relative group/select">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 outline-none transition-all focus:border-[#f3f4f6]0 appearance-none pr-10 cursor-pointer uppercase tracking-tight"
                      >
                        <option value="">Semua Status</option>
                        <option value="draft">Draft / Persiapan</option>
                        <option value="active">Aktif / Lapangan</option>
                        <option value="closed">Ditutup / Arsip</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-6 pt-6 border-t border-gray-200/50">
                  <button
                    onClick={handleReset}
                    className="text-xs font-bold text-gray-900 hover:text-rose-600 transition-colors uppercase tracking-widest flex items-center gap-2"
                  >
                    Atur Ulang
                  </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

