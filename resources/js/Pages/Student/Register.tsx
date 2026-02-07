import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { FormEventHandler } from 'react';
import type { PageProps } from '@/types';

interface PeriodOption {
  id: number;
  name: string;
  registration_start: string;
  registration_end: string;
}

interface RegisterProps extends PageProps {
  periods: PeriodOption[];
}

export default function Register({ periods }: RegisterProps) {
  const { data, setData, post, processing, errors } = useForm({
    period_id: '',
    notes: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/student/register');
  };

  return (
    <AppLayout title="Pendaftaran KKN">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Form Pendaftaran KKN</h2>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label htmlFor="period_id" className="block text-sm font-medium text-gray-700">
                Periode KKN
              </label>
              <select
                id="period_id"
                value={data.period_id}
                onChange={(e) => setData('period_id', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Pilih Periode</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.registration_start} -
                    {` ${period.registration_end}`})
                  </option>
                ))}
              </select>
              {errors.period_id && (
                <p className="mt-1 text-sm text-red-600">{errors.period_id}</p>
              )}
              {periods.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Belum ada periode aktif untuk pendaftaran.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Catatan
              </label>
              <textarea
                id="notes"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={processing || periods.length === 0}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {processing ? 'Menyimpan...' : 'Daftar'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
