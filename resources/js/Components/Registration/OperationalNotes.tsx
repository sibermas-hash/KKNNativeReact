import React from 'react';

interface OperationalNotesProps {
  notes: string;
  setNotes: (value: string) => void;
}

export const OperationalNotes: React.FC<OperationalNotesProps> = ({ notes, setNotes }) => {
  return (
    <div className="pt-6">
      <label 
        htmlFor="registration-notes"
        className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block opacity-70 cursor-pointer"
      >
        Operational Notes (Optional)
      </label>
      <textarea
        id="registration-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none text-[13px] font-bold text-gray-700 placeholder:text-slate-300 uppercase tracking-tight"
        placeholder="Tuliskan catatan khusus pendaftaran jika diperlukan..."
      />
    </div>
  );
};
