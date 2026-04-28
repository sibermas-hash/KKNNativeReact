Security hardening: Disable public API self-service & restrict allowed_tables

What changed
- Disabled self-service API key registration by setting config('api_keys.self_service_enabled') to false in config/api_keys.php.
- Cleared config('api_keys.allowed_tables') to an empty array to prevent public API access until each table is reviewed and explicitly allowed.

Why
- Prevents automated/unauthorized issuance of API keys.
- Minimizes risk of exposing sensitive tables via the PublicDataController.

Operational notes
- If teams need specific tables exposed, add them to config/api_keys.allowed_tables after a security review.
- Coordinate with Ops to rotate API keys and webhook secrets after this change.
- This change is safe to deploy immediately; self-service endpoints will return 403.

Next steps
1. Rotate webhook secret and admin API secret (requires vault/ops).
2. Run staging dry-run of migration and ensure allowed_tables entries (if any) are approved.
3. Add monitoring/alerts for API key creation and webhook failures.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
