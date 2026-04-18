import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface PaginationMeta {
    current_page: number;
    from?: number | null;
    last_page?: number;
    links?: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    path?: string;
    per_page?: number;
    to?: number | null;
    total: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
}

interface PaginationProps {
    meta: PaginationMeta;
}

export default function Pagination({ meta }: PaginationProps) {
    if (!meta.last_page || meta.last_page <= 1 || !meta.links) return null;

    const getButtonClass = (active: boolean, disabled: boolean) => {
        return clsx(
            'inline-flex items-center justify-center h-9 px-3 text-xs font-medium transition-all border rounded-lg',
            active
                ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                : 'bg-white border-emerald-50/60 text-emerald-800 hover:bg-primary-50 hover:border-primary-300',
            disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
        );
    };

    return (
        <nav className="flex items-center gap-1">
            <Link
                href={meta.prev_page_url || '#'}
                className={getButtonClass(false, !meta.prev_page_url)}
                preserveScroll
            >
                <ChevronLeft size={14} strokeWidth={3} />
            </Link>

            <div className="flex items-center gap-1">
                {meta.links.filter(link => !link.label.includes('Previous') && !link.label.includes('Next')).map((link: { url: string | null; label: string; active: boolean }, idx: number) => {
                    // SECURITY: Parse HTML entities safely instead of using dangerouslySetInnerHTML
                    const parseHtmlEntity = (str: string): string => {
                        const textarea = document.createElement('textarea');
                        textarea.innerHTML = str;
                        return textarea.value;
                    };

                    const safeLabel = parseHtmlEntity(link.label);

                    return (
                        <Link
                            key={idx}
                            href={link.url || '#'}
                            className={getButtonClass(link.active, !link.url)}
                            preserveScroll
                            aria-label={`Halaman ${safeLabel}`}
                        >
                            {safeLabel}
                        </Link>
                    );
                })}
            </div>

            <Link
                href={meta.next_page_url || '#'}
                className={getButtonClass(false, !meta.next_page_url)}
                preserveScroll
            >
                <ChevronRight size={14} strokeWidth={3} />
            </Link>
        </nav>
    );
}

export function PageInfo({ meta }: { meta: PaginationMeta }) {
    return (
        <div className="text-xs font-medium text-emerald-950">
            Menampilkan {meta.from || 0} - {meta.to || 0} dari {meta.total} data
        </div>
    );
}
