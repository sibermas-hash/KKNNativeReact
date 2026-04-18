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
        className="text-xs font-bold text-emerald-950 uppercase tracking-[0.3em] mb-4 block opacity-70 cursor-pointer"
      >
        Operational Notes (Optional)
      </label>
      <textarea
        id="registration-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full px-8 py-6 rounded-[2rem] border-2 border-[#f3f4f6] bg-gray-50/50 focus:bg-white focus:border-[#f3f4f6]0 focus:ring-8 focus:ring-[#1a7a4a]/5 transition-all outline-none text-sm font-bold text-emerald-800 placeholder:text-black uppercase tracking-tight"
        placeholder="Tuliskan catatan khusus pendaftaran jika diperlukan..."
      />
    </div>
  );
};
