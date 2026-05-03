You are a senior software engineer finalizing the SIBERMAS project
before manual testing. All critical bugs have been fixed.
Your job is to complete the remaining deferred tasks that do NOT
require a running server or physical device.

Read the current codebase state before touching anything.
Do not fix what already works.
Do not break what is already passing (52 tests, 169 endpoints).

---

## CURRENT STATE (verified by previous fix pass)

✅ 52 Pest tests passing (109 assertions)
✅ 169 API endpoints active
✅ 0 Inertia references in API layer or middleware
✅ 0 active web routes (health check only)
✅ 4 CI/CD workflows created
✅ PublicController with 6 endpoints created
⚠️ 18 LEGACY controllers still exist (marked but not deleted)
🔲 SSG/ISR: public pages still 'use client' (deferred)
🔲 Push notifications: not scaffolded yet (deferred)
🔲 Mobile GPS: expo-location not wired to screens (deferred)

---

## TASK 1 — REMOVE 18 LEGACY CONTROLLERS

These controllers were marked // LEGACY in the previous fix pass.
They are safe to remove now that web routes are gone (0 active web routes).

What to do:

1. List all files with // LEGACY comment
2. For each: grep routes/web.php routes/api.php for any reference
3. If zero references found → delete the file
4. If a reference still exists → keep, note which route still uses it
5. After deletions: run php artisan route:list to confirm no broken refs
6. Run php artisan test → must still be 52 tests passing

---

## TASK 2 — SSG/ISR PUBLIC PAGES (Next.js)

All public pages in apps/web/src/app/(public)/ are currently
'use client' components fetching data client-side.
Convert them to server components with ISR.

Before touching any file:

1. Read the current implementation of each page
2. Check if it uses any browser APIs (window, localStorage, etc.)
   that would prevent server rendering
3. Only convert if safe to do so

Convert each page:

apps/web/src/app/(public)/page.tsx — Home

- Remove 'use client'
- Make component async
- Fetch from GET /api/v1/public/home using fetch() server-side
- Add: export const revalidate = 3600
- Add: export async function generateMetadata() returning
  title, description, og:title, og:description, og:url
- Create loading.tsx: simple skeleton layout
- Create error.tsx: friendly Bahasa Indonesia error message

apps/web/src/app/(public)/berita/page.tsx — Announcements list

- Same pattern
- export const revalidate = 1800
- generateMetadata(): title "Berita & Pengumuman — SIBERMAS UIN SAIZU"
- loading.tsx + error.tsx

apps/web/src/app/(public)/berita/[slug]/page.tsx — Announcement detail

- Same pattern
- export const revalidate = 1800
- generateStaticParams(): fetch announcement slugs for pre-rendering
- generateMetadata({ params }): fetch announcement by slug,
  return title, description from announcement data
- loading.tsx + error.tsx

apps/web/src/app/(public)/unduhan/page.tsx — Downloads

- Same pattern
- export const revalidate = 3600
- generateMetadata()
- loading.tsx + error.tsx

apps/web/src/app/(public)/lokasi/page.tsx — Locations

- Same pattern
- export const revalidate = 86400
- generateMetadata()
- loading.tsx + error.tsx
- NOTE: if this page uses react-leaflet or any map library that
  requires browser APIs → keep the map component as 'use client'
  but wrap it: server component fetches data, passes to client map component
  This is the correct Next.js pattern for maps

apps/web/src/app/(public)/verify-certificate/[token]/page.tsx

- Make async server component
- NO revalidate: use fetch(url, { cache: 'no-store' })
- generateMetadata(): generic title only (do not expose certificate data in meta)
- loading.tsx + error.tsx

Rules for all conversions:

- Never use useEffect, useState, or hooks in server components
- Never use TanStack Query in server components
- API_URL must come from process.env.API_URL (server-side env, no NEXT_PUBLIC_)
  Create a separate server-side env var: API_URL (internal URL to Laravel)
  Keep NEXT_PUBLIC_API_URL for client components
- All fetch() calls must handle network errors gracefully
- If Laravel API is not reachable during build:
  catch the error and return empty data (do not crash the build)

---

## TASK 3 — PUSH NOTIFICATION SCAFFOLD

(no device needed — code only, not functional until tested on device)

Read apps/mobile/ structure completely before starting.

Create apps/mobile/lib/notifications.ts:

registerForPushNotifications():

- Check Platform.OS and Constants.isDevice
- If not physical device: return null with console.warn
- Request permission via Notifications.requestPermissionsAsync()
- If denied: return null
- Get token via Notifications.getExpoPushTokenAsync()
  projectId from Constants.expoConfig?.extra?.eas?.projectId
- Return token string

setupAndroidChannels():

