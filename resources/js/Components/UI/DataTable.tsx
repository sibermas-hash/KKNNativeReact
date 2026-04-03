import type { ReactNode } from 'react';
import Pagination, { type PaginationMeta } from './Pagination';

interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => ReactNode;
    className?: string;
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
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold uppercase  text-slate-500 ${col.className ?? ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-6 text-center text-sm text-slate-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    className="transition hover:bg-slate-50/80"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-4 py-3 text-sm text-slate-700 ${col.className ?? ''}`}>
                                            {col.render
                                                ? col.render(item)
                                                : (item as Record<string, unknown>)[col.key] as ReactNode}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta && (
                <div className="border-t border-slate-200 px-4">
                    <Pagination meta={meta} />
                </div>
            )}
        </div>
    );
}
