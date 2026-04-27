Summary of changes made on 2026-04-27

This document records the repository changes performed to support FreeBSD deployment, API contract, and DB improvements. All future changes must include documentation under /doc.

Changes implemented:

- Case-sensitivity audit
  - scripts/dev/check-case-sensitivity.mjs executed; no mismatches found.

- Laravel fix
  - Added: config/view.php to fix Blade compiled path (resolves HTTP 500 on dev server).

- Cleanup
  - Removed generated artifacts: storage/.php_cs.cache, storage/framework/views/*, storage/logs/*, debugbar cache, testing temp files.

- Database
  - Added runtime indexes in-session: idx_todos_status, idx_tododeps_depends, idx_inbox_recipient_sent_at, idx_inbox_unread.
  - Migration created: database/migrations/2026_04_27_195259_add_indexes_to_tables.php

- API contract
  - Added OpenAPI skeleton: openapi.yaml
  - CI validation: .github/workflows/openapi-validate.yml
  - SDK generation workflow: .github/workflows/generate-sdk.yml

- CI / local hooks
  - Added Husky pre-push hook file (.husky/pre-push). Note: husky devDependency was removed in this environment; to enable hooks run `npm i -D husky && npm run prepare`.

Files added/modified (representative):
- config/view.php (added)
- openapi.yaml (added)
- .github/workflows/openapi-validate.yml (added)
- .github/workflows/generate-sdk.yml (added)
- database/migrations/2026_04_27_195259_add_indexes_to_tables.php (added)
- doc/ (this file)

Recommended next steps:
- Run `php artisan migrate` in target environment to persist DB indexes.
- Enable husky in development environments if pre-push checks are desired.
- Provide any missing OpenAPI schemas by aligning controllers and updating openapi.yaml.
