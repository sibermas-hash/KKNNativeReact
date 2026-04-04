import { useState, useEffect, useRef } from 'react'
import { BellIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface NotifItem {
 id: string; type: string; title: string; message: string
 action: string | null; priority: string; created_at: string
}

const priorityDot: Record<string, string> = {
 success: 'bg-emerald-400',
 warning: 'bg-amber-400',
 error: 'bg-red-400',
 info: 'bg-blue-400',
}

export default function BellDropdown() {
 const [open, setOpen] = useState(false)
 const [items, setItems] = useState<NotifItem[]>([])
 const [count, setCount] = useState(0)
 const ref = useRef<HTMLDivElement>(null)

 // Polling setiap 60 detik (ringan)
 useEffect(() => {
 const fetch = async () => {
 try {
 const { data } = await axios.get('/api/notifications/unread')
 setItems(data.notifications)
 setCount(data.unread_count)
 } catch { /* silent fail */ }
 }
 fetch()
 const id = setInterval(fetch, 60_000)
 return () => clearInterval(id)
 }, [])

 // Close on outside click
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
 }
 document.addEventListener('mousedown', handler)
 return () => document.removeEventListener('mousedown', handler)
 }, [])

 const markRead = async (id: string) => {
 await axios.post(`/api/notifications/${id}/read`)
 setItems(prev => prev.filter(n => n.id !== id))
 setCount(prev => Math.max(0, prev - 1))
 }

 const markAllRead = async () => {
 await axios.post('/api/notifications/read-all')
 setItems([])
 setCount(0)
 }

 return (
 <div ref={ref} className="relative">
 {/* Bell button */}
 <button onClick={() => setOpen(o => !o)}
 className={`relative p-2.5 rounded-lg active:
 ${open ? 'bg-white/10 text-white : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
 <BellIcon className="w-5 h-5" />
 {count > 0 && (
 <span className="absolute top-2 right-2 flex h-2 w-2">
 <span className=></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
 </span>
 )}
 </button>

 {/* Dropdown */}
 {open && (
 <div className="absolute right-0 top-14 w-80 z-[100] rounded-lg border border-white/10
 overflow-hidden glass-ui zoom-in-95"
 style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)' }}>

 {/* Header */}
 <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
 <h3 className="text-white text-xs font-semibold uppercase 
 Notifikasi
 {count > 0 && (
 <span className="ml-2 px-2 py-0.5 rounded-md bg-red-500/20 text-red-500 text-[10px] font-semibold">
 {count > 99 ? '99+' : count}
 </span>
 )}
 </h3>
 {count > 0 && (
 <button onClick={markAllRead}
 className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase flex items-center gap-1">
 <CheckBadgeIcon className="w-3 h-3" /> Tandai semua dibaca
 </button>
 )}
 </div>

 {/* Items */}
 <div className="max-h-96 overflow-y-auto custom-scrollbar">
 {items.length === 0 ? (
 <div className="py-6 text-center">
 <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
 <BellIcon className="w-6 h-6 text-slate-600" />
 </div>
 <p className="text-slate-500 text-xs font-medium">Belum ada notifikasi baru</p>
 </div>
 ) : items.map(item => (
 <div key={item.id}
 className="px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-colors flex gap-4 group">
 <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5
 ${priorityDot[item.priority] ?? 'bg-blue-400'}`} />
 <div className="flex-1 min-w-0">
 <p className="text-white text-[12px] font-semibold leading-tight 
 <p className="text-slate-400 text-[11px] mt-1 leading-relaxed line-clamp-2 font-medium">
 {item.message}
 </p>
 <div className="flex items-center justify-between mt-3">
 <span className="text-slate-600 text-[10px] font-bold flex items-center gap-1">
 <ClockIcon className="w-3 h-3" />
 {item.created_at}
 </span>
 <div className="flex gap-3">
 {item.action && (
 <a href={item.action}
 onClick={() => markRead(item.id)}
 className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 uppercase 
 Lihat →
 </a>
 )}
 <button onClick={() => markRead(item.id)}
 className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase 
 Tandai dibaca
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="px-6 py-3 border-t border-white/5 bg-white/2">
 <button className="w-full text-center text-[10px] font-semibold text-slate-500 hover:text-white transition-colors uppercase 
 Lihat arsip notifikasi
 </button>
 </div>
 </div>
 )}

 <style>{`
 .custom-scrollbar::-webkit-scrollbar {
 width: 4px;
 }
 .custom-scrollbar::-webkit-scrollbar-track {
 background: transparent;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb {
 background: rgba(255, 255, 255, 0.05);
 border-radius: 10px;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
 background: rgba(255, 255, 255, 0.1);
 }
 `}</style>
 </div>
 )
}
