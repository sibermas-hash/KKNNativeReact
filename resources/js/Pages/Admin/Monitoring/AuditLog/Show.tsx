import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import { 
  ChevronLeft, 
  Clock, 
  User, 
  Layers, 
  Code2, 
  Info,
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Binary,
  Fingerprint
} from 'lucide-react';
import { clsx } from 'clsx';

// Premium Components
import PageHeader from '@/Components/Premium/PageHeader';
import ContentPanel from '@/Components/Premium/ContentPanel';

interface AuditLog {
  id: number; 
  description: string; 
  subject_type: string | null; 
  subject_id: number | null;
  causer_type: string | null; 
  causer_id: number | null; 
  causer?: { name: string };
  properties: Record<string, unknown>; 
  created_at: string;
}

interface Props { log: AuditLog; }

export default function AuditLogShow({ log }: Props) {
  const subjectModel = log.subject_type?.split('\\').pop() || 'Sistem';
  const causerModel = log.causer_type?.split('\\').pop() || 'Internal';

  return (
    <AppLayout title="Detail Log Aktivitas">
      <Head title={`Detail Log #${log.id} | SIBERDAYA`} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-10 font-sans">
        
        {/* PAGE HEADER */}
        <PageHeader
          title={`Log #${log.id.toString().padStart(6, '0')}.`}
          subtitle="Analisis mendalam mutasi data, aktor otoritas, dan jejak kronologis aktivitas sistem."
          icon={Terminal}
          groupLabel="Chronological Integrity Audit"
          backUrl={route('admin.audit-log.index')}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* MAIN CONTENT */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* SUMMARY */}
            <ContentPanel
              title="Ringkasan Aktivitas"
              description="Deskripsi kejadian dan timestamp eksekusi runtime."
              icon={Info}
            >
              <div className="space-y-6 py-4">
                <p className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-tight">
                  {log.description}
                </p>
                <div className="flex items-center gap-3 text-emerald-600/50">
                  <Clock size={16} strokeWidth={3} />
                  <span className="text-[12px] font-black tabular-nums uppercase tracking-widest">{log.created_at}</span>
                </div>
              </div>
            </ContentPanel>

            {/* INFO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-600 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <User size={18} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-[0.2em]">Otoritas Aktor</span>
                </div>
                <p className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-2">{log.causer?.name || 'SYSTEM_DAEMON'}</p>
                <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">Tipe: {causerModel}</p>
              </div>

              <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-600 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Layers size={18} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-950/20 uppercase tracking-[0.2em]">Subjek Event</span>
                </div>
                <p className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-2">{subjectModel}</p>
                <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">
                  {log.subject_id ? `ID: #${log.subject_id}` : 'GLOBAL_EVENT'}
                </p>
              </div>
            </div>

            {/* PROPERTIES JSON */}
            <ContentPanel
              title="Data Properti (Payload)"
              description="Detail mutasi data dan metadata tambahan dalam format JSON terenkripsi."
              icon={Code2}
              padding={false}
            >
              <div className="bg-emerald-950 p-8 rounded-b-[2rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Binary size={120} className="text-emerald-400" />
                </div>
                <pre className="text-[12px] text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono tabular-nums relative z-10 selection:bg-emerald-500/30">
                  {JSON.stringify(log.properties, null, 4)}
                </pre>
              </div>
            </ContentPanel>
          </div>

          {/* SIDEBAR */}
          <div className="xl:col-span-4 space-y-8">
            <ContentPanel
              title="System Metadata"
              description="Parameter internal log."
              icon={Binary}
            >
              <div className="space-y-4 py-2">
                <MetaRow label="SUBJECT_ID" value={log.subject_id ? `#${log.subject_id.toString().padStart(4, '0')}` : 'NULL'} />
                <MetaRow label="ACTOR_TYPE" value={causerModel} />
                <MetaRow label="ACTION_NODE" value={log.description.split(' ')[0].toUpperCase()} />
                <MetaRow label="MODULE_SCOPE" value={subjectModel.toUpperCase()} />
              </div>
            </ContentPanel>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b-2 border-slate-50 last:border-0 group">
      <span className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest group-hover:text-emerald-950 transition-colors">{label}</span>
      <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase">{value}</span>
    </div>
  );
}
