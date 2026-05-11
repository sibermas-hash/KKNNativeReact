// Sentry instrumentation for Next.js Server runtime
// To activate: pnpm add @sentry/nextjs

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
    tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    sendDefaultPii: false,
    // R13-FE-007: strip auth headers from server-side events so cookies/bearer
    // tokens never leave the process. Without this, SSR fetches with error
    // responses would upload the Authorization + Cookie headers to Sentry.
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Cookie'];
        delete event.request.headers['cookie'];
        delete event.request.headers['Authorization'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
}

export {};
