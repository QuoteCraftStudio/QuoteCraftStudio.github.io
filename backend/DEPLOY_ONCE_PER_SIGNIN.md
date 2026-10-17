# One checkbox per sign-in — rollout

**Status: Not yet deployed.** The public Idea Hub currently requires agreement on each post or comment.

User request (2026-10-17): people check the agreement once when registering or signing in, not for each post, comment, edit or profile save.

## Implementation
- The existing signup checkbox remains; the same checkbox is now present during sign-in.
- The backend issues a cryptographically signed short-lived `consentProof` for the current Firebase sign-in token **only when the user explicitly accepts** the current `TERMS`.
- The frontend keeps `consentProof` in the browser tab's memory alongside the login token; no persistent storage, new secrets, or new database tables.
- Authenticated writes pass this proof in `X-Idea-Hub-Agreement`, tied to the Firebase sign-in token, rather than showing repeated checkboxes. Logout clears the proof; signing in again requires fresh acceptance.
- A forged or wrong-user proof is denied. Existing open web tabs with the old per-post checkbox still work during rollout (they continue submitting agreement in each form until they reload). Backwards-compatible old terms still stay pending for moderation.
- Existing moderation, AI screening, content limits, reports, role checks, edit/delete and D1 bindings are unchanged.

## Safe release order

1. Check the correct Cloudflare account and production rollback deployment `idea-hub-github` before making changes.
2. Fetch branch `feature/idea-hub-consent-once-per-signin-20261017` from `QuoteCraftStudio/QuoteCraftStudio.github.io` into a clean checkout. Run `npm.cmd test` on Windows (or `npm test` elsewhere).
3. Run `npx.cmd wrangler deploy --config backend/wrangler.toml --dry-run` and verify no errors, existing `AI`, `DB`, Worker name, and no new resources.
4. Deploy **backend first**: `npx.cmd wrangler deploy --config backend/wrangler.toml --keep-vars`. Retain current secrets, bindings and existing database. No migrations.
5. Confirm public `/api/health` remains `status:ok` and current `termsVersion:2026-10-17`; check the new backend CORS response to an `OPTIONS` preflight includes `X-Idea-Hub-Agreement`. If this check fails, rollback the Worker and do not merge the website PR.
6. Merge the matching GitHub PR to main only after backend success, and confirm Pages deployed. Test sign-in agreement once, successful post and comment without per-post checkboxes, flagged content stays private, account support and sign-out/re-sign-in flow. Delete temporary test content.
7. If regression, roll back frontend commit on GitHub Pages and backend Worker as needed.

Never publish just the frontend before the backend. Do not change Firebase, D1, secrets, billing or unrelated apps.
