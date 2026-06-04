import { Ban, CheckCircle2, KeyRound, PencilLine, Shield } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from '../lib/user-types';

type Props = {
  user: User;
  currentUserId?: number;
  toggleMutation: UseMutationResult<unknown, unknown, number>;
  onEdit: (user: User) => void;
  onRole: (user: User) => void;
  onReset: (user: User) => void;
};

export function UserRowActions({ user: u, currentUserId, toggleMutation, onEdit, onRole, onReset }: Props) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button onClick={() => toggleMutation.mutate(u.id)} disabled={(toggleMutation.isPending && toggleMutation.variables === u.id) || (u.id === currentUserId && !!u.is_active)} title={u.id === currentUserId && u.is_active ? 'Akun Anda sendiri tidak dapat dinonaktifkan.' : undefined} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black disabled:opacity-50 ${u.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-100'}`}>
        {u.is_active ? <Ban size={13} /> : <CheckCircle2 size={13} />} {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      <button onClick={() => onEdit(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-cyan-50 text-cyan-700 hover:bg-cyan-100 ring-1 ring-cyan-100"><PencilLine size={13} /> Edit</button>
      <button onClick={() => onRole(u)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200"><Shield size={13} /> Role</button>
      <button onClick={() => onReset(u)} title="Reset password ke default DDMMYYYY dari tanggal lahir" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-100 disabled:opacity-50"><KeyRound size={13} /> Reset</button>
    </div>
  );
}
