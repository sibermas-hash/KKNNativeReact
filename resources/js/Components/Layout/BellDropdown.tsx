import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import { BellIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface NotificationItem {
 id: string;
 type: string;
 title: string;
 message: string;
 action: string | null;
 priority: string;
 created_at: string;
}

const priorityDot: Record<string, string> = {
 success: 'bg-emerald-400',
 warning: 'bg-amber-400',
 error: 'bg-red-400',
 info: 'bg-blue-400',
};

export default function BellDropdown() {
 const [open, setOpen] = useState(false);
 const [items, setItems] = useState<NotificationItem[]>([]);
 const [count, setCount] = useState(0);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const fetchNotifications = async () => {
 try {
 const { data } = await axios.get(route('api.notifications.unread'));
 setItems(data.notifications ?? []);
 setCount(data.unread_count ?? 0);
 } catch {
 // biarkan senyap pada tampilan
 }
 };

 fetchNotifications();
 const intervalId = window.setInterval(fetchNotifications, 60_000);

 return () => window.clearInterval(intervalId);
 }, []);

 useEffect(() => {
 const handleOutsideClick = (event: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };

 document.addEventListener('mousedown', handleOutsideClick);
 return () => document.removeEventListener('mousedown', handleOutsideClick);
 }, []);

 const markRead = async (id: string) => {
 try {
 await axios.post(`/api/notifications/${id}/read`);
 setItems((current) => current.filter((item) => item.id !== id));
 setCount((current) => Math.max(0, current - 1));
 } catch {
 // abaikan kegagalan sementara
 }
 };

 const markAllRead = async () => {
 try {
 await axios.post('/api/notifications/read-all');
 setItems([]);
 setCount(0);
 } catch {
 // abaikan kegagalan sementara
 }
 };

 return (
 <div ref={containerRef} className="relative">
 <button
 type="button"
 onClick={() => setOpen((current) => !current)}
 className={`relative rounded-lg p-2.5 transition ${
 open ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
 }`}
 >
 <BellIcon className="h-5 w-5" />
 {count > 0 && (
 <span className="absolute right-1.5 top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
 {count > 99 ? '99+' : count}
 </span>
 )}
 </button>

 {open && (
 <div
 className="absolute right-0 top-14 z-[100] w-80 overflow-hidden rounded-lg border border-white/10 shadow-2xl"
 style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)' }}
 >
 <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-semibold text-white">Notifikasi</h3>
 {count > 0 && (
 <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
 {count > 99 ? '99+' : count}
 </span>
 )}
 </div>

 {count > 0 && (
 <button
 type="button"
 onClick={markAllRead}
 className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200"
 >
 <CheckBadgeIcon className="h-4 w-4" />
 Tandai semua
 </button>
 )}
 </div>

 <div className="max-h-96 overflow-y-auto">
 {items.length > 0 ? (
 items.map((item) => (
 <div key={item.id} className="border-b border-white/5 px-5 py-4">
 <div className="flex gap-3">
 <span
 className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
 priorityDot[item.priority] ?? 'bg-blue-400'
 }`}
 />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-white">{item.title}</p>
 <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.message}</p>
 <div className="mt-3 flex items-center justify-between gap-3">
 <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
 <ClockIcon className="h-3.5 w-3.5" />
 {item.created_at}
 </span>
 <div className="flex items-center gap-3">
 {item.action && (
 <a
 href={item.action}
 onClick={() => markRead(item.id)}
 className="text-[11px] font-medium text-blue-300 hover:text-blue-200"
 >
 Lihat
 </a>
 )}
 <button
 type="button"
 onClick={() => markRead(item.id)}
 className="text-[11px] font-medium text-slate-400 hover:text-white"
 >
 Tandai dibaca
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="px-5 py-8 text-center">
 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60">
 <BellIcon className="h-6 w-6 text-slate-500" />
 </div>
 <p className="mt-3 text-sm font-medium text-slate-300">Belum ada notifikasi baru</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
