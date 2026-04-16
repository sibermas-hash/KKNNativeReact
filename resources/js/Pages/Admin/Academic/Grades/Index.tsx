import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect } from '@/Components/ui';
import {
  Users,
  Activity,
  ShieldCheck,
  Target,
  Layers,
  Clock,
  FileEdit,
  Database,
  History,
  Zap,
  Info,
  BookOpen,
  UserCheck,
  Video,
  ClipboardCheck,
  Hourglass,
  Layout,
  Star,
  GraduationCap,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { DashboardMetricProps, GradeScoreField, GradeFormData } from '@/types';

interface Group {
  id: number;
  code: string;
  nama_kelompok: string;
}
interface StudentOption {
  id: number;
  name: string;
  nim?: string;
}
interface Props {
  groups: Group[];
}

export default function AdminGradesIndex({ groups }: Props) {
  const form = useForm({
    kelompok_id: '',
    student_id: '',
    // DESA (20%)
    desa_interaksi_score: '',
    desa_disiplin_score: '',
    desa_kinerja_score: '',
    // DPL (40%)
    dpl_relevansi_score: '',
    dpl_ketercapaian_score: '',
    dpl_inovasi_score: '',
    dpl_administrasi_score: '',
    dpl_artikel_score: '',
    // PUSAT / LPPM (40%)
    administration_score: '', 
  });

  const { data, setData, post, processing, errors, recentlySuccessful } = form;
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // --- LIVE CALCULATION LOGIC ---
  const calculateResult = useMemo(() => {
    const parse = (v: any) => parseFloat(v) || 0;
    
    // Weights
    const W_DESA = 0.20;
    const W_DPL = 0.40;
    const W_PUSAT = 0.40;

    // Component Averages
    const desaTotal = (parse(data.desa_interaksi_score) + parse(data.desa_disiplin_score) + parse(data.desa_kinerja_score)) / 3;
    const dplTotal = (parse(data.dpl_relevansi_score) + parse(data.dpl_ketercapaian_score) + parse(data.dpl_inovasi_score) + parse(data.dpl_administrasi_score) + parse(data.dpl_artikel_score)) / 5;
    const pusatTotal = parse(data.administration_score);

    const finalScore = (desaTotal * W_DESA) + (dplTotal * W_DPL) + (pusatTotal * W_PUSAT);
    
    // Grading Scale (Agt 56)
    let grade = 'E';
    let color = 'text-emerald-300'; // Default, will be modified below
    if (finalScore >= 86) { grade = 'A'; color = 'text-emerald-700'; }
    else if (finalScore >= 81) { grade = 'A-'; color = 'text-emerald-600'; }
    else if (finalScore >= 76) { grade = 'B+'; color = 'text-emerald-500'; }
    else if (finalScore >= 71) { grade = 'B'; color = 'text-emerald-500'; }
    else if (finalScore >= 66) { grade = 'B-'; color = 'text-amber-600'; }
    else if (finalScore >= 61) { grade = 'C+'; color = 'text-amber-600'; }
    else if (finalScore >= 56) { grade = 'C'; color = 'text-amber-700'; }
    else if (finalScore >= 42) { grade = 'D'; color = 'text-rose-600'; }
    else if (finalScore > 0) { grade = 'E'; color = 'text-rose-700'; }

    // Progress counter
    const fields = [
      'desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score',
      'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score',
      'administration_score'
    ];
    const filledCount = fields.filter(f => parse(data[f as keyof typeof data]) > 0).length;

    return { 
      score: finalScore.toFixed(2), 
      grade, 
      color, 
      progress: Math.round((filledCount / 9) * 100),
      filledCount
    };
  }, [data]);

  const fieldError = (field: string): string | undefined =>
    (errors as Record<string, string | undefined>)[`scores.0.${field}`] ??
    (errors as Record<string, string | undefined>)[field];

  useEffect(() => {
    const fetchStudents = async () => {
      if (!data.kelompok_id) {
        setStudents([]);
        setData('student_id', '');
        return;
      }
      setLoadingStudents(true);
      try {
        const response = await axios.get(`/admin/kelompok/${data.kelompok_id}/mahasiswa`);
        setStudents(response.data);
      } catch {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    void fetchStudents();
  }, [data.kelompok_id]);

  const handleReset = () => {
    form.reset(
      'desa_interaksi_score', 'desa_disiplin_score', 'desa_kinerja_score',
      'dpl_relevansi_score', 'dpl_ketercapaian_score', 'dpl_inovasi_score', 'dpl_administrasi_score', 'dpl_artikel_score',
      'administration_score'
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      kelompok_id: data.kelompok_id,
      scores: [{
          student_id: data.student_id,
          desa_interaksi_score: data.desa_interaksi_score,
          desa_disiplin_score: data.desa_disiplin_score,
          desa_kinerja_score: data.desa_kinerja_score,
          dpl_relevansi_score: data.dpl_relevansi_score,
          dpl_ketercapaian_score: data.dpl_ketercapaian_score,
          dpl_inovasi_score: data.dpl_inovasi_score,
          dpl_administrasi_score: data.dpl_administrasi_score,
          dpl_artikel_score: data.dpl_artikel_score,
          administration_score: data.administration_score, 
      }],
    };
    form.transform(() => payload);
    form.post(window.route('admin.nilai.store'));
  };

  return (
    <AppLayout title="Pusat Penilaian Akademik">
      <Head title="Koreksi Nilai - KKN UIN SAIZU" />

      <div className="max-w-full mx-auto space-y-6 pb-24 font-sans px-6 lg:px-12 bg-white">
        {/* --- DYNAMIC ANALYTICS HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-10 border-b-2 border-emerald-50 pb-10 sticky top-0 z-40 bg-white/95 backdrop-blur-xl -mx-6 px-12">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                Sinkronisasi <span className="text-emerald-600">Nilai.</span>
                </h1>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Panel Koreksi Komponen Penilaian
                </p>
            </div>
            
            {/* LIVE SCORE BADGE */}
            {data.student_id && (
                <div className="flex items-center gap-4 pl-8 border-l-2 border-emerald-100">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Skor Keseluruhan</p>
                        <p className="text-3xl font-black text-emerald-950 leading-none tracking-tighter">{calculateResult.score}</p>
                    </div>
                    <div className="h-12 w-12 bg-emerald-800 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 border border-emerald-950">
                        <span className={`text-xl font-black ${calculateResult.color.replace('text-', 'text-emerald-')} text-white`}>
                            {calculateResult.grade}
                        </span>
                    </div>
                </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden xl:flex items-center gap-8 mr-4">
                 <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                        <span>Status Pengisian</span>
                        <span className="text-emerald-700">{calculateResult.filledCount} / 9</span>
                    </div>
                    <div className="w-32 h-2 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                        <div 
                            className="h-full bg-emerald-600 transition-all duration-500 ease-out" 
                            style={{ width: `${calculateResult.progress}%` }} 
                        />
                    </div>
                 </div>
                 <div className="h-10 w-[2px] bg-emerald-50" />
                 <Metric label="SISTEM" value="TERHUBUNG" icon={Database} />
             </div>
             
             <div className="flex items-center gap-3">
                <button
                    onClick={handleReset}
                    className="h-12 w-12 border-2 border-emerald-100 text-emerald-700 bg-white rounded-xl hover:bg-emerald-50 hover:text-emerald-950 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                    title="Kosongkan Form"
                >
                    <RotateCcw size={18} strokeWidth={2.5} />
                </button>
                <button
                    onClick={onSubmit}
                    disabled={processing || !data.student_id}
                    className="h-12 px-10 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-600/30 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 flex items-center gap-3"
                >
                    {processing ? (
                        <Activity className="animate-spin" size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    {processing ? 'MENYIMPAN...' : 'SIMPAN PERMANEN'}
                </button>
             </div>
          </div>
        </div>

        {/* --- CONTEXTUAL SELECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white border border-emerald-100 rounded-3xl shadow-sm">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-3">
              <span className="h-6 w-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-[10px] border border-emerald-200">01</span>
              LOKASI & KELOMPOK
            </label>
            <FormSelect
              value={data.kelompok_id}
              onChange={(e) => setData('kelompok_id', e.target.value)}
              className="h-14 w-full px-5 bg-white border-2 border-emerald-50 rounded-xl text-base font-black text-emerald-950 focus:border-emerald-500 focus:ring-0 transition-all shadow-inner"
            >
              <option value="">-- PILIH KELOMPOK KKN --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.nama_kelompok?.toUpperCase()}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-3">
              <span className="h-6 w-6 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-[10px] border border-emerald-200">02</span>
              IDENTITAS MAHASISWA
            </label>
            <FormSelect
              value={data.student_id}
              onChange={(e) => setData('student_id', e.target.value)}
              className="h-14 w-full px-5 bg-white border-2 border-emerald-50 rounded-xl text-base font-black text-emerald-950 focus:border-emerald-500 focus:ring-0 transition-all shadow-inner disabled:bg-emerald-50/50"
              disabled={!data.kelompok_id || loadingStudents}
            >
              <option value="">
                {loadingStudents ? 'MENGAMBIL DATA...' : '-- PILIH MAHASISWA --'}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nim} • {s.name.toUpperCase()}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        {/* --- INTELLIGENT ASSESSMENT BLOCKS --- */}
        <div className="space-y-16 pt-8">
          {!data.student_id ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-emerald-50/30 rounded-3xl border border-dashed border-emerald-200">
               <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-100">
                  <UserCheck size={32} strokeWidth={2} />
               </div>
               <div className="space-y-2">
                  <p className="text-xl font-black text-emerald-950 tracking-tighter">Mahasiswa Belum Dipilih</p>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pilih Mahasiswa peserta KKN untuk memulai input nilai</p>
               </div>
            </div>
          ) : (
            <>
              <SmartSection
                title="Pemerintah Desa"
                subtitle="Penilaian dari Perangkat Desa"
                weight="20"
                fields={[
                  { id: 'desa_interaksi_score', label: 'Interaksi Sosial', icon: Users },
                  { id: 'desa_disiplin_score', label: 'Kedisiplinan & Etika', icon: Clock },
                  { id: 'desa_kinerja_score', label: 'Kinerja Kelompok', icon: Activity },
                ]}
                data={data}
                setData={setData}
                fieldError={fieldError}
              />

              <SmartSection
                title="Dosen Pembimbing"
                subtitle="Evaluasi dari Dosen Pembimbing Lapangan"
                weight="40"
                fields={[
                  { id: 'dpl_relevansi_score', label: 'Relevansi Program', icon: Target },
                  { id: 'dpl_ketercapaian_score', label: 'Tingkat Capaian', icon: Zap },
                  { id: 'dpl_inovasi_score', label: 'Nilai Inovasi', icon: Info },
                  { id: 'dpl_administrasi_score', label: 'Kelengkapan Administrasi', icon: FileEdit },
                  { id: 'dpl_artikel_score', label: 'Kualitas Artikel', icon: BookOpen },
                ]}
                data={data}
                setData={setData}
                fieldError={fieldError}
              />

              <SmartSection
                title="LPPM Pusat"
                subtitle="Verifikasi Institusional LPPM"
                weight="40"
                fields={[
                  { id: 'administration_score', label: 'Skor Administrasi Pusat', icon: Layers },
                ]}
                data={data}
                setData={setData}
                fieldError={fieldError}
              />
            </>
          )}
        </div>

        {/* --- ACCESSIBILITY FOOTER --- */}
        <div className="mt-20 pt-10 border-t-2 border-emerald-50 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                 <ShieldCheck className="text-emerald-600" size={24} />
                 <p className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Protokol Kepatuhan Aktif • Sesuai Panduan Penilaian</p>
             </div>
             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistem Informasi KKN UIN SAIZU</p>
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm bg-white">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-black text-emerald-950 leading-none">{value}</p>
      </div>
    </div>
  );
}

function SmartSection({
  title,
  subtitle,
  weight,
  fields,
  data,
  setData,
  fieldError,
}: {
  title: string;
  subtitle: string;
  weight: string;
  fields: GradeScoreField[];
  data: GradeFormData;
  setData: (field: string, value: string) => void;
  fieldError: (f: string) => string | undefined;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-l-4 border-emerald-600 pl-5 py-2 bg-emerald-50/30 rounded-r-2xl border border-y-0 border-r-0">
        <div>
            <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter leading-none mb-1.5">
            {title}
            </h2>
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 pr-4">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Bobot Total</span>
            <span className="px-5 py-2 bg-white border border-emerald-200 text-emerald-800 text-sm font-black rounded-xl shadow-sm">
            {weight}%
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {fields.map((field) => {
          const val = parseFloat(data[field.id as keyof typeof data] as string) || 0;
          const isFilled = val > 0;
          const isError = val > 100;

          return (
            <div 
                key={field.id} 
                className={`flex flex-col gap-4 p-5 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
                    isError ? 'border-rose-400 bg-rose-50 shadow-md' :
                    isFilled ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-100/50' : 
                    'border-emerald-100 bg-emerald-50/20'
                }`}
            >
              {/* Top Accent line */}
              {isFilled && !isError && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
              )}
              {isError && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
              )}

              <div className="flex items-center justify-between z-10 pt-1">
                <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isFilled ? 'text-emerald-950' : 'text-emerald-800'}`}>
                    <field.icon size={14} strokeWidth={isFilled ? 3 : 2} className={isFilled && !isError ? 'text-emerald-600' : ''} />
                    {field.label}
                </label>
                {isFilled && !isError && <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={3} />}
                {isError && <AlertCircle size={16} className="text-rose-600 animate-bounce" strokeWidth={3} />}
              </div>
              
              <div className="relative z-10 mt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={String(data[field.id as keyof typeof data] ?? '')}
                  onChange={(e) => setData(field.id as any, e.target.value)}
                  className={`w-full h-14 bg-white border border-b-4 rounded-xl flex items-center justify-center font-black text-3xl text-center focus:outline-none transition-all tabular-nums shadow-inner ${
                      isError ? 'border-rose-300 border-b-rose-500 text-rose-700 bg-rose-50 focus:border-rose-600 focus:border-b-rose-600' :
                      isFilled ? 'border-emerald-100 border-b-emerald-600 text-emerald-950 focus:border-emerald-400 focus:border-b-emerald-700' : 
                      'border-emerald-50 border-b-emerald-200 text-emerald-950 focus:border-emerald-300 focus:border-b-emerald-500'
                  }`}
                  placeholder="0"
                />
              </div>

              {fieldError(field.id) || isError ? (
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center mt-1 z-10">
                  {isError ? 'MAKSIMAL 100 POIN' : fieldError(field.id)}
                </p>
              ) : (
                <p className={`text-[9px] font-black uppercase tracking-widest text-center mt-1 z-10 ${isFilled ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                    MASUKKAN SKOR
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
