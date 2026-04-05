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

function sanitizePaginationLabel(label: string): string {
 return label
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'");
}

export default function Pagination({ meta }: PaginationProps) {
 if (meta.last_page <= 1) return null;

 return (
 <div className="flex items-center justify-between border-t border-slate-200 px-1 py-3">
 <p className="text-sm text-slate-600">
 Menampilkan <span className="font-medium">{meta.from}</span>&ndash;
 <span className="font-medium">{meta.to}</span> dari{' '}
 <span className="font-medium">{meta.total}</span> data
 </p>

 <nav className="flex gap-1" role="navigation" aria-label="Pagination navigation">
 {meta.links.map((link, i) => {
 const isFirst = i === 0;
 const isLast = i === meta.links.length - 1;

 if (!link.url) {
 return (
 <span
 key={i}
 className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm text-slate-400"
 aria-hidden="true"
 >
 {isFirst ? '\u2039' : isLast ? '\u203A' : sanitizePaginationLabel(link.label)}
 </span>
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
 aria-label={
 isFirst
 ? 'Previous page'
 : isLast
 ? 'Next page'
 : `Page ${sanitizePaginationLabel(link.label)}`
 }
 aria-current={link.active ? 'page' : undefined}
 >
 {isFirst ? (
 <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
 ) : isLast ? (
 <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
 ) : (
 sanitizePaginationLabel(link.label)
 )}
 </Link>
 );
 })}
 </nav>
 </div>
 );
}
