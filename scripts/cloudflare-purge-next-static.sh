#!/usr/bin/env bash
set -euo pipefail

: "${CF_ZONE_ID:?Set CF_ZONE_ID}"
: "${CF_API_TOKEN:?Set CF_API_TOKEN with Zone.Cache Purge permission}"

API="https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache"
HOST="${CF_HOST:-sibermas.uinsaizu.ac.id}"
MODE="${1:-static}"

case "$MODE" in
  static)
    payload=$(printf '{"prefixes":["https://%s/_next/static/"]}' "$HOST")
    ;;
  everything)
    payload='{"purge_everything":true}'
    ;;
  *)
    echo "Usage: CF_ZONE_ID=... CF_API_TOKEN=*** CF_HOST=sibermas.uinsaizu.ac.id $0 [static|everything]" >&2
    exit 64
    ;;
esac

curl -fsS -X POST "$API" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$payload"

echo
