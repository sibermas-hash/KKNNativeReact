import { api } from '@/lib/api';

type EchoInstance = {
  private: (channel: string) => { listen: (event: string, cb: (payload: unknown) => void) => unknown };
  leave: (channel: string) => void;
  disconnect: () => void;
};

let echoPromise: Promise<EchoInstance | null> | null = null;

export function getEcho(): Promise<EchoInstance | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (echoPromise) return echoPromise;

  echoPromise = (async () => {
    try {
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
      ]);

      (window as unknown as { Pusher?: unknown }).Pusher = Pusher;
      const host = process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname;
      const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
      const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || (window.location.protocol === 'https:' ? 'https' : 'http');

      return new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'sibermas-local-key',
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: ((channel: { name: string }) => ({
          authorize: (socketId: string, callback: (error: Error | null, data?: unknown) => void) => {
            api.post('/../broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
              .then((res) => callback(null, res.data))
              .catch((error) => callback(error as Error, null));
          },
        })) as unknown as never,
      }) as EchoInstance;
    } catch (error) {
      console.warn('[realtime] disabled', error);
      return null;
    }
  })();

  return echoPromise;
}
