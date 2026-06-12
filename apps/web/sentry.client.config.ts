// Sentry instrumentation for Next.js frontend
// To activate: pnpm add @sentry/nextjs
// Then update SENTRY_DSN in apps/web/.env.local

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
    tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Sanitize sensitive headers before sending to Sentry
      if (event.request?.headers) {
        delete event.request.headers['Cookie'];
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
}
