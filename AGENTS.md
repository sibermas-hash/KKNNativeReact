# Agent Rules

Hard scope:
- Frontend-only rewrite.
- Never modify backend/API/database/mobile.
- Use existing `/api/v1` endpoints only.
- Do not invent payloads; match legacy web behavior.
- Login page must be treated carefully; final version must be visually identical to legacy SIBERMAS login incl. captcha/2FA.
- Build output must remain static SPA. No Next.js, no SSR, no server runtime.

Before committing:
- `npm run build` must pass.
- No secrets/tokens in files.
