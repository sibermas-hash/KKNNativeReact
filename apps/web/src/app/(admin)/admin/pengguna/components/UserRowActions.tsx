'use client';

import { Ban, CheckCircle2, ChevronDown, KeyRound, PencilLine, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

type MenuPosition = { top: number; left: number; width: number };

export function UserRowActions({ user: u, currentUserId, toggleMutation, onEdit, onRole, onReset }: Props) {
  const selfActive = u.id === currentUserId && !!u.is_active;
  const togglePending = toggleMutation.isPending && toggleMutation.variables === u.id;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const closeMenu = () => setOpen(false);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 192;
    const menuHeight = 184;
    const below = rect.bottom + 8;
    const top = below + menuHeight > window.innerHeight - 12 ? Math.max(12, rect.top - menuHeight - 8) : below;
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
    setPosition({ top, left, width });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const handleReposition = () => updatePosition();
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const menu = open && position ? createPortal(
    <div ref={menuRef} style={{ top: position.top, left: position.left, width: position.width }} className="fixed z-[80] overflow-hidden rounded-2xl bg-white p-1.5 text-left shadow-2xl ring-1 ring-slate-200">
      <button onClick={() => { onEdit(u); closeMenu(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"><PencilLine size={14} /> Edit data</button>
      <button onClick={() => { onRole(u); closeMenu(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Shield size={14} /> Ubah role</button>
      <button onClick={() => { onReset(u); closeMenu(); }} title="Reset password ke default DDMMYYYY dari tanggal lahir" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"><KeyRound size={14} /> Reset password</button>
      <div className="my-1 h-px bg-slate-100" />
      <button onClick={() => { toggleMutation.mutate(u.id); closeMenu(); }} disabled={togglePending || selfActive} title={selfActive ? 'Akun Anda sendiri tidak dapat dinonaktifkan.' : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50 ${u.is_active ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
        {u.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />} {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} data-menu="user-row-actions" className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase text-white shadow-sm hover:bg-cyan-700">
        Aksi <ChevronDown size={13} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
