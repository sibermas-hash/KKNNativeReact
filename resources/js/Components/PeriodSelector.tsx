import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { CalendarDaysIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

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

export default function PeriodSelector({ className = '' }: PeriodSelectorProps) {
    const { activePeriod, availablePeriods } = usePage().props as {
        activePeriod: Period | null;
        availablePeriods: Record<number, Period[]>;
    };
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
                className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600
                           text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
                           hover:from-indigo-700 hover:to-purple-700"
            >
                <CalendarDaysIcon className="w-5 h-5 opacity-80" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] opacity-70 font-medium tracking-wider uppercase">
                        Periode Aktif
                    </span>
                    <span className="font-bold text-sm">
                        {activePeriod
                            ? `KKN ${activePeriod.angkatan ?? ''} • ${activePeriod.jenis ?? ''}`
                            : 'Pilih Periode'}
                    </span>
                </div>
                <ChevronDownIcon
                    className={`w-4 h-4 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl
                                border border-gray-100 overflow-hidden z-50
                                animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Pilih Periode KKN
                        </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {Object.entries(availablePeriods)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([angkatan, periods]) => (
                                <div key={angkatan} className="border-b border-gray-50 last:border-b-0">
                                    <div className="px-4 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Angkatan {angkatan}
                                    </div>
                                    {periods.map((period) => {
                                        const isSelected = activePeriod?.id === period.id;
                                        return (
                                            <button
                                                key={period.id}
                                                onClick={() => handlePeriodChange(period.id)}
                                                className={`w-full px-4 py-3 flex items-center gap-3
                                                       hover:bg-indigo-50 transition-colors text-left
                                                       ${isSelected ? 'bg-indigo-50' : ''}`}
                                            >
                                                <div className={`p-2 rounded-lg ${isSelected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <CalendarDaysIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">
                                                        {period.jenis}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {period.name}
                                                        {period.academic_year && ` • ${period.academic_year}`}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <CheckIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                                )}
                                                {period.is_active && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
                                                               bg-green-100 text-green-700 rounded-full flex-shrink-0">
                                                        Aktif
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
