# Cloudflare AI moderation

Prepared October 16, 2026. **Not deployed.** Production approval is required.

`moderation.mjs` defines `checkContentSafety`, using only the existing `AI` binding
and `@cf/meta/llama-guard-3-8b`. Validated fields are screened after authentication,
authorization, consent, and rate limits and before writes. Profiles, titles,
bodies, replies and edits are covered. Moderator approval re-screens old queued
content and uses an optimistic content/revision check to avoid approving a
concurrent edit. No schema migration or new database is required.

Only submitted public text is sent, not email, UID, token, password or private
report data. Clear profanity, direct insults and obvious promotional spam are
rejected by conservative rules before inference. Model unsafe results reject
with HTTP 400 and an appeal route. Missing AI, provider failure, quota errors,
unknown/contradictory responses and an 20-second timeout return HTTP 503
without saving changes. Deletion and private account-support appeals still work
without AI. No automatic account suspension or publication is introduced.

Safe posts and edits still enter the human queue. Profiles retain their existing
publication behavior but must pass screening before a change is stored.
Uncertain model responses are not treated as safe; users can retry or appeal.
The timeout bounds application waiting; an already-started inference may finish
in the provider after timeout. There are no automatic retries.

## Verification

- 28 automated tests pass, including the existing Firebase, CORS, ownership,
  email-verification, limits, moderation and static checks.
- Synthetic provider tests cover both documented response formats, prohibited
  and ordinary content, malformed results, provider errors, timeouts, profiles,
  creation, edits, moderation approval, and a concurrent edit during screening.
- JavaScript syntax checks pass.
- Actual Cloudflare preview passed: clean content and respectful disagreement accepted; a direct threat, promotional spam and an insult rejected. The owner confirmed Workers Free. Clean cases took 3.11 and 13.95 seconds, prompting a 20-second bound. Initial preview failures/timeouts remained closed. No production data or writes were used.
- The source retrieved from the live Worker differs from the supplied original
  draft baseline by a call to an undefined `checkContentSafety(env, content)` in
  post submission. This patch supplies a defined, tested implementation.

## Isolated preview

`tools/ai-preview.toml` exposes only a loopback local test handler and the remote
AI binding. It has no Firebase, D1, secrets, routes or production data access.
Run `wrangler dev --config tools/ai-preview.toml --ip 127.0.0.1 --port 8788`.
Send small synthetic JSON `{ "text": "A practical garden project." }` requests
only after verifying the account remains on Workers Free. Never deploy this
test handler. Stop the preview after testing.

## Deployment gate

Keep changes on a review branch: main also publishes frontend policy changes.
After real-model tests, obtain explicit production approval. Then deploy the
backend using `backend/wrangler.toml` with existing secrets preserved, and
publish the matching frontend consent version and policy disclosures. Existing
sessions must reload for the October 16 consent version. Verify health, valid
sign-in, a disposable pending/approval/edit cycle, and cleanup. Retain the
retrieved live source and prior version for rollback. Do not recreate bindings,
Firebase, D1 or upgrade the plan.

## Limitations and sources

Llama Guard is a safety classifier, not a comprehensive profanity, harassment
or spam detector. Simple language rules also miss evasions and can flag quoted
profanity; appeals and human approval remain necessary. This is not a guarantee
that every harmful post is detected, nor a claim of universal language coverage.

Official API and schema:
https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/
https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/schema-output.json

Free allocation and quota behavior:
https://developers.cloudflare.com/workers-ai/platform/pricing/

