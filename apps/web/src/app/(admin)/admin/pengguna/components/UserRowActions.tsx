import { Ban, CheckCircle2, ChevronDown, KeyRound, PencilLine, Shield } from 'lucide-react';
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
  const selfActive = u.id === currentUserId && !!u.is_active;
  const togglePending = toggleMutation.isPending && toggleMutation.variables === u.id;

  const closeMenu = (target: HTMLElement) => {
    target.closest('details')?.removeAttribute('open');
  };

  return (
    <details className="group relative inline-block text-left">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase text-white shadow-sm hover:bg-cyan-700 [&::-webkit-details-marker]:hidden">
        Aksi <ChevronDown size={13} className="transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl bg-white p-1.5 text-left shadow-xl ring-1 ring-slate-200">
        <button onClick={(e) => { onEdit(u); closeMenu(e.currentTarget); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"><PencilLine size={14} /> Edit data</button>
        <button onClick={(e) => { onRole(u); closeMenu(e.currentTarget); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Shield size={14} /> Ubah role</button>
        <button onClick={(e) => { onReset(u); closeMenu(e.currentTarget); }} title="Reset password ke default DDMMYYYY dari tanggal lahir" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"><KeyRound size={14} /> Reset password</button>
        <div className="my-1 h-px bg-slate-100" />
        <button onClick={(e) => { toggleMutation.mutate(u.id); closeMenu(e.currentTarget); }} disabled={togglePending || selfActive} title={selfActive ? 'Akun Anda sendiri tidak dapat dinonaktifkan.' : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50 ${u.is_active ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          {u.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />} {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>
    </details>
  );
}