- Only runs on Android (Platform.OS === 'android')
- Channel 1: id='reports', name='Laporan KKN',
  importance=Notifications.AndroidImportance.HIGH
- Channel 2: id='announcements', name='Pengumuman',
  importance=Notifications.AndroidImportance.DEFAULT
- Channel 3: id='grades', name='Nilai & Sertifikat',
  importance=Notifications.AndroidImportance.HIGH

handleNotificationReceived(notification: Notifications.Notification):

- Log notification title and body
- Return void (navigation logic added later)

handleNotificationResponse(response: Notifications.NotificationResponse):

- Extract screen from response.notification.request.content.data
- Log for now — comment: // TODO: navigate to screen in Phase 6

Update apps/mobile/app/_layout.tsx:

- Import notifications lib
- On mount (useEffect with []):
  1. setupAndroidChannels()
  2. const token = await registerForPushNotifications()
  3. If token: call api endpoint to register device token
     POST /api/v1/notifications/register-device
     body: { token, platform: Platform.OS, device_id: Application.androidId or Device.deviceName }
  4. Set up listener: Notifications.addNotificationReceivedListener
  5. Set up listener: Notifications.addNotificationResponseReceivedListener
- Cleanup: remove both listeners on unmount

Add to apps/mobile/package.json if not present:

- expo-notifications
- expo-application  
- expo-device

Update apps/mobile/app.config.ts:

- Add plugins: ['expo-notifications']
- Add android.googleServicesFile if FCM is needed (comment as TODO)
- Add ios.bundleIdentifier notification entitlements

---

## TASK 4 — MOBILE GPS INTEGRATION

File: find the daily report CREATE screen in apps/mobile/app/(tabs)/

Read the screen completely first.
expo-location is already in package.json — just not wired up.

Add GPS to the daily report create screen:

1. On screen mount: request location permission
   Location.requestForegroundPermissionsAsync()
   If denied: show Alert in Bahasa Indonesia explaining why GPS is needed

2. Add a "Gunakan Lokasi Saya" button in the form
   - On press: call Location.getCurrentPositionAsync({
       accuracy: Location.Accuracy.High
     })
   - Show loading indicator while fetching
   - On success: populate lat/lng fields in form state
   - Display coords to user: "Lokasi: -7.4325, 109.2483"
   - On error: show Alert "Gagal mendapatkan lokasi. Silakan coba lagi."

3. Form submission:
   - Include latitude and longitude in the POST body
   - If user has not gotten location yet:
     show confirmation "Kirim tanpa lokasi?" before submitting

4. TypeScript:
   - Type the location state as
     { latitude: number; longitude: number } | null
   - No any types

Do NOT implement geofence on mobile.
Server-side validation in DailyReportController already handles this.

---

## TASK 5 — FINAL CONSISTENCY CHECK

After all tasks above are done, run these checks:

Backend:

- php artisan test → must be 52+ tests, all passing
- php artisan route:list → no missing controllers
- grep -r "LEGACY" app/Http/Controllers/ → report count
  (should be zero or document why some remain)

Frontend Web:

- pnpm --filter web tsc --noEmit → zero TypeScript errors
- pnpm --filter web build → successful build
- Verify: no 'use client' on public pages (except map component)
- Verify: all public pages have generateMetadata()
- Verify: all public pages have loading.tsx and error.tsx

Frontend Mobile:

- pnpm --filter mobile tsc --noEmit → zero TypeScript errors
- Verify: notifications.ts exists
- Verify: _layout.tsx registers push token on mount
- Verify: daily report create screen has GPS button

Shared Packages:

- pnpm --filter @sibermas/shared-types build → pass
- pnpm --filter @sibermas/api-client build → pass
- pnpm --filter @sibermas/schemas build → pass
- pnpm --filter @sibermas/hooks build → pass
- pnpm --filter @sibermas/constants build → pass

---

## OUTPUT FORMAT PER TASK

TASK [N] — [NAME]
Status: Complete / Partial / Skipped (reason)

Files created: (list)
Files modified: (list with what changed)
Files deleted: (list)
Tests still passing: (number)
TypeScript errors: (number)
Notes: (anything needing attention)

---

## FINAL STATUS TABLE

Output this table after all tasks:

| Item | Before | After |
|------|--------|-------|
| Pest tests | 52 | ? |
| API endpoints | 169 | ? |
| LEGACY controllers | 18 | ? |
| TypeScript errors (web) | ? | 0 |
| TypeScript errors (mobile) | ? | 0 |
| Public pages SSG | 0 | 6 |
| Public pages with metadata | 0 | 6 |
| Push notif scaffold | ❌ | ✅ |
| Mobile GPS wired | ❌ | ✅ |
| Next.js build | ? | ✅ |

Then state clearly:
READY FOR MANUAL TESTING: Yes / No
If No: list what is still blocking.
