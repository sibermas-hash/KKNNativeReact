import { Lock, Activity } from 'lucide-react';

interface GovernanceProtocolsProps {
  requirements: string[];
  governance_notes: string[];
}

export const GovernanceProtocols = ({
  requirements,
  governance_notes,
}: GovernanceProtocolsProps) => {
  return (
    <div className="p-12 rounded-[4rem] bg-bg-[#f0fdfa] text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 text-emerald-950/10 group-hover:rotate-12 transition-transform duration-[2s]">
        <Lock size={180} />
      </div>
      <div className="relative z-10 grid gap-16 md:grid-cols-2">
        <div>
          <h4 className="text-base font-bold tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
            <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Scheme Intelligence
          </h4>
          <ul className="space-y-6">
            {requirements.map((item, i) => (
              <li key={i} className="flex gap-4 group/li">
                <div className="h-6 w-6 rounded-lg bg-bg-[#f0fdfa] border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-[#0d9488] transition-colors">
                  <Activity className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800/70 leading-relaxed uppercase tracking-tight">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-base font-bold tracking-tight mb-8 text-emerald-400 uppercase flex items-center gap-4">
            <div className="h-6 w-1 bg-emerald-400 rounded-full" /> Governance Protocol
          </h4>
          <ul className="space-y-6">
            {governance_notes.map((item, i) => (
              <li key={i} className="flex gap-4 group/li">
                <div className="h-6 w-6 rounded-lg bg-bg-[#f0fdfa] border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/li:bg-[#0d9488] transition-colors">
                  <Activity className="h-4 w-4 text-emerald-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800/70 leading-relaxed uppercase tracking-tight">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
