import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { CalendarDaysIcon, ChevronDownIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePeriodChange = (periodId: number) => {
        setIsOpen(false);
        router.get(
            window.location.pathname,
            { period_id: periodId },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    if (!activePeriod && (!availablePeriods || Object.keys(availablePeriods).length === 0)) {
        return null;
    }

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-3 px-5 py-2.5 rounded-lg transition-all
                           bg-white border border-slate-200 hover:border-primary/30 hover:shadow-md active:scale-95"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <CalendarDaysIcon className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-[9px] text-slate-400 font-black  uppercase leading-tight">
                        Periode KKN
                    </span>
                    <span className="font-bold text-sm text-slate-900 truncate max-w-[140px]">
                        {activePeriod
                            ? `KKN ${activePeriod.angkatan ?? ''} • ${activePeriod.jenis ?? ''}`
                            : 'Pilih Periode'}
                    </span>
                </div>
                <ChevronDownIcon
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-3 right-0 w-80 bg-white rounded-lg
                                border border-slate-100 overflow-hidden z-50
                                zoom-in-95
                    <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase 
                            Pilih Angkatan KKN
                        </p>
                        <SparklesIcon className="w-4 h-4 text-primary opacity-50" />
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {Object.entries(availablePeriods)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([angkatan, periods]) => (
                                <div key={angkatan} className="mb-2">
                                    <div className="px-6 py-2.5 bg-white text-[10px] font-black text-primary/60 uppercase  sticky top-0 z-10 border-b border-slate-50">
                                        Angkatan {angkatan}
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {periods.map((period) => {
                                            const isSelected = activePeriod?.id === period.id;
                                            return (
                                                <button
                                                    key={period.id}
                                                    onClick={() => handlePeriodChange(period.id)}
                                                    className={`w-full px-4 py-3.5 flex items-center gap-4 rounded-lg
                                                           transition-all group/item
                                                           ${isSelected ? 'bg-primary/5 border border-primary/10' : 'hover:bg-slate-50 border border-transparent'}`}
                                                >
                                                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${isSelected
                                                        ? 'bg-primary text-white scale-110
                                                        : 'bg-white text-slate-400 border border-slate-100 group-hover/item:border-primary/20 group-hover/item:text-primary group-hover/item:scale-105'
                                                        }`}>
                                                        <CalendarDaysIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-primary' : 'text-slate-900 group-hover/item:text-primary'}`}>
                                                            {period.jenis}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5  group-hover/item:text-slate-500">
                                                            {period.name}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                                                            <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 italic text-[9px] text-slate-400 text-center font-bold uppercase 
                        Data sinkron dengan Database Pusat
                    </div>
                </div>
            )}
        </div>
    );
}
