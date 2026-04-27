Change Entry Template

Date: 2026-04-27
Author: <name>

Summary:
A short (one-paragraph) summary of the change and why it was made.

Motivation:
Explain the problem this change addresses and any context.

Files changed:
- path/to/file1
- path/to/file2

DB migrations / schema changes:
- Migration files added/modified (path)
- Runtime steps to apply: `php artisan migrate` or SQL commands

Runtime steps (build / deploy / config):
- npm install
- npm run build
- php artisan config:cache
- restart services, etc.

Rollback plan:
Describe how to revert the change and any data migration rollback steps.

Testing done:
- Unit tests run
- Integration tests
- Manual steps performed (endpoints checked)

CI / Workflows impacted:
- .github/workflows/openapi-validate.yml
- .github/workflows/generate-sdk.yml

Notes / links:
- Related PR: #<number>
- Design doc: docs/architecture/...

Policy reminder:
All code/config changes must include a filled change entry under docs/changes with this template and link to the PR.
