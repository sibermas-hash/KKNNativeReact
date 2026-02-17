import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormSelect, FormInput } from '@/Components/ui';
import axios from 'axios';
import {
  ExclamationTriangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BeakerIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

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
    } catch (e) {
      console.error(e);
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
    <AppLayout title="Manual Merit Override">
      <Head title="Quantum Merit Override" />
      <div className="max-w-4xl mx-auto space-y-12 pb-16 animate-in fade-in duration-1000">

        {/* Elite Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative text-center md:text-left">
          <div className="absolute -left-12 top-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
          <div className="relative">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.3em]">MANUAL OVERRIDE PROTOCOL</div>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
              Manual <span className="text-accent-gold text-glow-gold">Override</span>
            </h1>
            <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Strategic manual merit parameter injection and value correction hub.</p>
          </div>
        </div>

        {/* Warning Intel */}
        <div className="p-8 glass rounded-[2.5rem] border-rose-500/20 flex gap-6 group relative overflow-hidden bg-rose-500/[0.02]">
          <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-rose-500 group-hover:rotate-12 transition-all">
            <ExclamationTriangleIcon className="h-24 w-24" />
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-2xl shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest italic mb-2">Primary Override Warning</h4>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed italic border-l-2 border-rose-500/30 pl-6">
              MANUAL INJECTION WILL BYPASS STANDARDIZED EVALUATION FLOWS. AUTHORIZED COMMANDERS ONLY. ALL OVERRIDES ARE LOGGED IN THE AUDIT NEXUS.
            </p>
          </div>
        </div>

        {/* Override Form */}
        <form onSubmit={handleSubmit} className="space-y-12 glass rounded-[3.5rem] p-12 shadow-2xl border-white/5 backdrop-blur-xxl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
            <BoltIcon className="h-64 w-64" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                <UserGroupIcon className="h-4 w-4 text-accent-gold" />
                TARGET BRIGADE
              </label>
              <FormSelect
                value={data.group_id}
                onChange={(e) => setData('group_id', e.target.value)}
                error={errors.group_id}
                className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-16 rounded-2xl focus:border-accent-gold/50"
              >
                <option value="" className="bg-slate-900">SELECT OPERATIONAL BRIGADE</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-900">
                    BRIGADE {g.code || g.name} {g.lecturer?.user?.name ? `// OFFICER ${g.lecturer.user.name}` : ''}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                <AcademicCapIcon className="h-4 w-4 text-primary-light" />
                SCHOLAR IDENTITY
              </label>
              <FormSelect
                value={data.student_id}
                onChange={(e) => setData('student_id', e.target.value)}
                error={errors.student_id}
                disabled={!data.group_id || loadingStudents}
                className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-16 rounded-2xl focus:border-accent-gold/50"
              >
                <option value="" className="bg-slate-900 text-white/20">SELECT SCHOLAR UNIT</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.username || s.name} {s.nim ? `(${s.nim})` : ''}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">FIELD EXECUTION SCORE</label>
              <FormInput
                type="number"
                value={data.execution_score}
                onChange={(e) => setData('execution_score', e.target.value)}
                error={errors.execution_score}
                min={0}
                max={100}
                step="0.01"
                className="bg-black/40 border-white/10 text-xl font-black tracking-widest text-accent-gold h-16 rounded-2xl focus:border-accent-gold/50 text-center"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">PUBLICATION SCORE</label>
              <FormInput
                type="number"
                value={data.article_score}
                onChange={(e) => setData('article_score', e.target.value)}
                error={errors.article_score}
                min={0}
                max={100}
                step="0.01"
                className="bg-black/40 border-white/10 text-xl font-black tracking-widest text-accent-gold h-16 rounded-2xl focus:border-accent-gold/50 text-center"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">SECTOR DISCIPLINE</label>
              <FormInput
                type="number"
                value={data.discipline_score}
                onChange={(e) => setData('discipline_score', e.target.value)}
                error={errors.discipline_score}
                min={0}
                max={100}
                step="0.01"
                className="bg-black/40 border-white/10 text-xl font-black tracking-widest text-primary-light h-16 rounded-2xl focus:border-primary-light/50 text-center"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">SECTOR ATTITUDE</label>
              <FormInput
                type="number"
                value={data.attitude_score}
                onChange={(e) => setData('attitude_score', e.target.value)}
                error={errors.attitude_score}
                min={0}
                max={100}
                step="0.01"
                className="bg-black/40 border-white/10 text-xl font-black tracking-widest text-primary-light h-16 rounded-2xl focus:border-primary-light/50 text-center"
              />
            </div>
          </div>

          <div className="flex justify-end pt-10 border-t border-white/5">
            <button
              type="submit"
              disabled={processing || loadingStudents}
              className="group relative px-16 py-6 bg-gradient-to-br from-rose-600 to-rose-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-rose-900/40 hover:scale-[1.05] active:scale-95 transition-all border border-white/10 italic overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              AUTHORIZE OVERRIDE
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 px-10">
          <div className="p-3 bg-white/5 rounded-xl text-white/20">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic leading-loose">
            QUANTUM PARAMETERS INJECTED VIA THIS CONSOLE WILL BE PERMANENTLY RECORDED AS MANUAL MODIFICATIONS IN THE CENTRAL ARCHIVE.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
