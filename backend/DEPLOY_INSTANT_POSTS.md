# Deploy Idea Hub instant posts & comments (2026-10-17)

Status: **NOT YET DEPLOYED TO PRODUCTION.** Draft PR #5 is awaiting a coordinated backend-first release.

## Existing resources (do not recreate or replace)
- Cloudflare account: `2398529848b00c6cf053cae402077a72`
- Worker: `idea-hub-github`
- Existing D1 database binding: `DB` to `idea-hub-github`; Workers AI binding: `AI`
- Existing encrypted secrets: `ADMIN_UIDS`, `FIREBASE_API_KEY`, `RATE_LIMIT_SALT`
- Expected site origin: `https://quotecraftstudio.github.io`
- Last checked production version: `874db562` (verify before deploying)
- Matching code branch: `feature/idea-hub-instant-posts-comments-20261017`

## Why Wrangler is needed
The current Cloudflare **Quick Edit** page exposes only one existing `worker.js` file. The tested repository code uses ES modules `backend/worker.mjs` and `backend/moderation.mjs`. Do **not** paste `worker.mjs` alone into the one-file editor: its import will be unresolved. No dashboard file upload or complete Git integration build configuration was verified. Instead use Wrangler to bundle the modules.

## Preflight (on a trusted, authenticated development computer with Node and Git)
1. Verify the user is signed into the correct Cloudflare account with `npx wrangler whoami`. Stop if account `2398529848b00c6cf053cae402077a72` is unavailable; run `npx wrangler login` interactively if necessary. **Never copy tokens/passwords into this repo or chat.**
2. Use a clean checkout of the repository and select branch `feature/idea-hub-instant-posts-comments-20261017`.
3. Run `npm test` and `npx wrangler deploy --config backend/wrangler.toml --dry-run` and check for errors; confirm Worker name, existing D1/AI bindings, and no new resources. The config sets `keep_vars = true` to preserve dashboard-managed variables. Cloudflare documentation says pre-existing secrets survive deployment.
4. In Cloudflare Deployments, note the active rollback version before proceeding.
5. Deploy **the Worker first**, from this exact branch, using `npx wrangler deploy --config backend/wrangler.toml --keep-vars`. Do not run database migration, replace secrets or change pricing plan.
6. Verify `https://idea-hub-github.quotecraft300.workers.dev/api/health` returns status `ok` and termsVersion `2026-10-17`; verify the public read-only `/api/discussions` endpoint succeeds. Do not make real production submissions without user authorization for the test content.
7. Only after Worker success, finish review and merge PR #5 into GitHub `main` to publish the frontend, then confirm GitHub Pages deployment passes and `idea-hub/app.js` uses terms `2026-10-17`.
8. Run approved live end-to-end tests: cleared new discussion visible immediately; cleared comment visible immediately; flagged abusive test content remains private, can be removed by moderator; old-consent version posts remain pending; cleanup clearly labelled test content.
9. If any backend check fails, roll back to the recorded prior Cloudflare version and do **not** merge PR #5.

No Cloudflare production updates have been made from this checklist.
