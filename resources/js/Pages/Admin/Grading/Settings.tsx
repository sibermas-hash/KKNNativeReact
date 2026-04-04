import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';

interface ConfigItem {
 id: number;
 config_key: string;
 label: string;
 percentage: number;
 description?: string | null;
}

interface ConfigSection {
 group: string;
 title: string;
 description: string;
 enforce_total: boolean;
 total: number;
 items: ConfigItem[];
}

interface Props {
 sections: ConfigSection[];
}

export default function GradingSettings({ sections }: Props) {
 const form = useForm({
 configs: sections.flatMap((section) =>
 section.items.map((item) => ({
 id: item.id,
 percentage: item.percentage,
 })),
 ),
 });

 const valueFor = (id: number) => form.data.configs.find((item) => item.id === id)?.percentage ?? 0;

 const updateValue = (id: number, percentage: number) => {
 form.setData(
 'configs',
 form.data.configs.map((item) => (item.id === id ? { ...item, percentage } : item)),
 );
 };

 const totalForSection = (section: ConfigSection) =>
 section.items.reduce((sum, item) => sum + Number(valueFor(item.id)), 0);

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();

 const invalidSection = sections.find((section) => section.enforce_total && totalForSection(section) !== 100);
 if (invalidSection) {
 window.alert(`Total bobot untuk ${invalidSection.title} harus tepat 100%.`);
 return;
 }

 form.post(route('admin.grading-settings.update'));
 };

 return (
 <AppLayout title="Pengaturan Penilaian">
 <Head title="Pengaturan Penilaian" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Pengaturan Penilaian</h1>
 <p className="mt-2 max-w-3xl text-sm text-slate-500">
 Atur bobot setiap komponen penilaian yang dipakai oleh sistem KKN. Untuk kelompok yang
 wajib berjumlah 100%, sistem akan menolak penyimpanan jika totalnya belum tepat.
 </p>
 </section>

 <form onSubmit={handleSubmit} className="space-y-6">
 {sections.map((section) => {
 const total = totalForSection(section);
 const valid = !section.enforce_total || total === 100;

 return (
 <section key={section.group} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
 <p className="mt-1 text-sm text-slate-500">{section.description}</p>
 </div>

 <div className={valid ? 'rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700' : 'rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700'}>
 Total: {total}%
 </div>
 </div>

 <div className="mt-6 grid gap-6 md:grid-cols-2">
 {section.items.map((item) => {
 const configIndex = form.data.configs.findIndex((config) => config.id === item.id);
 const error = form.errors[`configs.${configIndex}.percentage`];

 return (
 <div key={item.id} className="rounded-lg border border-slate-200 p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
 {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
 <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{item.config_key}</p>
 </div>
 </div>

 <div className="mt-4">
 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
 Persentase
 </label>
 <div className="relative">
 <input
 type="number"
 min="0"
 max="100"
 step="0.01"
 value={valueFor(item.id)}
 onChange={(event) => updateValue(item.id, Number(event.target.value))}
 className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-10 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
 />
 <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
 </div>
 {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
 </div>
 </div>
 );
 })}
 </div>
 </section>
 );
 })}

 <div className="flex justify-end">
 <button
 type="submit"
 disabled={form.processing}
 className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}
 </button>
 </div>
 </form>
 </div>
 </AppLayout>
 );
}
