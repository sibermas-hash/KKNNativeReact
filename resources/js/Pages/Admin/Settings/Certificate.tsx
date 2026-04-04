import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';

interface ConfigItem {
 id: number;
 config_key: string;
 label: string;
 value: string | null;
 type: 'text' | 'longtext' | 'gambar';
}

interface Props {
 configs: ConfigItem[];
}

export default function CertificateSettings({ configs }: Props) {
 const form = useForm({
 configs: configs.map((config) => ({
 id: config.id,
 value: config.value ?? '',
 })),
 });

 const updateValue = (id: number, value: string) => {
 form.setData(
 'configs',
 form.data.configs.map((item) => (item.id === id ? { ...item, value } : item)),
 );
 };

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/admin/settings/certificate');
 };

 const getValue = (id: number) => form.data.configs.find((item) => item.id === id)?.value ?? '';

 return (
 <AppLayout title="Pengaturan Sertifikat">
 <Head title="Pengaturan Sertifikat" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Pengaturan Sertifikat</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Atur teks, aset, dan template yang dipakai saat sistem membuat sertifikat peserta KKN.
 </p>
 </section>

 <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
 <section className="space-y-6 lg:col-span-2">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Konten Sertifikat</h2>
 <p className="mt-1 text-sm text-slate-500">
 Gunakan tag seperti <code>[StudentName]</code>, <code>[NIM]</code>,{' '}
 <code>[LOKASI]</code>, dan <code>[PERIODE]</code> pada isi narasi.
 </p>

 <div className="mt-6 space-y-5">
 {configs
 .filter((config) => config.type !== 'gambar')
 .map((config) =>
 config.type === 'longtext' ? (
 <FormTextarea
 key={config.id}
 label={config.label}
 value={getValue(config.id)}
 onChange={(event) => updateValue(config.id, event.target.value)}
 error={form.errors[`configs.${form.data.configs.findIndex((item) => item.id === config.id)}.value`]}
 rows={8}
 />
 ) : (
 <FormInput
 key={config.id}
 label={config.label}
 value={getValue(config.id)}
 onChange={(event) => updateValue(config.id, event.target.value)}
 error={form.errors[`configs.${form.data.configs.findIndex((item) => item.id === config.id)}.value`]}
 />
 )
 )}
 </div>
 </div>
 </section>

 <section className="space-y-6">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Aset Visual</h2>
 <p className="mt-1 text-sm text-slate-500">
 Simpan URL gambar yang dipakai sebagai logo, tanda tangan, atau latar sertifikat.
 </p>

 <div className="mt-6 space-y-5">
 {configs
 .filter((config) => config.type === 'gambar')
 .map((config) => (
 <FormInput
 key={config.id}
 label={config.label}
 value={getValue(config.id)}
 onChange={(event) => updateValue(config.id, event.target.value)}
 error={form.errors[`configs.${form.data.configs.findIndex((item) => item.id === config.id)}.value`]}
 placeholder="https://..."
 />
 ))}
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Simpan Perubahan</h2>
 <p className="mt-1 text-sm text-slate-500">
 Perubahan ini langsung dipakai oleh proses pembuatan sertifikat berikutnya.
 </p>

 <button
 type="submit"
 disabled={form.processing}
 className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan konfigurasi'}
 </button>
 </div>
 </section>
 </form>
 </div>
 </AppLayout>
 );
}
