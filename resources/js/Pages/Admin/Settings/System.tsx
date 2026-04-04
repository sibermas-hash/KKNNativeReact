import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput } from '@/Components/ui';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

interface Setting {
 id: number;
 config_key: string;
 label: string;
 value: string | null;
 type: string;
 group: string;
}

interface Props {
 settings: Record<string, Setting[]>;
 title: string;
}

const GROUP_TITLES: Record<string, string> = {
 master_api: 'Integrasi Master Kampus',
 general: 'Pengaturan Umum',
 ai_settings: 'Layanan AI',
 storage_settings: 'Penyimpanan Berkas',
 registration_rules: 'Aturan Operasional Mahasiswa',
 content_settings: 'Konten Publik',
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
 master_api: 'Kelola koneksi dan kredensial ke sumber data kampus.',
 general: 'Atur parameter umum yang memengaruhi perilaku sistem secara global.',
 ai_settings: 'Aktifkan atau nonaktifkan fitur berbasis AI dan kredensial pendukungnya.',
 storage_settings: 'Atur lokasi penyimpanan berkas lokal maupun cloud.',
 registration_rules: 'Atur aturan pendaftaran, perpindahan kelompok, serta validasi GPS laporan harian.',
 content_settings: 'Kelola teks konten publik yang tampil di halaman depan dan profil.',
};

const SETTING_HELPERS: Record<string, string> = {
 daily_report_geo_radius_meters:
  'Mahasiswa hanya dapat mengirim laporan jika titik GPS masih berada dalam radius ini dari posko atau lokasi KKN.',
 daily_report_geo_max_accuracy_meters:
  'Semakin kecil nilainya, semakin ketat sistem menerima GPS. Nilai terlalu besar akan membuat lokasi yang tidak presisi tetap lolos.',
 registration_lock_ttl_seconds:
  'Menentukan berapa lama lock pendaftaran kelompok dipertahankan saat rebutan slot berlangsung.',
 registration_lock_wait_seconds:
  'Menentukan berapa lama mahasiswa menunggu lock rebutan kelompok sebelum sistem memberi respons gagal.',
};

export default function SystemSettings({ settings }: Props) {
 const form = useForm({
 settings: Object.values(settings)
 .flat()
 .map((setting) => ({
 id: setting.id,
 value: setting.value ?? '',
 })),
 });

 const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

 const flattened = useMemo(() => Object.values(settings).flat(), [settings]);

 const updateValue = (id: number, value: string) => {
 form.setData(
 'settings',
 form.data.settings.map((item) => (item.id === id ? { ...item, value } : item)),
 );
 };

 const getValue = (id: number) => form.data.settings.find((item) => item.id === id)?.value ?? '';

 const getError = (id: number) => {
 const index = form.data.settings.findIndex((item) => item.id === id);
 return index >= 0 ? form.errors[`settings.${index}.value`] : undefined;
 };

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post(route('admin.settings.system.update'));
 };

 return (
 <AppLayout title="Pengaturan Sistem">
 <Head title="Pengaturan Sistem" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Pengaturan Sistem</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Kelola parameter integrasi, API, dan pengaturan operasional utama yang dipakai oleh
 sistem KKN.
 </p>
 </section>

 <form onSubmit={handleSubmit} className="space-y-6">
 {Object.entries(settings).map(([group, items]) => (
 <section key={group} className="rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">{GROUP_TITLES[group] ?? group.replace(/_/g, ' ')}</h2>
 <p className="mt-1 text-sm text-slate-500">
 {GROUP_DESCRIPTIONS[group] ?? `${items.length} pengaturan pada kelompok ini.`}
 </p>
 </div>

 <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
 {items.map((setting) => {
 const isSecret = setting.type === 'password';
 const isLongText = setting.type === 'textarea';

 return (
 <div key={setting.id} className="space-y-2">
 {isLongText ? (
 <div>
 <label
 htmlFor={`setting-${setting.id}`}
 className="mb-1.5 block text-sm font-medium text-slate-700"
 >
 {setting.label}
 </label>
 <textarea
 id={`setting-${setting.id}`}
 rows={5}
 value={getValue(setting.id)}
 onChange={(event) => updateValue(setting.id, event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 />
 {getError(setting.id) && (
 <p className="mt-1 text-xs text-red-600">{getError(setting.id)}</p>
 )}
 </div>
 ) : (
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-3">
 <label
 htmlFor={`setting-${setting.id}`}
 className="block text-sm font-medium text-slate-700"
 >
 {setting.label}
 </label>
 <span className="text-xs text-slate-400">{setting.config_key}</span>
 </div>
 <div className="flex gap-2">
 <FormInput
 id={`setting-${setting.id}`}
 type={isSecret && !visiblePasswords[setting.id] ? 'password' : 'text'}
 value={getValue(setting.id)}
 onChange={(event) => updateValue(setting.id, event.target.value)}
 error={getError(setting.id)}
 className="flex-1"
 />
 {isSecret && (
 <button
 type="button"
 onClick={() =>
 setVisiblePasswords((current) => ({
 ...current,
 [setting.id]: !current[setting.id],
 }))
 }
 className="rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary"
 >
 {visiblePasswords[setting.id] ? 'Sembunyikan' : 'Tampilkan'}
 </button>
 )}
 </div>
 {SETTING_HELPERS[setting.config_key] ? (
 <p className="text-xs leading-5 text-slate-500">{SETTING_HELPERS[setting.config_key]}</p>
 ) : null}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </section>
 ))}

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">Simpan Perubahan</h2>
 <p className="mt-1 text-sm text-slate-500">
 Total pengaturan yang dikelola saat ini: {flattened.length}.
 </p>
 </div>

 <button
 type="submit"
 disabled={form.processing}
 className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan pengaturan'}
 </button>
 </div>
 </section>
 </form>
 </div>
 </AppLayout>
 );
}
