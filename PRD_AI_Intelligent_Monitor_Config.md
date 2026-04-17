# Product Requirements Document
## Feature: Intelligent Monitor & Config Tab
**Project:** KKN UIN SAIZU Administrative Portal
**Module:** AI Integration Layer
**Author:** Senior Product Manager / System Architect
**Status:** `DRAFT — Ready for Engineering Review`
**Version:** 1.0.0
**Last Updated:** 2026-04-17

---

## Table of Contents

1. [Feature Overview & Objectives](#1-feature-overview--objectives)
2. [Scope & Out of Scope](#2-scope--out-of-scope)
3. [User Stories](#3-user-stories)
4. [Functional Requirements — Configuration Form](#4-functional-requirements--configuration-form)
5. [Functional Requirements — Validation & Test Connection](#5-functional-requirements--validation--test-connection)
6. [Functional Requirements — Monitoring Panel](#6-functional-requirements--monitoring-panel)
7. [Backend Logic Flow (Laravel)](#7-backend-logic-flow-laravel)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Technical Considerations](#9-technical-considerations)
10. [API Contracts](#10-api-contracts)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Open Questions & Risks](#12-open-questions--risks)

---

## 1. Feature Overview & Objectives

### 1.1 Problem Statement

The current portal separates AI-related functionality across two distinct tabs:

| Location | What Lives There |
|---|---|
| **"AI Monitor" tab** | Provider status, connection health, autonomous heal logs |
| **"System Settings" tab** | `gemini_api_key` input, AI Enabled toggle |

This split forces administrators to context-switch between tabs to perform a single logical workflow: *configure the API key → validate it → observe the result*. It increases cognitive load, makes onboarding error-prone, and creates an inconsistent mental model where configuration and its observable effects are decoupled.

### 1.2 Proposed Solution

Consolidate all AI-related configuration, validation, and monitoring into a single unified tab: **"Intelligent Monitor & Config"**.

### 1.3 Objectives

| # | Objective | Success Metric |
|---|---|---|
| O-1 | Eliminate tab-switching for the full AI setup workflow | 100% of AI config actions completable from one tab |
| O-2 | Provide inline, real-time API key validation before saving | Validation latency < 3 seconds (p95) |
| O-3 | Improve security posture for key storage | All keys encrypted at rest using Laravel's `encrypt()` |
| O-4 | Reduce support tickets related to misconfigured AI keys | Target: 0 keys saved in invalid state |
| O-5 | Maintain strict design system adherence | Zero deviation from "Full Clean Emerald" token set |

### 1.4 Stakeholders

| Role | Name / Team | Responsibility |
|---|---|---|
| Product Owner | KKN SAIZU Admin Team | Final acceptance sign-off |
| Frontend Engineer | React/Inertia Dev | Implement UI, state management |
| Backend Engineer | Laravel Dev | API validation endpoint, encryption, DB migration |
| QA | Internal | Test coverage for happy path + edge cases |

---

## 2. Scope & Out of Scope

### 2.1 In Scope

- New **"Intelligent Monitor & Config"** tab replacing the current "AI Monitor" tab.
- Migrating the `gemini_api_key` field and "AI Enabled" toggle from "System Settings" into this new tab.
- A dedicated **"Test Connection"** button with backend validation logic.
- Encrypted storage of the API key in the database.
- Loading/error/success state management in React.
- Autonomous heal logs display (ported from current "AI Monitor").

### 2.2 Out of Scope

- Changes to any other "System Settings" fields outside the AI block.
- Support for multiple AI providers (future milestone).
- Role-based access control changes (assumed: admin-only, existing gate unchanged).
- Mobile-specific responsive breakpoints beyond standard Tailwind defaults.

---

## 3. User Stories

```
US-01 (Core Setup)
  As an administrator,
  I want to enter and validate my Gemini API key from the same tab where I see AI health status,
  So that I can configure and monitor AI in a single, uninterrupted workflow.

US-02 (Masked Input)
  As an administrator,
  I want the API key field to be masked by default with a toggle to reveal it,
  So that the key is not exposed on screen to bystanders during entry.

US-03 (Inline Validation)
  As an administrator,
  I want to test my API key before saving it,
  So that I am not able to accidentally persist an invalid key that breaks AI features.

US-04 (AI Toggle)
  As an administrator,
  I want a clearly visible ON/OFF switch for the AI module,
  So that I can disable AI features globally without removing the API key.

US-05 (Status Awareness)
  As an administrator,
  I want to see live connection health and heal logs on the same tab,
  So that after saving a new key I can immediately confirm the system is operational.
```

---

## 4. Functional Requirements — Configuration Form

### 4.1 API Key Input Field

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | The field MUST be of `type="password"` by default, masking the value with bullet characters. | MUST |
| FR-1.2 | A clickable eye icon (👁 / 👁‍🗨) MUST be rendered inside the input's trailing edge. Clicking it toggles the input between `type="password"` and `type="text"`. | MUST |
| FR-1.3 | The field's `name` and `id` attribute MUST be `gemini_api_key`. | MUST |
| FR-1.4 | If a key already exists in the database, the field MUST render a placeholder (e.g., `••••••••••••••••••••`) indicating a saved value, rather than pre-populating the actual decrypted key. | MUST |
| FR-1.5 | An inline helper text below the field MUST read: *"Your key is encrypted before storage and never transmitted in plaintext."* | SHOULD |
| FR-1.6 | The field MUST be `autocomplete="off"` to prevent browser-autofill of sensitive credentials. | MUST |

### 4.2 AI Enabled Toggle Switch

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | A toggle switch component labeled **"AI Module Enabled"** MUST be present above the API key field. | MUST |
| FR-2.2 | The toggle state MUST reflect the current `ai_enabled` value from the backend (boolean). | MUST |
| FR-2.3 | Toggling OFF while a valid key exists MUST disable AI processing but NOT delete the stored key. | MUST |
| FR-2.4 | When the toggle is OFF, a soft warning banner MUST appear: *"AI features are globally disabled. Students will not receive AI-assisted diagnostics."* | SHOULD |
| FR-2.5 | Toggle state changes MUST NOT require page reload; they MUST be submitted as part of the save action or as a standalone `PATCH` request (TBD by engineering preference). | MUST |

---

## 5. Functional Requirements — Validation & Test Connection

### 5.1 Test Connection Button

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | A **"Test Connection"** button MUST be rendered immediately to the right of, or directly below, the API key input field. | MUST |
| FR-3.2 | The button MUST be disabled if the API key input field is empty. | MUST |
| FR-3.3 | On click, the button MUST enter a **loading state**: spinner icon replaces the icon, label changes to *"Validating…"*, button is disabled to prevent double-submission. | MUST |
| FR-3.4 | On a **successful** backend response, the button area MUST display an inline success badge: green checkmark + *"Connection successful"* with the model name confirmed (e.g., `gemini-1.5-flash`). | MUST |
| FR-3.5 | On a **failed** backend response, the button area MUST display an inline error badge: red X + a human-readable error message returned from the backend (e.g., *"Invalid API key. Check your Google AI Studio credentials."*). | MUST |
| FR-3.6 | The validation result state (success/error) MUST reset when the user modifies the key input field, prompting re-validation. | MUST |
| FR-3.7 | Validation result MUST NOT persist across page reloads (it is purely a session-level UX hint, not stored). | MUST |

### 5.2 Save / Submit Behavior

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | The **"Save Settings"** button MUST remain independently functional from the Test Connection button. | MUST |
| FR-4.2 | If the user attempts to save a key that has a **failed** validation result, a confirmation modal MUST appear: *"This key failed validation. Saving it may disable AI features. Continue anyway?"* | SHOULD |
| FR-4.3 | If the user attempts to save a key that has **not been tested**, a non-blocking toast warning MUST appear: *"Tip: Test your connection before saving."* | COULD |
| FR-4.4 | Saving a **blank** key field when a key already exists in the DB MUST be treated as a no-op for the key field (existing key is preserved). To explicitly delete a key, a separate "Remove Key" action is required (see FR-4.5). | MUST |
| FR-4.5 | A **"Remove Key"** link/button (destructive, styled in `red-600`) MUST be available, triggering a confirmation dialog before deleting the stored key. | SHOULD |

---

## 6. Functional Requirements — Monitoring Panel

> These are ported from the existing "AI Monitor" tab with no functional changes.

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | The tab MUST display the current **AI Provider Status** (Operational / Degraded / Offline) as a color-coded badge. | MUST |
| FR-5.2 | The tab MUST display the **Connection Status** with last-checked timestamp. | MUST |
| FR-5.3 | The tab MUST display the **Autonomous Heal Logs** in a scrollable, timestamped list. | MUST |
| FR-5.4 | After a successful "Save Settings" action with a new key, the monitoring panel MUST automatically refresh its status (via re-fetch or Inertia reload). | MUST |

---

## 7. Backend Logic Flow (Laravel)

### 7.1 Test Connection Endpoint

**Route:** `POST /admin/settings/ai/test-connection`
**Controller:** `AiSettingsController@testConnection`
**Middleware:** `auth`, `role:admin`

#### Flow Diagram

```
[Client: POST /ai/test-connection]
         │
         ▼
[1. Validate Request]
   └─ Rules: { gemini_api_key: 'required|string|min:20' }
   └─ On failure → 422 Unprocessable Entity { errors: {...} }
         │
         ▼
[2. Build Probe Request]
   └─ Construct minimal Gemini API request:
      POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
      Authorization: Bearer {gemini_api_key}
      Body: { "contents": [{ "parts": [{ "text": "ping" }] }] }
         │
         ▼
[3. Execute HTTP Call (Laravel Http Facade)]
   └─ Timeout: 8 seconds
   └─ Catch: ConnectionException, RequestException
         │
         ├──[SUCCESS: HTTP 200]──────────────────────────────────────────────►
         │                                                                    │
         │   Extract model name from response                                 │
         │   Return: 200 OK                                                   │
         │   {                                                                │
         │     "success": true,                                               │
         │     "message": "Connection successful",                            │
         │     "model": "gemini-1.5-flash",                                  │
         │     "latency_ms": 312                                              │
         │   }                                                                │
         │                                                                    ▼
         ├──[FAILURE: HTTP 400/401/403]──────────────────────────────────►
         │                                                                    │
         │   Return: 200 OK (intentional — not a server error)               │
         │   {                                                                │
         │     "success": false,                                              │
         │     "message": "Invalid API key. Verify in Google AI Studio.",     │
         │     "error_code": "INVALID_API_KEY"                               │
         │   }                                                                │
         │                                                                    ▼
         └──[NETWORK ERROR / TIMEOUT]────────────────────────────────────►
                                                                             │
             Return: 200 OK                                                  │
             {                                                               │
               "success": false,                                             │
               "message": "Could not reach Gemini API. Check network.",      │
               "error_code": "NETWORK_ERROR"                                │
             }
```

> **Note:** The test endpoint **NEVER saves the key**. It is a stateless probe-only operation. The key submitted to this endpoint exists only in the request lifecycle.

### 7.2 Save Settings Endpoint

**Route:** `PATCH /admin/settings/ai`
**Controller:** `AiSettingsController@update`

#### Key Storage Logic

```php
// AiSettingsController@update (pseudocode)

public function update(AiSettingsRequest $request): RedirectResponse
{
    $data = [];

    // Only update key if a new non-empty value was submitted
    if ($request->filled('gemini_api_key')) {
        $data['gemini_api_key'] = encrypt($request->input('gemini_api_key'));
    }

    $data['ai_enabled'] = $request->boolean('ai_enabled');

    Setting::upsert($data); // or your settings repository pattern

    return redirect()->back()->with('success', 'AI settings saved successfully.');
}
```

> Laravel's `encrypt()` uses AES-256-CBC with the application key (`APP_KEY`). The stored value is decryptable only by the same application instance, mitigating DB-level exposure.

### 7.3 Database Schema Note

Ensure the `settings` table column for `gemini_api_key` is of type `TEXT` (not `VARCHAR(255)`) — encrypted payloads from Laravel's `encrypt()` are significantly longer than the raw key.

```sql
-- Migration
ALTER TABLE settings MODIFY COLUMN gemini_api_key TEXT NULL;
```

---

## 8. UI/UX Specifications

### 8.1 Design System: "Full Clean Emerald"

| Token | Value | Usage |
|---|---|---|
| `primary` | `emerald-600` / `#059669` | Buttons, active toggles, success badges |
| `primary-focus` | `#1a7a4a` | Focus rings on inputs, focused buttons |
| `background` | `white` / `#ffffff` | Main card/panel backgrounds |
| `surface` | `gray-50` / `#f9fafb` | Section backgrounds, input backgrounds |
| `border` | `gray-200` / `#e5e7eb` | Card borders, input borders |
| `text-primary` | `gray-900` / `#111827` | Headings, labels |
| `text-secondary` | `gray-500` / `#6b7280` | Helper text, timestamps |
| `destructive` | `red-600` / `#dc2626` | Remove Key button, error states |
| `warning` | `amber-500` / `#f59e0b` | Non-blocking warnings |

### 8.2 Tab Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Intelligent Monitor & Config                              [Tab Header]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ AI Configuration ─────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │  AI Module Enabled                              [●══════] ON   │  │
│  │                                                                 │  │
│  │  ┌─ Warning Banner (if disabled) ──────────────────────────┐   │  │
│  │  │ ⚠ AI features are globally disabled…                    │   │  │
│  │  └────────────────────────────────────────────────────────-┘   │  │
│  │                                                                 │  │
│  │  Gemini API Key                                                 │  │
│  │  ┌────────────────────────────────────────────────┐ [Test 🔌]  │  │
│  │  │ ••••••••••••••••••••••••••••••••••   [👁 Show] │            │  │
│  │  └────────────────────────────────────────────────┘            │  │
│  │  ✦ Your key is encrypted before storage…                       │  │
│  │                                                                 │  │
│  │  [Validation Result Badge — success/error appears here]        │  │
│  │                                                                 │  │
│  │  [Save Settings ▶]                        [Remove Key ✕]       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ AI Health Monitor ────────────────────────────────────────────┐  │
│  │  Provider Status   ● Operational                               │  │
│  │  Connection        ● Connected — Last checked: 2 min ago       │  │
│  │  Model             gemini-1.5-flash                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ Autonomous Heal Logs ─────────────────────────────────────────┐  │
│  │  [scrollable log list]                                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Component States — API Key Input

| State | Visual Spec |
|---|---|
| **Default (empty)** | `border-gray-200`, placeholder `"Enter your Gemini API key"` |
| **Default (key exists)** | Placeholder `"••••••••••••••••• (saved)"`, no value in input |
| **Focused** | `border-emerald-600`, `ring-2 ring-[#1a7a4a] ring-offset-1` |
| **Invalid (client-side)** | `border-red-400`, helper text in `text-red-600` |
| **Validated — Success** | `border-emerald-500`, inline badge: `✓ Connection successful` in `text-emerald-700 bg-emerald-50` |
| **Validated — Error** | `border-red-400`, inline badge: `✗ {error message}` in `text-red-700 bg-red-50` |

### 8.4 Test Connection Button States

| State | Label | Icon | Style |
|---|---|---|---|
| **Idle** | "Test Connection" | `🔌` plug icon | `bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50` |
| **Loading** | "Validating…" | `⟳` spinner (animated) | `opacity-75 cursor-not-allowed` |
| **Success** | "Test Connection" | `✓` checkmark | Border unchanged, success badge appears below |
| **Error** | "Test Connection" | `🔌` reset | Border unchanged, error badge appears below |
| **Disabled** | "Test Connection" | `🔌` | `opacity-40 cursor-not-allowed` (key field empty) |

### 8.5 User Flow

```
Step 1 — User navigates to "Intelligent Monitor & Config" tab.
         └─ Sees current AI toggle state and masked key placeholder (if key exists).
         └─ Monitoring panel shows current health status.

Step 2 — User enters (or pastes) a new Gemini API key.
         └─ Eye toggle available to verify input.
         └─ Any previous validation result badge is cleared.

Step 3 — User clicks "Test Connection".
         └─ Button enters loading state (spinner, disabled).
         └─ POST /admin/settings/ai/test-connection fires.

Step 4A — SUCCESS response received.
         └─ Success badge renders: "✓ Connection successful — gemini-1.5-flash"
         └─ "Save Settings" button is now highlighted (primary style).
         └─ User clicks "Save Settings" → PATCH /admin/settings/ai fires.
         └─ Inertia redirect with success flash toast.
         └─ Monitoring panel auto-refreshes.

Step 4B — FAILURE response received.
         └─ Error badge renders with backend message.
         └─ User corrects the key and re-tests, OR
         └─ Clicks "Save Settings" → confirmation modal fires (FR-4.2).

Step 5 — User optionally toggles "AI Module Enabled" OFF/ON.
         └─ Warning banner appears/disappears accordingly.
         └─ Saved on next "Save Settings" click.
```

---

## 9. Technical Considerations

### 9.1 Security

| Concern | Mitigation |
|---|---|
| **Key exposure in transit** | All admin routes served over HTTPS. Inertia POST requests use CSRF tokens. |
| **Key exposure in DB** | Stored using Laravel `encrypt()` (AES-256-CBC + HMAC-SHA256). |
| **Key exposure in frontend** | Backend MUST NOT return the decrypted key in any Inertia prop. Return only a boolean `has_key: true/false`. |
| **Key exposure in logs** | The `gemini_api_key` field MUST be added to `$hidden` in any model and excluded from Laravel's request logging middleware. |
| **Key in test endpoint** | The test endpoint is stateless; the key is never written to storage, cache, or logs during the probe. |
| **Brute-force of test endpoint** | Apply Laravel `throttle:10,1` middleware (10 requests per minute per IP). |

### 9.2 State Management (React / TypeScript)

```typescript
// Recommended state shape for the configuration form component

type ValidationStatus = 'idle' | 'loading' | 'success' | 'error';

interface AiConfigState {
  apiKeyInput: string;           // Controlled input value
  showKey: boolean;              // Eye toggle
  aiEnabled: boolean;            // Toggle switch
  validationStatus: ValidationStatus;
  validationMessage: string | null;
  validationModel: string | null; // e.g., "gemini-1.5-flash"
  isSaving: boolean;
}

// Side effect rule:
// Reset validationStatus → 'idle' whenever apiKeyInput changes.
useEffect(() => {
  if (validationStatus !== 'idle') {
    setValidationStatus('idle');
    setValidationMessage(null);
  }
}, [apiKeyInput]);
```

**Key decisions:**
- Use `useState` for local form state. Do NOT push validation results into Inertia shared props.
- The "Test Connection" POST uses `axios` (or `fetch`) directly, NOT `router.post()`, since it is a non-navigating side-effect call.
- The "Save Settings" PATCH uses Inertia's `router.patch()` for proper redirect handling.

### 9.3 Inertia Data Contract

The page component receives the following props from the Laravel controller on initial load:

```typescript
interface AiMonitorPageProps {
  has_gemini_key: boolean;        // True if an encrypted key exists in DB
  ai_enabled: boolean;            // Current toggle state
  connection_status: {
    status: 'operational' | 'degraded' | 'offline';
    last_checked_at: string | null; // ISO 8601
    model: string | null;
  };
  heal_logs: HealLogEntry[];
}
```

### 9.4 Error Handling

| Scenario | Handling |
|---|---|
| Network timeout on test connection | Frontend `axios` timeout set to 10s. On timeout, show: *"Request timed out. Check your server's outbound network access."* |
| Inertia save failure (422) | Display field-level validation errors inline under each field using Inertia's `errors` prop. |
| `APP_KEY` missing / encrypt failure | Log to Laravel's error channel; surface generic 500 with message *"Encryption failed. Contact system administrator."* |
| Gemini API rate limit (429) | Backend parses response, returns `success: false`, `error_code: "RATE_LIMITED"`, message: *"Too many requests to Gemini. Wait a moment and try again."* |

---

## 10. API Contracts

### 10.1 `POST /admin/settings/ai/test-connection`

**Request Body:**
```json
{
  "gemini_api_key": "AIzaSy..."
}
```

**Response — Success (HTTP 200):**
```json
{
  "success": true,
  "message": "Connection successful",
  "model": "gemini-1.5-flash",
  "latency_ms": 287
}
```

**Response — Failure (HTTP 200):**
```json
{
  "success": false,
  "message": "Invalid API key. Verify your credentials in Google AI Studio.",
  "error_code": "INVALID_API_KEY"
}
```

**Response — Validation Error (HTTP 422):**
```json
{
  "message": "The gemini api key field is required.",
  "errors": {
    "gemini_api_key": ["The gemini api key field is required."]
  }
}
```

### 10.2 `PATCH /admin/settings/ai`

**Request Body:**
```json
{
  "gemini_api_key": "AIzaSy...",  // Optional; omit to leave unchanged
  "ai_enabled": true
}
```

**Response — Success (Inertia redirect with flash):**
```
HTTP 302 → back()
X-Inertia-Flash: { "success": "AI settings saved successfully." }
```

**Response — Remove Key: `DELETE /admin/settings/ai/key`**
```json
// Request: no body required
// Response: HTTP 302 with flash success
```

---

## 11. Acceptance Criteria

```gherkin
Feature: Intelligent Monitor & Config Tab

  Scenario: Administrator successfully configures a valid API key
    Given the admin is on the "Intelligent Monitor & Config" tab
    When they enter a valid Gemini API key
    And click "Test Connection"
    Then a success badge displays "✓ Connection successful — gemini-1.5-flash"
    And the key remains masked in the input
    When they click "Save Settings"
    Then the key is saved in encrypted form in the database
    And the monitoring panel refreshes to show "Operational" status

  Scenario: Administrator attempts to save an invalid API key
    Given the admin has entered an invalid Gemini API key
    When they click "Test Connection"
    Then an error badge displays the backend error message
    When they click "Save Settings"
    Then a confirmation modal appears warning about the failed validation

  Scenario: API key input is masked by default
    Given the admin is viewing the config form
    Then the key input is of type "password"
    When they click the eye icon
    Then the input toggles to type "text"
    And the icon changes to the "hide" state

  Scenario: Changing the key resets validation state
    Given a successful validation badge is visible
    When the admin modifies the API key input
    Then the success badge disappears immediately
    And the "Test Connection" button returns to idle state

  Scenario: AI toggle disables features without deleting the key
    Given a valid API key is saved and AI is enabled
    When the admin toggles "AI Module Enabled" to OFF
    And saves settings
    Then the key remains encrypted in the database
    And a warning banner appears on the tab
    And AI diagnostic features are suspended

  Scenario: Empty key field on save preserves existing key
    Given a valid API key is already saved
    When the admin opens the tab (key field shows placeholder)
    And submits the form without entering a new key
    Then the existing key is NOT overwritten or deleted
```

---

## 12. Open Questions & Risks

| # | Question / Risk | Owner | Status |
|---|---|---|---|
| OQ-1 | Should the "Test Connection" button also attempt to trigger an autonomous heal cycle to verify end-to-end functionality? | Backend Lead | OPEN |
| OQ-2 | Is the `settings` table using a key-value pattern or a single-row config model? This affects the `upsert` strategy in 7.2. | Backend Lead | OPEN |
| OQ-3 | Should `ai_enabled` toggle changes be saved immediately (auto-save) or only on explicit "Save Settings"? | Product Owner | OPEN |
| OQ-4 | **Risk:** If `APP_KEY` is rotated, all existing encrypted keys become unreadable. A key re-entry flow is needed. Should a "Key needs re-entry" warning state be added to the monitoring panel? | Backend Lead | OPEN |
| OQ-5 | Does the Gemini probe endpoint incur any API usage costs? If so, throttle the test button to N uses per session. | Product Owner | OPEN |

---

## Appendix A: File & Component Checklist

```
Frontend (React/TypeScript/Inertia)
├── Pages/
│   └── Admin/Settings/AiMonitorConfig.tsx        ← Main page component
├── Components/AI/
│   ├── AiConfigForm.tsx                          ← Form section
│   ├── ApiKeyInput.tsx                           ← Masked input + eye toggle
│   ├── TestConnectionButton.tsx                  ← Button with loading state
│   ├── ValidationResultBadge.tsx                 ← Success/error inline badge
│   ├── AiEnabledToggle.tsx                       ← Toggle + warning banner
│   ├── AiHealthPanel.tsx                         ← Ported monitoring panel
│   └── HealLogsPanel.tsx                         ← Ported heal logs

Backend (Laravel)
├── Http/Controllers/Admin/
│   └── AiSettingsController.php                 ← testConnection(), update(), destroyKey()
├── Http/Requests/
│   ├── TestAiConnectionRequest.php              ← Validation rules for test endpoint
│   └── UpdateAiSettingsRequest.php              ← Validation rules for save
├── Services/
│   └── GeminiProbeService.php                   ← HTTP probe logic, isolated for testability
├── routes/
│   └── admin.php                                ← New route definitions
└── database/migrations/
    └── xxxx_update_settings_gemini_key_to_text.php
```

---

*End of Document — PRD v1.0.0*
*For questions, contact the Product team before beginning implementation.*
