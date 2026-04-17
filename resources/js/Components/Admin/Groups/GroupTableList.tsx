import { Link } from '@inertiajs/react';
import { MapPin, UserCheck, Pencil, Trash2, Info, ChevronRight, CheckCircle2, History, SearchX, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Group {
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: string;
  registrations_count: number;
  approved_participants_count: number;
  pending_participants_count: number;
  available_slots: number;
  ready_for_placement: boolean;
  placement_note: string;
  period?: { id: number; name: string } | null;
  location?: {
    id: number;
    village_name: string;
    district_name?: string | null;
    regency_name?: string | null;
    full_name: string;
  } | null;
  main_lecturer?: { id: number; name: string } | null;
}

interface GroupTableListProps {
  groups: {
    data: Group[];
    meta: PaginationMeta;
  };
  canManage: boolean;
  onEdit: (group: Group) => void;
  onDelete: (id: number) => void;
}

export const GroupTableList = ({
  groups = { data: [], meta: { total: 0, current_page: 1, last_page: 1, per_page: 15 } },
  canManage,
  onEdit,
  onDelete,
}: GroupTableListProps) => {
  return (
    <div className="bg-white border border-gray-200/50 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50">
            <tr className="text-xs font-bold uppercase tracking-widest text-gray-900">
              <th className="px-8 py-4 w-16 text-center">No</th>
              <th className="px-8 py-4">Identitas Unit</th>
              <th className="px-8 py-4">Wilayah & Sesi</th>
              <th className="px-8 py-4">Status & Mentor</th>
              <th className="px-8 py-4 text-center">Kapasitas</th>
              <th className="px-8 py-4 text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {groups.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-32 text-center text-gray-900/10">
                    <div className="flex flex-col items-center gap-4">
                        <SearchX size={64} strokeWidth={1} />
                        <p className="text-xs font-bold uppercase tracking-widest">Unit belum terarsip</p>
                    </div>
                </td>
              </tr>
            ) : (
              groups.data.map((group, idx) => (
                <tr key={group.id} className="group hover:bg-gray-50/10 transition-colors">
                  <td className="px-8 py-6 text-xs font-bold text-gray-900/20 tabular-nums text-center uppercase">
                    {idx + 1 + (groups.meta.current_page - 1) * (groups.meta.per_page ?? 15)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight leading-none">
                        {group.name}
                      </span>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-widest tabular-nums">
                         CODE_ID: {group.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-600" />
                        <span className="text-xs font-bold text-gray-900 uppercase leading-none tracking-tight">
                          {group.location?.village_name || 'BELUM DIALOKASI'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-5">
                        SESI: {group.period?.name || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border shadow-sm',
                            group.status === 'active'
                              ? 'bg-[#e8f5ee] text-gray-700 border-gray-200'
                              : group.status === 'closed'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100',
                          )}
                        >
                          {group.status === 'draft'
                            ? 'PERSIAPAN'
                            : group.status === 'active'
                            ? 'LAPANGAN'
                            : 'ARSIP'}
                        </span>
                        {group.ready_for_placement && (
                           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="SIAP PENEMPATAN" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck size={12} className="text-emerald-400" />
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate max-w-[120px]">
                          {group.main_lecturer?.name || 'TANPA MENTOR'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2.5 w-32 mx-auto">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{group.approved_participants_count}</span>
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{group.capacity} PK</span>
                      </div>
                      <div className="h-1.5 bg-[#e8f5ee] rounded-full overflow-hidden border border-gray-200/50">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all duration-1000',
                            group.approved_participants_count / group.capacity >= 1
                              ? 'bg-emerald-400'
                              : 'bg-emerald-600',
                          )}
                          style={{
                            width: `${Math.min(
                              100,
                              (group.approved_participants_count / group.capacity) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/kelompok/${group.id}`}
                        className="h-10 px-6 bg-white border border-gray-200 text-gray-600 hover:text-gray-700 hover:border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center shadow-sm active:scale-95 group/btn"
                      >
                        Pemeriksaan
                        <ArrowUpRight
                          size={14}
                          className="ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                        />
                      </Link>
                      {canManage && (
                        <>
                          <button
                            onClick={() => onEdit(group)}
                            className="h-10 w-10 bg-white border border-gray-200 text-gray-600 hover:text-gray-700 hover:border-emerald-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(group.id)}
                            className="h-10 w-10 bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-6 border-t border-[#f3f4f6] bg-emerald-50/10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          HLMN {groups.meta.current_page} &middot; TOTAL {groups.meta.total} UNIT
        </span>
        <Pagination meta={groups.meta} />
      </div>
    </div>
  );
};

