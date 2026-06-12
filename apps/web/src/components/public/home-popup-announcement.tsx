'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X, Megaphone, Clock } from 'lucide-react';

interface PopupPayload {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  image_url?: string | null;
  published_at?: string | null;
  popup_until?: string | null;
  popup_dismissable: boolean;
  read_more_url?: string;
  updated_at?: string | null;
}

const LOCAL_STORAGE_PREFIX = 'sibermas_popup_dismissed_v1_';

function isPermanentlyDismissed(id: number, updatedAt?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = LOCAL_STORAGE_PREFIX + id + (updatedAt ? '_' + updatedAt : '');
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setPermanentlyDismissed(id: number, updatedAt?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = LOCAL_STORAGE_PREFIX + id + (updatedAt ? '_' + updatedAt : '');
    window.localStorage.setItem(key, '1');
  } catch {
    /* quota / privacy mode — silent failure acceptable */
  }
}

/**
 * Home popup announcement modal.
 *
 * Behavior:
 *   - Fetches `/public/popup-announcement` on mount; shows nothing if the
 *     endpoint returns null (i.e. admin has no active popup).
 *   - If the user previously clicked "Jangan ingatkan lagi" for THIS id,
 *     the popup stays hidden permanently on this device (localStorage).
 *     Refresh / new tab / new session = still hidden.
 *   - Close (X button or backdrop click): hide for this session only.
 *     Next refresh = reappears. This is intentional — lets admin resurface
 *     truly urgent messages even to users who auto-dismissed.
 *   - `popup_dismissable=false` (admin choice): hides the opt-out button.
 *     User can still close via X, but every refresh re-surfaces. Used for
 *     emergency notices.
 */
export function PopupAnnouncement(): React.JSX.Element | null {
  const [open, setOpen] = useState(false);

  const { data } = useQuery<PopupPayload | null>({
    queryKey: ['public', 'popup-announcement'],
    queryFn: async () => {
      try {
        // Audit fix (2026-05-13): localhost fallback dihapus — kalau env
        // tidak set di build prod, gagal eksplisit (return null) lebih baik
        // daripada hit `localhost:8000` dari browser user. Operator akan
        // melihat "popup tidak muncul" dan investigate; vs sekarang silent
        // 4xx ke localhost yang gagal silent.
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('NEXT_PUBLIC_API_URL not set — popup announcement disabled.');
          }
          return null;
        }
        const res = await fetch(`${apiBase}/public/popup-announcement`, {
          credentials: 'omit',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return null;
        const body: unknown = await res.json();
        if (!body || typeof body !== 'object') return null;
        const payload = body as { data: PopupPayload | null };
        return payload.data ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
    retry: 0,
  });

  // Auto-open when data arrives + not permanently dismissed.
  useEffect(() => {
    if (!data) return;
    if (isPermanentlyDismissed(data.id, data.updated_at)) return;
    setOpen(true);
  }, [data]);

  if (!data) return null;

  const handleDismissForever = () => {
    setPermanentlyDismissed(data.id, data.updated_at);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby="popup-announcement-body"
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95"
        >
          {data.image_url && (
            <div className="h-40 w-full overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Megaphone size={18} />
              </span>
              <div className="flex-1 min-w-0">
                {data.category && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                    {data.category}
                  </p>
                )}
                <Dialog.Title className="mt-0.5 text-lg font-bold text-slate-900 leading-tight">
                  {data.title}
                </Dialog.Title>
              </div>
              <Dialog.Close
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup"
              >
                <X size={18} />
              </Dialog.Close>
            </div>

            {data.excerpt && (
              <p id="popup-announcement-body" className="text-sm text-slate-600 leading-relaxed">
                {data.excerpt}
              </p>
            )}

            {data.popup_until && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} />
                Berlaku sampai {new Date(data.popup_until).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {data.read_more_url && (
                <Link
                  href={data.read_more_url}
                  className="flex-1 min-w-[120px] rounded-xl bg-cyan-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-cyan-700"
                  onClick={() => setOpen(false)}
                >
                  Baca selengkapnya
                </Link>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 min-w-[100px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

            {data.popup_dismissable && (
              <button
                type="button"
                onClick={handleDismissForever}
                className="block w-full text-center text-[11px] text-slate-400 hover:text-slate-600 pt-1"
              >
                Jangan ingatkan saya lagi
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
