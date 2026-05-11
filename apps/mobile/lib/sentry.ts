/**
 * Sentry initialization for mobile.
 *
 * Environment contract:
 *   - EXPO_PUBLIC_SENTRY_DSN      — DSN; if missing, Sentry is disabled (no-op)
 *   - EXPO_PUBLIC_SENTRY_ENV      — 'production' | 'staging' | 'development'
 *   - EXPO_PUBLIC_APP_VERSION     — optional, falls back to app.config version
 *
 * Call `initSentry()` exactly once at app boot — before `Stack`/`App` renders —
 * and pass `Sentry.captureException` into any error boundary / global handler.
 *
 * We keep this file tiny on purpose: adding more config (breadcrumb filters,
 * PII redaction, custom context) belongs here so grep always finds it.
 */
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // No DSN configured — run as a no-op so dev builds don't spam a bogus
    // endpoint and so tests stay deterministic.
    return;
  }

  const env = process.env.EXPO_PUBLIC_SENTRY_ENV || (__DEV__ ? 'development' : 'production');
  const release = process.env.EXPO_PUBLIC_APP_VERSION
    || (Constants.expoConfig?.version ?? 'unknown');

  Sentry.init({
    dsn,
    environment: env,
    release,
    // 10% trace sampling in production is a reasonable default for a
    // student-grade app; bump if you're investigating something specific.
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    // Never send request bodies — they may contain PII (addresses, NIK, etc).
    sendDefaultPii: false,
    attachStacktrace: true,
    enableAutoSessionTracking: true,
    // Drop common noise: DevTools overlays + expected logout 401s.
    beforeSend(event) {
      const msg = event.message ?? event.exception?.values?.[0]?.value ?? '';
      if (typeof msg === 'string' && /401|Request failed with status code 401/i.test(msg)) {
        return null;
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Re-export a safe `captureException` that never throws even if Sentry failed
 * to initialize (missing DSN, network error during init). Callers can rely on
 * it unconditionally.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    // Last-resort fallback. Swallowing here is intentional: losing one
    // Sentry event is strictly better than crashing the crash-reporter.
  }
}
