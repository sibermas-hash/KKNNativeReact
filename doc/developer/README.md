Developer Guide (short)

Rule: Every code/config change must be documented under /doc. Include purpose, files changed, and any runtime steps needed (migrate/build/seed).

Common tasks

1) Case-sensitivity check
- Command: npm run check:case-sensitive
- Script: scripts/dev/check-case-sensitivity.mjs
- CI: .github/workflows/case-sensitivity.yml runs this on PRs/pushes.

2) OpenAPI
- File: openapi.yaml at repo root.
- Validate locally: npx --yes @apidevtools/swagger-cli validate openapi.yaml
- CI: .github/workflows/openapi-validate.yml
- Generate SDK locally (docker):
  docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:v6.6.0 generate -i /local/openapi.yaml -g typescript-axios -o /local/sdks/typescript

3) Database migrations
- Migration file(s) live in database/migrations
- To run: php artisan migrate
- To rollback: php artisan migrate:rollback
- Migration added: database/migrations/2026_04_27_195259_add_indexes_to_tables.php

4) Enabling Husky hooks (optional)
- Install and prepare: npm i -D husky && npm run prepare
- The repo includes .husky/pre-push which runs npm run check:case-sensitive

5) CI & Workflows
- OpenAPI validation: .github/workflows/openapi-validate.yml
- SDK generation: .github/workflows/generate-sdk.yml
- FreeBSD workflow (self-hosted runner required): .github/workflows/freebsd-ci.yml
- Case-sensitivity workflow: .github/workflows/case-sensitivity.yml

6) Commit message policy
- Commits made by automation include: Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
- Follow conventional commits style where possible (feat/, fix/, chore/, docs/, ci/)

7) Deployment notes
- FreeBSD uses case-sensitive FS: ensure asset and import casing is exact.
- Ensure storage and bootstrap/cache are writable by web user on target.

If further detail or templates are needed (e.g., doc template for change entries), request them and an automated template will be added to /doc/templates.
