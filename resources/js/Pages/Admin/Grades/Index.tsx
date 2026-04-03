import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, FormInput } from '@/Components/ui';
import axios from 'axios';
import { route } from 'ziggy-js';
import {
  ShieldAlert,
  Users,
  Zap,
  ShieldCheck,
  Info,
  Sparkles,
  Fingerprint,
  RotateCcw,
  Cpu,
  Save,
  TriangleAlert
} from 'lucide-react';
import { clsx } from 'clsx';

interface Group {
  id: number;
  code: string;
  name: string;
  lecturer?: { user?: { name: string } };
}

interface StudentOption {
  id: number;
  name: string;
  email: string;
  username: string;
  nim?: string;
}

interface Props {
  groups: Group[];
}

export default function Index({ groups }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    group_id: '',
    student_id: '',
    execution_score: '',
    article_score: '',
    discipline_score: '',
    attitude_score: '',
  });

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchStudents = async (groupId: string) => {
    if (!groupId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await axios.get(route('admin.groups.students', groupId));
      setStudents(res.data);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (data.group_id) {
      fetchStudents(data.group_id as string);
    }
  }, [data.group_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.grades.store'), {
      onSuccess: () => {
        reset('execution_score', 'article_score', 'discipline_score', 'attitude_score');
      },
    });
  };

  return (
    <AppLayout title="Inisiasi Koreksi Nilai Manual">
      <Head title="Koreksi Nilai Manual" />
      
      <div className="space-y-12 pb-24">
        {/* 
            Emerald Premium Header 
            Refining from heavy rose to lush tactical emerald/rose gradient hybrid
        */}
        <div className="relative overflow-hidden rounded-lg bg-white from-rose-900 via-primary-dark to-[#043d23] p-10 md:p-14 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
            
            <div className="relative z-10 space-y-5 flex-1">
                <div className="flex items-center gap-3 mb-2">
                     <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                        <ShieldAlert className="h-4 w-4 text-rose-300" />
                     </div>
                    <span className="text-[10px] font-black text-rose-100 uppercase  leading-none italic">
                        MANUAL_OVERRIDE_PROTOCOL_V3
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                    Koreksi <span className="text-rose-300 text-glow-rose italic">Parameter Nilai</span>
                </h1>
                <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                     Inisiasi penimpaan manual parameter nilai mahasiswa. Protokol ini melewati alur evaluasi standar dan memerlukan otorisasi admin pusat.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                    <div className="p-3 bg-white rounded-lg text-rose-600 group-hover/stat:scale-110 transition-transform">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-rose-200/60 uppercase  block mb-1.5 italic">Status Gateway</span>
                        <span className="text-2xl font-black text-white uppercase italic leading-none">OVERRIDE_ACTIVE</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:mx-2">
            {/* Warning Policy Section */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-white rounded-lg p-10 border border-slate-100 sticky top-12 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-rose-600 pointer-events-none group-hover:rotate-6 transition-transform">
                        <TriangleAlert className="h-64 w-64" />
                    </div>

                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                            <div className="p-3.5 bg-rose-500 rounded-lg text-white
                                <ShieldCheck className="h-6 w-6 stroke-[2.5px]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase italic  leading-[0.8]">Audit_Integrity</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase  mt-2 italic opacity-70">KEBIJAKAN LPPM</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-8 bg-rose-50 rounded-lg border border-rose-100
                                <p className="text-[13px] font-bold text-rose-900 leading-relaxed italic opacity-80">
                                    <strong className="uppercase">Peringatan:</strong> Injeksi manual akan melewati alur evaluasi standar (DPL & Desa). Tindakan ini hanya diperuntukkan bagi admin dengan otorisasi khusus.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 italic">
                                    <div className="p-2 bg-white rounded-xl text-rose-500">
                                        <Fingerprint className="h-4 w-4" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed opacity-70">
                                        Setiap perubahan nilai manual akan dicatat permanen dalam audit log keamanan sistem.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 italic">
                                    <div className="p-2 bg-white rounded-xl text-primary">
                                        <Cpu className="h-4 w-4" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed opacity-70">
                                        Sistem akan melakukan re-kalkulasi skor total secara otomatis setelah data dikirimkan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 space-y-10">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg p-12 border border-slate-100 relative overflow-hidden group mx-1">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform">
                        <Sparkles className="h-64 w-64" />
                    </div>

                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-6 border-b border-slate-50 pb-10">
                            <div className="p-4 bg-emerald-50 text-primary rounded-lg border border-primary/20
                                <RotateCcw className="h-7 w-7 stroke-[2.5px]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic  leading-none">Parameter_Kalibrasi</h3>
                                <p className="text-[11px] font-black text-slate-400 mt-2 uppercase  italic opacity-70">INPUT DATA NILAI SEKTORAL</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors flex items-center gap-2">
                                    <Users className="h-3 w-3" /> PILIH KELOMPOK TARGET
                                </label>
                                <FormSelect
                                    value={data.group_id}
                                    onChange={(e) => setData('group_id', e.target.value)}
                                    error={errors.group_id}
                                    className="bg-slate-50 border-slate-100 text-sm font-black text-slate-900 h-16 rounded-lg focus:bg-white focus:border-primary/40 transition-all px-8 italic uppercase"
                                >
                                    <option value="">PILIH OPERASIONAL KELOMPOK</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            KELOMPOK {g.code || g.name} {g.lecturer?.user?.name ? `- DPL: ${g.lecturer.user.name}` : ''}
                                        </option>
                                    ))}
                                </FormSelect>
                            </div>

                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-slate-400 uppercase  ml-2 italic group-focus-within/field:text-primary transition-colors flex items-center gap-2">
                                    <Fingerprint className="h-3 w-3" /> IDENTITAS MAHASISWA
                                </label>
                                <FormSelect
                                    value={data.student_id}
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    error={errors.student_id}
                                    disabled={!data.group_id || loadingStudents}
                                    className="bg-slate-50 border-slate-100 text-sm font-black text-slate-900 h-16 rounded-lg focus:bg-white focus:border-primary/40 transition-all px-8 italic uppercase"
                                >
                                    <option value="">{loadingStudents ? 'MENYINKRONKAN DATA...' : 'PILIH PESERTA UNIT'}</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.username || s.name} {s.nim ? `(${s.nim})` : ''}
                                        </option>
                                    ))}
                                </FormSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { id: 'execution_score' as const, label: 'SKOR EKSEKUSI (%)', color: 'primary' },
                                { id: 'article_score' as const, label: 'SKOR ARTIKEL (%)', color: 'primary' },
                                { id: 'discipline_score' as const, label: 'KEDISIPLINAN (%)', color: 'slate' },
                                { id: 'attitude_score' as const, label: 'SKOR SIKAP (%)', color: 'slate' },
                            ].map((field) => (
                                <div key={field.id} className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-400 uppercase  text-center block italic">{field.label}</label>
                                    <FormInput
                                        type="number"
                                        value={data[field.id]}
                                        onChange={(e) => setData(field.id, e.target.value)}
                                        error={errors[field.id]}
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        className={clsx(
                                            "bg-slate-50 border-slate-100 text-2xl font-black h-20 rounded-lg focus:bg-white focus:border-primary/40 transition-all text-center italic tabular-nums",
                                            field.color === 'primary' ? 'text-primary' : 'text-slate-900'
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-8 border-t border-slate-50">
                            <button
                                type="submit"
                                disabled={processing || loadingStudents}
                                className="px-14 py-6 bg-rose-600 text-white text-[11px] font-black uppercase  rounded-lg hover:bg-rose-700 hover:-translate-y-1 active:scale-95 transition-all italic flex items-center gap-4"
                            >
                                <Save className="w-5 h-5" />
                                Otorisasi_Overide_Manual
                            </button>
                        </div>
                    </div>
                </form>

                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-1">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                    <ShieldCheck className="h-7 w-7 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">OVERRIDE_GOVERNANCE_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-rose-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: AUDIT_STREAMS_ACTIVE</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Petunjuk Keamanan: Penilaian manual adalah tindakan intervensi tingkat tinggi. 
                                Seluruh record akan di-hash dan disimpan dalam ledger audit untuk keperluan review oleh pimpinan universitas. 
                                Pastikan justifikasi koreksi telah terdokumentasi secara luring.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">AUDIT_LOG_STREAMING</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-300 transition-colors group/ic cursor-help">
                                    <Info className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
