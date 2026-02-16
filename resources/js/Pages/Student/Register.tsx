import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormEventHandler } from 'react';
import { PageProps } from '@/types';

interface Group {
  id: number;
  nama_kelompok: string;
  capacity: number;
  peserta_count: number;
  lokasi?: {
    village_name: string;
  };
}

interface PeriodOption {
  id: number;
  nama: string;
  registration_start: string;
  registration_end: string;
  kelompok: Group[];
}

interface RegisterProps extends PageProps {
  periods: PeriodOption[];
}

export default function Register({ periods }: RegisterProps) {
  const { data, setData, post, processing, errors } = useForm({
    period_id: '',
    kelompok_id: '',
    notes: '',
  });

  const selectedPeriod = periods.find(p => p.id === Number(data.period_id));

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/student/register');
  };

  return (
    <AppLayout title="Pendaftaran KKN">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-primary to-indigo-600 p-10 text-white">
            <h2 className="text-3xl font-black tracking-tight mb-2">Form Pendaftaran KKN</h2>
            <p className="text-primary-foreground/80 font-medium">Lengkapi data pendaftaran dan pilih lokasi tujuan Anda.</p>
          </div>

          <form onSubmit={submit} className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Period Selection */}
              <div className="space-y-3">
                <label htmlFor="period_id" className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">
                  Periode KKN
                </label>
                <select
                  id="period_id"
                  value={data.period_id}
                  onChange={(e) => {
                    setData(data => ({ ...data, period_id: e.target.value, kelompok_id: '' }));
                  }}
                  className="block w-full rounded-2xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary transition-all duration-300 py-4 px-6 text-slate-700 font-bold"
                >
                  <option value="">Pilih Periode...</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.nama}
                    </option>
                  ))}
                </select>
                {errors.period_id && (
                  <p className="text-xs text-red-500 font-bold pl-1">{errors.period_id}</p>
                )}
              </div>

              {/* Status Helper */}
              <div className="bg-slate-50 rounded-3xl p-6 flex items-center gap-4 border border-slate-100">
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Status Pendaftaran</p>
                  <p className="text-sm font-bold text-slate-600">
                    {periods.length > 0 ? 'Pendaftaran Dibuka' : 'Belum Tersedia'}
                  </p>
                </div>
              </div>
            </div>

            {/* Group / Location Selection */}
            {selectedPeriod && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between pl-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Pilih Kelompok & Lokasi
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Real-time Quota
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedPeriod.kelompok.map((group) => {
                    const isFull = group.peserta_count >= group.capacity;
                    const isSelected = data.kelompok_id === String(group.id);

                    return (
                      <div
                        key={group.id}
                        onClick={() => !isFull && setData('kelompok_id', String(group.id))}
                        className={`
                                                    relative group cursor-pointer rounded-3xl p-6 border-2 transition-all duration-300
                                                    ${isSelected ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200 bg-white'}
                                                    ${isFull ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg'}
                                                `}
                      >
                        <div className="flex flex-col h-full space-y-4">
                          <div>
                            <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                              {group.nama_kelompok}
                            </h4>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {group.lokasi?.village_name || 'Lokasi menyusul'}
                            </p>
                          </div>

                          <div className="mt-auto">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                              <span className={isFull ? 'text-red-500' : 'text-slate-400'}>Kuota</span>
                              <span className={isFull ? 'text-red-500' : 'text-primary'}>
                                {group.peserta_count} / {group.capacity}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${(group.peserta_count / group.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.kelompok_id && (
                  <p className="text-xs text-red-500 font-bold pl-1">{errors.kelompok_id}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label htmlFor="notes" className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="notes"
                placeholder="Tuliskan riwayat kesehatan, keahlian khusus, atau informasi penting lainnya..."
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                rows={4}
                className="block w-full rounded-[2rem] border-slate-200 shadow-sm focus:border-primary focus:ring-primary transition-all duration-300 p-8 text-slate-700 font-medium"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={processing || periods.length === 0 || !data.period_id}
                className={`
                                    w-full py-6 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-300
                                    ${processing || periods.length === 0 || !data.period_id
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:scale-[1.02] hover:shadow-primary/20 active:scale-95'}
                                `}
              >
                {processing ? 'Memproses Pendaftaran...' : 'Kirim Pendaftaran Sekarang'}
              </button>
              <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                Pastikan data yang anda masukkan sudah benar sebelum mengirim.
              </p>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
