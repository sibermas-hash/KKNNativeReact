import type { ReactNode } from 'react';
import Pagination, { type PaginationMeta } from './Pagination';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T extends { id: number | string }> {
  columns: Column<T>[];
  data: T[];
  meta?: PaginationMeta;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  meta,
  emptyMessage = 'Tidak ada data.',
}: DataTableProps<T>) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <div className="overflow-hidden rounded-lg border border-emerald-50/60 bg-white">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-emerald-100/60">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-emerald-950 uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100/60">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-emerald-950"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-emerald-800 ${col.className ?? ''}`}
                    >
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-emerald-950">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-emerald-100/60">
            {data.map((item) => (
              <div key={item.id} className="px-4 py-4 space-y-3">
                {visibleColumns.map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wider flex-shrink-0">
                      {col.label}
                    </span>
                    <span className="text-sm text-emerald-800 text-right flex-1">
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as ReactNode)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {meta && (
        <div className="border-t border-emerald-50/60 px-4 py-3">
          <Pagination meta={meta} />
        </div>
      )}
    </div>
  );
}
