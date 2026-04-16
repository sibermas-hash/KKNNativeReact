import { Lock, Activity } from 'lucide-react';
import type { PeriodOption } from '../types';

export const ManagedProgramCard = ({ program }: { program: PeriodOption }) => {
  return (
    <article className="p-10 rounded-[3.5rem] bg-white border border-emerald-100/60 hover:border-emerald-500 hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
      <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-600 text-white flex items-center justify-center rounded-bl-[2rem] shadow-xl group-hover:bg-emerald-700 transition-colors">
        <Lock size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <span className="inline-flex rounded-xl bg-emerald-50/60 px-4 py-1.5 text-sm font-bold font-semibold uppercase text-xs text-emerald-950">
          {program.program_subtype_label ||
            program.program_type_label ||
            program.jenis ||
            'Special Program'}
        </span>
        <span className="text-sm font-bold text-slate-300 font-semibold uppercase text-xs">
          CLOSE: {program.registration_end}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-black tracking-tighter uppercase mb-8 group-hover:text-emerald-700 transition-colors">
        {program.nama}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/60/50">
          <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mb-1">
            Registration
          </p>
          <p className="text-sm font-bold text-black uppercase tracking-tight">
            {program.registration_mode_label || 'Managed'}
          </p>
        </div>
        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/60/50">
          <p className="text-sm font-bold text-emerald-950 font-semibold uppercase text-xs mb-1">
            Placement
          </p>
          <p className="text-sm font-bold text-black uppercase tracking-tight">
            {program.placement_mode_label || 'Managed'}
          </p>
        </div>
      </div>

      {program.guide && (
        <div className="p-6 bg-emerald-50/20 rounded-xl border border-emerald-100 shadow-inner">
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider text-xs font-semibold mb-4 flex items-center gap-2">
            <Activity size={14} /> Critical Requirements
          </p>
          <ul className="space-y-3">
            {(program.guide.requirements || []).slice(0, 3).map((item) => (
              <li
                key={item}
                className="text-sm font-bold text-emerald-950 leading-relaxed uppercase tracking-tight flex gap-3"
              >
                <span className="text-emerald-400 mt-1">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};
