# KKNNativeReact

Clean frontend-only rewrite sandbox for SIBERMAS.

## Scope

- Frontend web SPA only.
- Uses existing SIBERMAS Laravel API contract.
- Do **not** modify database/API/mobile from this repo.
- Production server is untouched until explicit approval.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- TanStack Query
- Axios API client (`withCredentials` web mode)

## Commands

```bash
npm install
cp .env.example .env
npm run dev
npm run build
```

## Current status

Foundation scaffold only:
- auth provider skeleton
- API client skeleton
- mahasiswa layout/dashboard stubs
- build passes
