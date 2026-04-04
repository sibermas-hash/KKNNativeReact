import { Badge } from '@/Components/ui';

interface Props {
 oldValues: Record<string, unknown>;
 newValues: Record<string, unknown>;
}

export default function VisualDiff({ oldValues, newValues }: Props) {
 if (!oldValues && !newValues) return <div className="text-slate-500 italic text-sm p-4">No changes recorded.</div>;

 const allKeys = Array.from(new Set([
 ...Object.keys(oldValues || {}),
 ...Object.keys(newValues || {})
 ])).filter(key => key !== 'updated_at' && key !== 'id');

 const formatValue = (val: unknown): string => {
 if (val === null) return 'null';
 if (typeof val === 'boolean') return val ? 'true' : 'false';
 if (typeof val === 'object') return JSON.stringify(val);
 return String(val);
 };

 return (
 <div className="space-y-3">
 <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase bg-slate-50/50 rounded-xl border border-slate-100">
 <div className="col-span-4">Field</div>
 <div className="col-span-4">Original</div>
 <div className="col-span-4">Modified</div>
 </div>

 <div className="space-y-1">
 {allKeys.map(key => {
 const oldVal = oldValues?.[key];
 const newVal = newValues?.[key];
 const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

 if (!hasChanged && oldValues && newValues) return null; // Only show changed in detailed diff

 return (
 <div key={key} className="grid grid-cols-12 px-4 py-3 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50/50 items-center gap-4">
 <div className="col-span-4">
 <span className="text-xs font-bold text-slate-500 uppercase ' ')}</span>
 </div>
 <div className="col-span-4">
 {oldVal !== undefined ? (
 <div className="text-xs font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50 truncate" title={formatValue(oldVal)}>
 {formatValue(oldVal)}
 </div>
 ) : (
 <Badge variant="default" className="bg-slate-50 text-[10px] opacity-40">ADDED</Badge>
 )}
 </div>
 <div className="col-span-4">
 {newVal !== undefined ? (
 <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50 truncate" title={formatValue(newVal)}>
 {formatValue(newVal)}
 </div>
 ) : (
 <Badge variant="danger" className="text-[10px]">REMOVED</Badge>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
