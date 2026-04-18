import { Head, useForm, usePage, router } from '@inertia/react';
import { type FormEventHandler } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
import { KeyRound, Lock, ChevronRight, AlertCircle } from 'lucide-react';

interface UserData {
  id: number; name: string; email: string; username: string;
  must_change_password: boolean;
}

interface Props extends PageProps { user: UserData; mustChangePassword: boolean }

export default function PasswordChange() {
  const { user } = usePage<Props>().props;

  const passwordForm = useForm({
    password: '',
    password_confirmation: '',
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    
    if (passwordForm.data.password.length < 8) {
      passwordForm.setError('password', 'Kata sandi minimal 8 karakter');
      return;
    }

    if (passwordForm.data.password !== passwordForm.data.password_confirmation) {
      passwordForm.setError('password_confirmation', 'Konfirmasi kata sandi tidak cocok');
      return;
    }

    passwordForm.post(route('profile.password'), {
      onSuccess: () => {
        router.get(route('profile.show'));
      },
    });
  };

  return (
    <AppLayout title="Ganti Kata Sandi">
      <Head title="Ganti Kata Sandi" />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-emerald-600 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <KeyRound size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Ganti Kata Sandi</h1>
                <p className="text-emerald-100 text-sm">Kata sandi default wajib diganti</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-rose-900">Akses Diblokir</p>
                  <p className="text-sm text-rose-700">
                    Anda wajib mengganti kata sandi default sebelum dapat mengakses portal SIM-KKN.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-emerald-800">Kata Sandi Baru</label>
                <div className="relative">
                  <FormInput
                    type="password"
                    value={passwordForm.data.password}
                    onChange={e => passwordForm.setData('password', e.target.value)}
                    error={passwordForm.errors.password}
                    placeholder="Minimal 8 karakter"
                    className="h-11 pl-10"
                    autoFocus
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-emerald-800">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <FormInput
                    type="password"
                    value={passwordForm.data.password_confirmation}
                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                    error={passwordForm.errors.password_confirmation}
                    placeholder="Ulangi kata sandi baru"
                    className="h-11 pl-10"
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordForm.processing}
                  className="w-full h-11 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordForm.processing ? 'Memproses...' : 'Simpan & Lanjutkan'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-emerald-600 mt-4">
            Setelah mengganti kata sandi, Anda akan diarahkan ke halaman profil untuk melengkapi data.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}