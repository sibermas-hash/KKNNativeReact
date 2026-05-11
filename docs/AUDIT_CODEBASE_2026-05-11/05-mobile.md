# 05 — Mobile (Expo 53)

## Overview

- **Framework**: Expo 53, React Native 0.79, expo-router 5.1 (typed routes)
- **Platform target**: Android + iOS (tested more on Android via `build-android.sh`)
- **Bundle ID**: `ac.id.uinsaizu.kkn`
- **App name/slug**: SIBERMAS / `sibermas`
- **URL scheme**: `sibermas://`

## Struktur Direktori

```
apps/mobile/
├── app/                          # expo-router routes
│   ├── _layout.tsx               # Root layout, auth routing, push setup
│   ├── index.tsx                 # Entry redirect
│   ├── unsupported.tsx           # Role unsupported screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                   # Student role
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Dashboard
│   │   ├── activities.tsx
│   │   ├── reports/{create, final, [id]}
│   │   ├── registration/{index, documents}
│   │   ├── work-programs/
│   │   ├── poster/
│   │   ├── posko/
│   │   ├── leave-requests.tsx
│   │   ├── evaluation.tsx
│   │   ├── certificate.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   └── (dpl-tabs)/               # DPL role
│       ├── _layout.tsx
│       ├── index.tsx             # DPL dashboard
│       ├── groups.tsx
│       ├── reports.tsx, reports/[id]
│       ├── monitoring.tsx
│       ├── leave-requests.tsx
│       ├── final-reports.tsx
│       ├── notifications.tsx
│       └── profile.tsx
├── components/                   # Splash, error boundary, etc.
├── lib/
│   ├── api.ts                    # Axios client + SecureStore token
│   ├── offlineQueue.ts           # AsyncStorage queue for daily reports
│   ├── sentry.ts                 # Sentry init
│   ├── query-client.ts           # TanStack Query client + AppState bridge
│   ├── notifications.ts          # Push notification setup
│   ├── error-messages.ts
│   └── constants.ts
├── stores/                       # Zustand auth store
├── assets/
├── android/                      # Native build
├── ios/                          # Native build
├── app.config.ts                 # Expo config
├── package.json
└── tsconfig.json
```

## App Config (`app.config.ts`)

### Permissions (Android)
```
CAMERA
WRITE_EXTERNAL_STORAGE
READ_EXTERNAL_STORAGE
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
INTERNET
VIBRATE
RECEIVE_BOOT_COMPLETED
```

### iOS Info.plist
- `NSCameraUsageDescription` — bukti kegiatan
- `NSPhotoLibraryUsageDescription` — upload foto
- `NSLocationWhenInUseUsageDescription` — pencatatan kehadiran
- `NSLocationAlwaysAndWhenInUseUsageDescription` — same

### Expo Plugins
- `expo-router`
- `expo-secure-store`
- `expo-location`
- `expo-camera`
- `expo-image-picker`
- `expo-notifications`
- `@sentry/react-native/expo` (native crash symbolication)

## Authentication

### Storage
Access token disimpan di **`expo-secure-store`** (iOS Keychain / Android Keystore).

### Getter
```typescript
async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

export const api = createMobileClient(getToken, API_URL);
```

Token header `Authorization: Bearer <token>` diinject oleh `@sibermas/api-client`'s mobile client.

### Flow
1. User login via `(auth)/login.tsx` → POST `/auth/login` dengan `X-App-Type: mobile`.
2. Backend response `{token, user}` Bearer.
3. `storeToken(token)` → SecureStore.
4. Subsequent calls auto-attach bearer via axios interceptor.
5. Logout → `removeToken()` + POST `/auth/logout`.

### 2FA Support
**Perlu verifikasi**: Audit tidak melihat eksplisit 2FA flow di mobile login. Kemungkinan belum diimplementasikan. Jika admin/DPL login via mobile, mereka akan stuck di `TWO_FACTOR_REQUIRED` 423 response tanpa UI challenge screen.

## Role-based Routing (`_layout.tsx`)

```typescript
if (!isAuthenticated) redirect('/(auth)/login');

const isDpl = isDplLikeUser(user);
const isStudent = isStudentLikeUser(user);
const homeRoute = getMobileHomeRoute(user);

// Redirect root / unsupported ke homeRoute
// Blokir lintas-group access
if (pathname.startsWith('/(tabs)') && !isStudent) redirect(homeRoute);
if (pathname.startsWith('/(dpl-tabs)') && !isDpl) redirect(homeRoute);
```

