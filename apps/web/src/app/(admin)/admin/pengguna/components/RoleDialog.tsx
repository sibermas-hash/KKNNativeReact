import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from '../lib/user-types';
import { roleOptions } from '../lib/user-options';

type Props = { user: User | null; editRole: string; setEditRole: (value: string) => void; roleMutation: UseMutationResult<unknown, unknown, { id: number; role: string }>; onClose: () => void };

export function RoleDialog({ user, editRole, setEditRole, roleMutation, onClose }: Props) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5" role="dialog" aria-modal="true" aria-labelledby="ubah-role-title">
        <h3 id="ubah-role-title" className="font-black text-slate-900 text-lg">Ubah Role Pengguna</h3>
        <div><p className="text-sm font-bold text-slate-700">{user.name}</p><p className="text-xs text-slate-500 mb-3">{user.username}</p><label className="text-[10px] font-black text-slate-500 uppercase" htmlFor="edit-role-select">Role Baru</label><select id="edit-role-select" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm mt-1">{roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div className="flex gap-3 justify-end"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button><button type="button" onClick={() => roleMutation.mutate({ id: user.id, role: editRole })} disabled={roleMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-black hover:bg-cyan-700 disabled:opacity-50">Simpan</button></div>
      </div>
    </div>
  );
}
