import { useForm, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import {
 Settings,
 Key,
 Globe,
 ShieldCheck,
 Info,
 RefreshCw,
 Eye,
 EyeOff,
 Server,
 Wrench,
 Save,
} from 'lucide-react';
import { useState } from 'react';

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

export default function SystemSettings({ settings }: Props) {
 const { data, setData, post, processing, errors } = useForm({
 settings: Object.values(settings).flat().map(s => ({
 id: s.id,
 value: s.value || ''
 }))
 });

 const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

 const submit = (e: React.FormEvent) => {
 e.preventDefault();
 post(route('admin.settings.system.update'));
 };

 const updateValue = (id: number, value: string) => {
 const newSettings = data.settings.map(s =>
 s.id === id ? { ...s, value } : s
 );
 setData('settings', newSettings);
 };

 const togglePassword = (id: number) => {
 setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
 };

 const getIcon = (key: string) => {
 if (key.includes('url')) return <Globe className="w-4 h-4" />;
 if (key.includes('id')) return <Info className="w-4 h-4" />;
 if (key.includes('secret') || key.includes('token')) return <Key className="w-4 h-4 text-primary" />;
 return <Settings className="w-4 h-4" />;
 };

 return (
 <AppLayout title="Pengaturan Sistem Global">
 <Head title="Pengaturan Sistem" />
 
 <div className="max-w-5xl mx-auto space-y-6 pb-24">
 {/* 
 Emerald Premium Header 
 Refining from basic header to lush tactical emerald gradient
 */}
 <div className="relative overflow-hidden rounded-lg bg-white p-6 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
 <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
 
 <div className="relative z-10 space-y-5 flex-1">
 <div className="flex items-center gap-3 mb-2">
 <div className="p-2.5 bg-white/10 rounded-lg border border-slate-200
 <Settings className="h-4 w-4 text-emerald-300" />
 </div>
 <span className="text-xs font-semibold text-emerald-100 ">
 3
 </span>
 </div>
 <h1 className="text-4xl md:text-5xl font-semibold text-white ">
 Arsitektur <span className="text-emerald-300">Sistem</span>
 </h1>
 <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
 Konfigurasi parameter operasional utama, orkestrasi kredensial API, dan manajemen integritas infrastruktur digital fungsional KKN UIN SAIZU.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
 <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stattransition-transform">
 <div className="p-3 bg-white rounded-lg text-primary ">
 <Server className="h-6 w-6" />
 </div>
 <div>
 <span className="text-xs font-semibold text-emerald-200/60 block mb-1.5">Status Gateway</span>
 <span className="text-xl font-semibold text-white ">Cluster_Aktif</span>
 </div>
 </div>
 </div>
 </div>

 <form onSubmit={submit} className="space-y-8">
 {Object.entries(settings).map(([group, items]) => (
 <div key={group} className="bg-white rounded-lg border border-slate-100 overflow-hidden group/card">
 <div className="px-6 py-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-2.5 bg-white rounded-lg text-slate-400 border border-slate-200 group-hover/card:text-primary
 <Wrench className="w-5 h-5" />
 </div>
 <h2 className="text-sm font-semibold text-slate-900 ">
 Modul {group.replace('_', ' ')}
 </h2>
 </div>
 <div className="h-2 w-2 rounded-lg bg-slate-200 group-hover/card:bg-primary transition-colors" />
 </div>

 <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
 {items.map((setting) => {
 const formItem = data.settings.find(s => s.id === setting.id);

 return (
 <div key={setting.id} className="space-y-4 group/item">
 <div className="flex items-center justify-between px-1">
 <label className="flex items-center gap-2.5 text-xs text-sm text-slate-400 group-hover/item:text-primary transition-colors">
 {getIcon(setting.config_key)}
 {setting.label}
 </label>
 <span className="text-xs text-sm text-slate-300 opacity-50 {setting.config_key}</span>
 </div>

 <div className="relative group/input">
 <input
 type={setting.type === 'password' && !showPassword[setting.id] ? 'password' : 'text'}
 value={formItem?.value || ''}
 onChange={(e) => updateValue(setting.id, e.target.value)}
 className="w-full h-14 pl-6 pr-12 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5text-xs text-sm text-slate-800 placeholder:font-medium placeholder:text-slate-300
 placeholder={`Masukkan nilai ${setting.label.toLowerCase()}...`}
 />

 {setting.type === 'password' && (
 <button
 type="button"
 onClick={() => togglePassword(setting.id)}
 className="absolute right-4 top-1/2 -/2 p-2 text-slate-300 hover:text-primaryactive:"
 >
 {showPassword[setting.id] ? (
 <EyeOff className="w-4.5 h-4.5" />
 ) : (
 <Eye className="w-4.5 h-4.5" />
 )}
 </button>
 )}
 </div>
 {errors[`settings.${data.settings.indexOf(formItem!)}.value`] && (
 <p className="text-xs text-sm text-rose-500 ml-1 ">{errors[`settings.${data.settings.indexOf(formItem!)}.value`]}</p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 ))}

 {/* Operational Footer Bar */}
 {/* 
 Emerald Tactical Footer Monitor 
 */}
 <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
 
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary">
 <ShieldCheck className="h-7 w-7 text-primary" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-white ">_V3</h4>
 <p className="text-xs text-emerald-400 text-sm mt-2 whitespace-nowrap">STATUS: SYSTEM_INTEGRITY_VERIFIED</p>
 </div>
 </div>
 <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-2xl opacity-75">
 Pesan Keamanan: Setiap perubahan pada parameter global akan berdampak langsung pada siklus operasional KKN. 
 Pastikan orkestrasi data telah divalidasi melalui prosedur audit internal sebelum melakukan penyimpanan permanen.
 </p>
 </div>

 <button
 type="submit"
 disabled={processing}
 className="group h-18 px-6 bg-white text-primary rounded-lg flex items-center justify-center gap-6 font-semibold text-sm disabled:opacity-50 shrink-0"
 >
 {processing ? (
 <>
 <RefreshCw className="h-5.5 w-5.5" />
 COMMITTING_CHANGES...
 </>
 ) : (
 <>
 <Save className="h-5.5 w-5.5 group-transition-transform" />
 EKSEKUSI_PEMBARUAN
 </>
 )}
 </button>
 </div>
 </div>
 </form>

 <div className="text-center pt-8">
 <p className="text-xs text-sm text-slate-300 opacity-50">
 Pusat Kendali Sistem Global • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
