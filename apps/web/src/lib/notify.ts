/**
 * Notification popup helpers.
 *
 * Two layers of surfacing a freshly-arrived notification:
 *
 *   1. In-app toast (always on) — uses sonner. Priority-colored, with an
 *      optional "Buka" action button that navigates to the notification's
 *      action URL. Survives page transitions within the same tab.
 *
 *   2. Desktop Notification API (opt-in) — fires ONLY when the tab is
 *      hidden and the user has previously granted OS-level permission.
 *      Without this, a backgrounded user has no visibility until they
 *      re-focus the tab.
 *
 * Deduplication is the caller's responsibility — pass a `seenIds` Set to
 * `showNotificationPopup` and we'll skip IDs that were already shown.
 */

import { toast } from 'sonner';

export interface NotificationPopupData {
  id: string;
  title?: string;
  message?: string;
  priority?: 'info' | 'success' | 'warning' | 'danger' | string;
  action?: string | null;
}

interface ShowOptions {
  seenIds?: Set<string>;
  onAction?: (action: string) => void;
  enableDesktop?: boolean;
}

export function showNotificationPopup(n: NotificationPopupData, opts: ShowOptions = {}): void {
  const { seenIds, onAction, enableDesktop = false } = opts;

  if (!n.id) return;
  if (seenIds?.has(n.id)) return;
  seenIds?.add(n.id);

  const priority = (n.priority ?? 'info') as 'info' | 'success' | 'warning' | 'danger';

  // ── In-app toast ──────────────────────────────────────────────────
  const fn =
    priority === 'danger' ? toast.error :
    priority === 'warning' ? toast.warning :
    priority === 'success' ? toast.success :
    toast;

  fn(n.title ?? 'Notifikasi', {
    description: n.message,
    duration: priority === 'danger' ? 10_000 : 6_000,
    action: n.action && onAction
      ? { label: 'Buka', onClick: () => onAction(n.action as string) }
      : undefined,
  });

  // ── Desktop Notification API (only when tab hidden + permission granted) ─
  if (!enableDesktop) return;
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (document.visibilityState !== 'hidden') return;
  if (Notification.permission !== 'granted') return;

  try {
    const desktop = new Notification(n.title ?? 'Notifikasi', {
      body: n.message ?? '',
      icon: '/logo_kkn.png',
      tag: n.id, // collapses duplicate notifications with the same id
      badge: '/favicon.ico',
    });

    if (n.action && onAction) {
      desktop.onclick = () => {
        window.focus();
        onAction(n.action as string);
        desktop.close();
      };
    }
  } catch {
    // Notification constructor can throw in edge browsers (e.g. Firefox
    // private windows). Non-critical — the toast already fired.
  }
}

/**
 * Current state of the desktop Notification API for UI display.
 *
 *   'unsupported'   — browser lacks the API entirely
 *   'not-asked'     — Notification.permission === 'default'
 *   'granted'       — user allowed desktop popups
 *   'denied'        — user blocked. Cannot re-prompt programmatically;
 *                     user must re-enable via browser settings.
 */
export type DesktopPermission = 'unsupported' | 'not-asked' | 'granted' | 'denied';

export function desktopPermissionState(): DesktopPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  const p = Notification.permission;
  if (p === 'granted') return 'granted';
  if (p === 'denied')  return 'denied';
  return 'not-asked';
}

/**
 * Ask the browser for desktop notification permission. Resolves with the
 * final state (same enum as `desktopPermissionState`). Safe to call
 * repeatedly — once denied, the browser silently rejects without prompting
 * again.
 */
export async function requestDesktopPermission(): Promise<DesktopPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') return 'granted';
    if (result === 'denied')  return 'denied';
    return 'not-asked';
  } catch {
    return 'denied';
  }
}