Loop prevention via `lastRedirectRef`.

## Offline Queue (`lib/offlineQueue.ts`)

**Use case**: Mahasiswa input laporan harian di desa tanpa signal → queue ke AsyncStorage, sync saat online.

### API
```typescript
enqueueReport(item)       // Tambah ke queue
getQueue()                // Read all
clearQueue()              // Clear
processQueue(api)         // Flush ke server
```

### Process Logic
1. Singleton guard: `activeQueueRun` promise mencegah concurrent processes.
2. Build FormData per item (title, activity, reflection, date, captured_at, location_source='gps', category='administrasi', abcd_stage='reflection', lat/lng).
3. `api.post('/student/daily-reports', formData, {multipart})`.
4. Success → remove from queue.
5. Failed → retain in queue untuk retry.
6. Merge: kalau ada item baru di queue setelah processing dimulai, tidak overwrite.

### Trigger
- Di `_layout.tsx`: NetInfo listener saat `isConnected && isInternetReachable`.
- Fire `processQueue(api)` di background.

## Push Notifications

`lib/notifications.ts` + `_layout.tsx`:
1. `setupAndroidChannels()` — create Expo notification channels.
2. `registerForPushNotifications()` — get Expo push token.
3. POST ke `/device-tokens` dengan `{token, platform, device_id}`.
4. Listen `Notifications.addNotificationReceivedListener` dan `ResponseReceivedListener`.
5. Dedupe via `registeredPushUserRef` — register once per user ID.

## Sentry

`lib/sentry.ts`:
- DSN via `EXPO_PUBLIC_SENTRY_DSN`, no-op kalau kosong.
- `environment` via `EXPO_PUBLIC_SENTRY_ENV` atau `__DEV__ ? 'development' : 'production'`.
- `release` dari `EXPO_PUBLIC_APP_VERSION` atau `expoConfig.version`.
- `tracesSampleRate`: 0.1 production, 1.0 dev.
- `sendDefaultPii: false`.
- `beforeSend` drops 401 errors (noisy for logout flow).

## TanStack Query

`lib/query-client.ts`:
- `useQueryAppStateBridge()` — pause/resume query fetches based on AppState (foreground/background).

## Testing

**NONE**. Tidak ada Jest/Vitest config. Tidak ada `__tests__/`.

Areas yang sangat butuh test:
1. `offlineQueue.ts` — state machine, merge logic, concurrent run guard.
2. Auth store login/logout/fetchUser flow.
3. `isStudentLikeUser`, `isDplLikeUser`, `getMobileHomeRoute` helpers.
4. API interceptor (token attach, 401 handling).

## Build

### Android
```bash
./build-android.sh       # Gradle build
./start-android.sh       # Install + start on device
./logs-android.sh        # adb logcat tail
./setup-android-env.sh   # One-time setup
```

`apps/mobile/android/app/build/` terlihat sudah pernah di-run (artifacts present). Folder ini **harus** di `.gitignore` (sudah).

### iOS
```bash
npx expo prebuild --platform ios
npx expo run:ios
```

## Environment

`.env.example`:
```
EXPO_PUBLIC_API_URL=https://sibermas.uinsaizu.ac.id/api/v1
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENV=production
EXPO_PUBLIC_APP_VERSION=
```

`EXPO_PUBLIC_*` inline ke JS bundle di build time. DSN aman di client (by design).

## Temuan Mobile

| ID | Severity | Temuan |
|---|---|---|
| M-NEW-002 | Medium | Test coverage 0 |
| L-NEW-007 | Low | `LogBox.ignoreLogs(['Maximum update depth exceeded'])` menyembunyikan warning nyata |
| Question | - | 2FA flow di mobile: belum verified; jika role privileged login, stuck di 423 tanpa UI |

## Rekomendasi

1. **Setup Jest + @testing-library/react-native**. Minimal tests untuk offline queue, auth store, role helpers.
2. **Implement 2FA challenge screen** di mobile — handle 423 response dengan UI TOTP input.
3. **Evaluasi LogBox.ignoreLogs** — tambahkan TODO dengan expiry date + GitHub issue link dari upstream expo-router. Remove saat upgrade.
4. **Biometric re-auth** — sensitive action (submit laporan final, setujui bimbingan) bisa dilindungi `expo-local-authentication` untuk Face ID / fingerprint.
5. **App update notification** — kalau API return version mismatch, prompt user update dari Play Store.
