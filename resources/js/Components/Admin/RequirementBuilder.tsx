import React from 'react';

interface Rule {
  name: string;
  type: 'upload' | 'db_check';
  field?: string;
  min_value?: any;
  expected_value?: any;
}

export default function RequirementBuilder({ form }: { form: any }) {
  const rules: Rule[] = form.data.requirements_config || [];

  const setRules = (next: Rule[]) => {
    form.setData('requirements_config', next);
  };

  const addRule = () => {
    const next = [...rules, { name: '', type: 'upload' }];
    setRules(next);
  };

  const updateRule = (index: number, patch: Partial<Rule>) => {
    const next = rules.map((r: Rule, i: number) => (i === index ? { ...r, ...patch } : r));
    setRules(next);
  };

  const removeRule = (index: number) => {
    const next = rules.filter((_, i) => i !== index);
    setRules(next);
  };

  return (
    <div className="space-y-2 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
          Konfigurasi Persyaratan Dinamis
        </label>
        <button
          type="button"
          onClick={addRule}
          className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 uppercase tracking-tight"
        >
          + Tambah Syarat
        </button>
      </div>

      <div className="space-y-2">
        {rules.length === 0 && (
          <p className="text-[10px] text-slate-400 italic text-center py-2 bg-white/50 rounded-xl border border-dashed border-slate-200">
            Belum ada konfigurasi persyaratan.
          </p>
        )}

        {rules.map((r: Rule, idx: number) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="Nama syarat (contoh: min_sks / paspor)"
              value={r.name}
              onChange={(e) => updateRule(idx, { name: e.target.value })}
              className="col-span-3 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700"
            />

            <select
              value={r.type}
              onChange={(e) => updateRule(idx, { type: e.target.value as 'upload' | 'db_check' })}
              className="col-span-2 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700"
            >
              <option value="upload">Upload (dokumen)</option>
              <option value="db_check">Cek database</option>
            </select>

            <input
              type="text"
              placeholder="Field (untuk db_check, contoh: total_sks)"
              value={r.field || ''}
              onChange={(e) => updateRule(idx, { field: e.target.value })}
              className="col-span-3 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700"
            />

            <input
              type="text"
              placeholder="Expected / min value"
              value={(r.expected_value ?? r.min_value ?? '') as any}
              onChange={(e) => updateRule(idx, { expected_value: e.target.value })}
              className="col-span-3 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-700"
            />

            <button
              type="button"
              onClick={() => removeRule(idx)}
              className="col-span-1 h-10 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg"
              aria-label={`Hapus syarat ${idx}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 italic pl-1">
        Catatan: Untuk aturan bertipe "Cek database", isikan field yang sesuai pada model PesertaKkn/Mahasiswa.
      </p>
    </div>
  );
}
