interface Props {
 oldValues: Record<string, unknown>;
 newValues: Record<string, unknown>;
}

function formatValue(value: unknown): string {
 if (value === null) {
 return 'null';
 }

 if (typeof value === 'boolean') {
 return value ? 'true' : 'false';
 }

 if (typeof value === 'object') {
 return JSON.stringify(value);
 }

 return String(value);
}

function formatLabel(key: string): string {
 return key
 .replace(/_/g, ' ')
 .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function VisualDiff({ oldValues, newValues }: Props) {
 const keys = Array.from(
 new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]),
 ).filter((key) => key !== 'updated_at' && key !== 'id');

 if (keys.length === 0) {
 return <div className="rounded-lg border border-emerald-100/60 bg-emerald-50/30 p-4 text-sm text-emerald-950">Tidak ada perubahan yang tercatat.</div>;
 }

 return (
 <div className="space-y-3">
 <div className="grid grid-cols-12 rounded-lg border border-emerald-100/60 bg-emerald-50/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-950">
 <div className="col-span-4">Field</div>
 <div className="col-span-4">Sebelum</div>
 <div className="col-span-4">Sesudah</div>
 </div>

 <div className="space-y-2">
 {keys.map((key) => {
 const before = oldValues?.[key];
 const after = newValues?.[key];
 const changed = JSON.stringify(before) !== JSON.stringify(after);

 if (!changed) {
 return null;
 }

 return (
 <div
 key={key}
 className="grid grid-cols-12 items-start gap-4 rounded-lg border border-emerald-100/60 bg-white px-4 py-3"
 >
 <div className="col-span-4 text-sm font-medium text-emerald-700">{formatLabel(key)}</div>
 <div className="col-span-4">
 <span className="inline-flex rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
 {before === undefined ? 'Tidak ada' : formatValue(before)}
 </span>
 </div>
 <div className="col-span-4">
 <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
 {after === undefined ? 'Dihapus' : formatValue(after)}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
