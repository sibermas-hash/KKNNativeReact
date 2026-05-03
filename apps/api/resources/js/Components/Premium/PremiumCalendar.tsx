import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { clsx } from 'clsx';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { id } from 'date-fns/locale';

type CalendarReportStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'revision'
  | 'pending'
  | 'rejected'
  | 'none';

interface CalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  reports: Array<{
    date: string;
    status: CalendarReportStatus;
  }>;
  onSelectDate: (date: Date) => void;
}

export default function PremiumCalendar({
  currentDate,
  onDateChange,
  reports,
  onSelectDate,
}: CalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Get report for a specific date
  const getReportForDate = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return reports.find((r) => r.date === dateStr);
  };

  const nextMonth = () => onDateChange(addMonths(currentDate, 1));
  const prevMonth = () => onDateChange(subMonths(currentDate, 1));

  const weekDays = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

  const normalizeStatus = (status: CalendarReportStatus | undefined): CalendarReportStatus => {
    if (!status) return 'none';

    return status === 'submitted'
      ? 'pending'
      : status === 'revision'
        ? 'rejected'
        : status;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-50">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tervalidasi
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-center text-xs font-black text-slate-300 uppercase tracking-widest mb-4"
          >
            {wd}
          </div>
        ))}

        {/* Placeholder for empty days at start of month */}
        {[...Array(getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1)].map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const report = getReportForDate(day);
          const isTodayDate = isToday(day);
          const normalizedStatus = normalizeStatus(report?.status);

          return (
            <motion.button
              key={day.toString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(day)}
              className={clsx(
                'relative group aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2',
                normalizedStatus === 'approved'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : normalizedStatus === 'pending'
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : normalizedStatus === 'rejected'
                      ? 'bg-rose-50 border-rose-100 text-rose-700'
                      : 'bg-[#F8FAF9] border-transparent text-slate-400 hover:bg-white hover:border-emerald-100 hover:shadow-sm',
              )}
            >
              <span className="text-sm font-black mb-1">{format(day, 'd')}</span>
              {report && (
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">
                  {normalizedStatus === 'approved'
                    ? 'Valid'
                    : normalizedStatus === 'pending'
                      ? 'Cek'
                      : 'Revisi'}
                </span>
              )}
              {isTodayDate && !report && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10 pt-8 border-t border-emerald-50 flex items-start gap-4">
        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
          <Info size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-950 uppercase tracking-tight mb-1">
            Panduan Pengisian
          </p>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
            Pastikan Anda mengisi logbook harian sebelum jam 23.59. Laporan yang sudah tervalidasi
            oleh DPL akan ditandai dengan kotak berwarna hijau pekat.
          </p>
        </div>
      </div>
    </div>
  );
}
