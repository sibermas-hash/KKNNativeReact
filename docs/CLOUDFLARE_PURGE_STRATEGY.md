# Cloudflare purge strategy — SIBERMAS

Goal: prevent stale cached Next.js chunks (`/_next/static/*`) after deploy.

## Default purge

Run after every successful web deploy/restart:

```bash
CF_ZONE_ID=... \
CF_API_TOKEN=... \
CF_HOST=sibermas.uinsaizu.ac.id \
bash scripts/cloudflare-purge-next-static.sh static
```

Token scope: Cloudflare API token with `Zone.Cache Purge` for the SIBERMAS zone only.

## Emergency purge

Use only when users already hit `ChunkLoadError`, MIME errors, or cached 404 HTML for JS chunks:

```bash
CF_ZONE_ID=... CF_API_TOKEN=... bash scripts/cloudflare-purge-next-static.sh everything
```

## Verification

```bash
curl -I https://sibermas.uinsaizu.ac.id/_next/static/chunks/<known-chunk>.js
```

Expected:
- `200`
- `content-type: application/javascript` or JS-compatible type
- no cached `404 text/html`

## Deploy rule

Order:
1. build web artifact
2. copy standalone + static atomically
3. restart PM2
4. smoke test `/`, `/login`, target admin route
5. purge Cloudflare `/_next/static/*`
6. browser hard refresh if incident already visible
