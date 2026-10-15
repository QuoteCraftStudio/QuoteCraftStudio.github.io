# Idea Hub Progress — 2026-10-14
## Verified from repository
- Root index.html identifies Idea Hub as QuoteCraft Studio and links the main brand to https://quotecraftstudio.ca/.
- idea-hub/index.html contains forum UI, discussion search, sign-in navigation, policy links, and the QuoteCraft Studio brand.
## Completed changes
- Added repository AGENTS.md with low-usage and branding instructions.
- Updated idea-hub/index.html brand link to https://quotecraftstudio.ca/.
- Removed duplicate footer policy links while retaining primary policy navigation.
- Changes committed to GitHub; live deployment and functional browser tests are not yet verified.
- Added IDEA_HUB_CODEX_HANDOFF.md summarizing prior commits, verified code, and the precise resume sequence.
## Work to continue
- Verify actual discussion, login and moderation functionality with live end-to-end testing; presence of UI alone does not prove backend operation.
- Review and test policy links, mobile layout, security and accessibility.
- Correct remaining incorrect brand references only where verified.
## Working rules
See AGENTS.md. Preserve verified work, use small changes, and document checkpoints.

## Additional finishing work — 2026-10-14
- Updated brand links on privacy.html, terms.html, guidelines.html and safety.html to https://quotecraftstudio.ca/.
- Verified config.js points to the configured Cloudflare Worker endpoint; endpoint configuration is not proof of live backend health.
- Noted that community-guidelines.html is a separate, older-looking guidelines page; compare content and incoming links before consolidating or redirecting.
- Still pending: live registration, sign-in, email verification, posting, moderation, reporting, deployment and mobile tests. Do not assert these passed.

## Approved moderation architecture — 2026-10-14
- Owner approved Cloudflare Workers AI for Idea Hub moderation; do not add an outside AI provider or rent a self-hosted server.
- Requirements: explicit respectful-conduct acceptance at registration; no swearing, harassment, hate, threats, bullying or spam; server-side screening of discussions and replies before publication; ambiguous content to moderator review; safe pending state on AI failure/quota exhaustion.
- Prefer Cloudflare safety model (evaluate current availability and free allocation) plus deterministic profanity checks, with clear explanations and moderator appeal. Avoid unjustified automatic account bans and false positives.
- CRITICAL: existing frontend is GitHub Pages, and Cloudflare API is configured at idea-hub-github.quotecraft300.workers.dev. Backend source/deployment ownership has NOT yet been located or verified. Do not pretend AI is active; locate actual Worker source and bindings before implementing. Do not deploy or activate billable services without user approval.
- Next: identify Worker project, add AI binding and server-side checks, test against benign and harmful examples, and verify free quota/fail-closed behavior. Keep existing manual moderation until verified.

## AI moderation staging verification — 2026-10-15
- IMPORTANT: These changes are on branch `staging/idea-hub-ai-moderation-20261015`, not production `main`. The Cloudflare production Worker has NOT been modified.
- Public read-only checks succeeded: https://quotecraftstudio.github.io/idea-hub/ loaded; /api/health returned `{"status":"ok","termsVersion":"2026-10-14"}`; /api/discussions returned an empty public list.
- Found existing main CI failure: `idea-hub/community-guidelines.html` was missing canonical URL and used `/idea-hub/` in a static link. Corrected both on this staging branch.
- Added Cloudflare Llama Guard 3 (@cf/meta/llama-guard-3-8b) safety screening in tracked backend/worker.mjs for profiles, new discussions, replies, and edits. Unsafe verdicts reject; unknown verdicts, missing binding, and AI exceptions fail closed. Human moderator approval remains mandatory.
- Added tracked Wrangler [ai] binding and offline fixture for AI responses; added tests/moderation.test.mjs.
- GitHub Actions `Idea Hub checks` succeeded at branch commit `b631958223316408fbd1b6fb5170659333c80c28` (22/22 automated tests; zero failures).
- Live Cloudflare Workers AI inference has NOT been tested, and the current Cloudflare deployed source/version and Cloudflare account billing plan have NOT been independently verified.
- Cloudflare docs describe a 10,000 Neurons/day free allocation; do not enable Workers Paid, credits, other paid features, or use real account inference without confirming free account eligibility.
- NEXT: In an authenticated Cloudflare environment, reconcile deployed Worker with this branch and the original backup, stage a non-production AI model call, verify actual safe/unsafe output and quota, then seek owner approval for one controlled production deploy, test health, post/reply/edit/moderator flow, and retain rollback.
