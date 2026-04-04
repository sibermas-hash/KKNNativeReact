import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export interface PaginationMeta {
 current_page: number;
 last_page: number;
 per_page: number;
 total: number;
 from: number | null;
 to: number | null;
 links: { url: string | null; label: string; active: boolean }[];
}

interface PaginationProps {
 meta: PaginationMeta;
}

export default function Pagination({ meta }: PaginationProps) {
 if (meta.last_page <= 1) return null;

 return (
 <div className="flex items-center justify-between border-t border-slate-200 px-1 py-3">
 <p className="text-sm text-slate-600">
 Menampilkan <span className="font-medium">{meta.from}</span>–
 <span className="font-medium">{meta.to}</span> dari{' '}
 <span className="font-medium">{meta.total}</span> data
 </p>

 <nav className="flex gap-1">
 {meta.links.map((link, i) => {
 const isFirst = i === 0;
 const isLast = i === meta.links.length - 1;
 const label = isFirst ? '' : isLast ? '' : link.label;

 if (!link.url) {
 return (
 <span
 key={i}
 className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm text-slate-400"
 dangerouslySetInnerHTML={{ __html: isFirst ? '‹' : isLast ? '›' : label }}
 />
 );
 }

 return (
 <Link
 key={i}
 href={link.url}
 preserveScroll
 className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition ${link.active
 ? 'bg-primary text-white'
 : 'text-slate-700 hover:bg-slate-100'
 }`}
 >
 {isFirst ? (
 <ChevronLeftIcon className="h-4 w-4" />
 ) : isLast ? (
 <ChevronRightIcon className="h-4 w-4" />
 ) : (
 <span dangerouslySetInnerHTML={{ __html: label }} />
 )}
 </Link>
 );
 })}
 </nav>
 </div>
 );
}
