import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { CalendarDaysIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { PageProps } from '@/types';

interface Period {
 id: number;
 angkatan: number;
 jenis: string;
 name: string;
 academic_year: string | null;
 is_active: boolean;
}

interface PeriodSelectorProps {
 className?: string;
}

type PeriodPageProps = PageProps<{
 activePeriod: Period | null;
 availablePeriods: Record<number, Period[]>;
}>;

export default function PeriodSelector({ className = '' }: PeriodSelectorProps) {
 const { activePeriod, availablePeriods } = usePage<PeriodPageProps>().props;
 const [open, setOpen] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleOutsideClick = (event: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };

 document.addEventListener('mousedown', handleOutsideClick);
 return () => document.removeEventListener('mousedown', handleOutsideClick);
 }, []);

 if (!activePeriod && Object.keys(availablePeriods ?? {}).length === 0) {
 return null;
 }

 const changePeriod = (periodId: number) => {
 setOpen(false);
 router.get(
 window.location.pathname,
 { period_id: periodId },
 { preserveState: true, preserveScroll: true, replace: true },
 );
 };

 return (
 <div ref={containerRef} className={`relative ${className}`}>
 <button
 type="button"
 onClick={() => setOpen((current) => !current)}
 className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-left shadow-sm hover:border-primary"
 >
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
 <CalendarDaysIcon className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
 Periode aktif
 </span>
 <span className="block truncate text-sm font-semibold text-slate-900">
 {activePeriod ? `${activePeriod.angkatan} - ${activePeriod.jenis}` : 'Pilih periode'}
 </span>
 </div>
 <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
 </button>

 {open && (
 <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
 <div className="border-b border-slate-200 px-5 py-4">
 <h3 className="text-sm font-semibold text-slate-900">Pilih Periode KKN</h3>
 <p className="mt-1 text-xs text-slate-500">Periode yang dipilih akan dipakai sebagai konteks halaman.</p>
 </div>

 <div className="max-h-96 overflow-y-auto">
 {Object.entries(availablePeriods)
 .sort(([left], [right]) => Number(right) - Number(left))
 .map(([angkatan, periods]) => (
 <div key={angkatan} className="border-b border-slate-100 last:border-b-0">
 <div className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
 Angkatan {angkatan}
 </div>
 <div className="space-y-1 p-2">
 {periods.map((period) => {
 const selected = activePeriod?.id === period.id;
 return (
 <button
 key={period.id}
 type="button"
 onClick={() => changePeriod(period.id)}
 className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left ${
 selected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50'
 }`}
 >
 <div>
 <p className="text-sm font-semibold">{period.jenis}</p>
 <p className="mt-1 text-xs text-slate-500">{period.name}</p>
 </div>
 {selected && (
 <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
 <CheckIcon className="h-4 w-4" />
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
