# Idea Hub backend

This backend is ONLY for `QuoteCraftStudio/QuoteCraftStudio.github.io`. Do not deploy over the existing `quotecraft-community` Worker or use its `idea-hub` database: those belong to a separate site.

## Free deployment

1. Authorize official Wrangler with account/user read and Workers/D1 write permissions. OAuth permissions cover the account; operate only on the resources named below. Stay on Workers Free and Firebase Spark. Do not attach billing or activate paid services.
2. Create a new D1 database named `idea-hub-github`. Add its returned identifier to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "idea-hub-github"
database_id = "RETURNED_DATABASE_ID"
```

3. Apply `schema.sql` ONLY to that empty database. It creates tables without dropping data. Use tracked migrations for later schema changes.
4. Set three encrypted Worker secrets through Cloudflare's dashboard or Wrangler's hidden prompts: `FIREBASE_API_KEY` (the existing Idea Hub Firebase project's Web API key), `RATE_LIMIT_SALT` (at least 32 random characters), and `ADMIN_UIDS` (comma-separated Firebase UIDs for the owner accounts). Never commit their values, put them in shell arguments, or send them in chat. Verify owner UIDs in Firebase Authentication; never derive them from client requests.
5. Keep Email/Password authentication enabled in the existing `quotecraft-idea-hub` Firebase Spark project. Use Firebase's hosted verification and password-reset handler. Do not disable email verification, activate SMS, upgrade to Blaze, or change the other site's settings. Review API-key restrictions: browser-only referrer restrictions will not work for the Worker. Obtain authorization if existing key restrictions need changing.
6. Deploy `idea-hub-github` with this configuration, then verify `/api/health` and CORS from `https://quotecraftstudio.github.io`.
7. Set only the verified endpoint URL in `idea-hub/config.js`; update its CSP allowlist if the hostname differs. No service key belongs in the frontend.
8. Test real verification-email delivery, password reset, sign-in, and an owner approval cycle before calling the community launched. Missing configuration fails closed.

Commands after installing official Wrangler and authorizing it:

```text
wrangler d1 create idea-hub-github
wrangler d1 execute idea-hub-github --remote --file=backend/schema.sql --config=backend/wrangler.toml
wrangler deploy --config=backend/wrangler.toml
```

Secrets can be added after deployment; posting remains closed until all required values exist. Health checks verify schema columns as well as configuration. The maintenance cron removes expired rate-limit rows daily.

## Behavior

Firebase account lookup validates tokens, disabled state and email verification server-side. Profiles use separate random public IDs. New posts and edits are pending until moderation. Members control only their own content. Moderator roles live in D1; owner administrators come only from Worker secrets. Moderators review, remove, lock, pin, and resolve reports; owners manage moderator roles and suspension. Suspended members can still submit support requests.

Input is bounded, SQL is parameterized, writes require the exact site Origin, and hashed-IP/account rate limits constrain abuse. CORS is not authentication; protected routes require a token. Browser output uses text nodes. Passwords/tokens are not logged or written to D1. Worker observability is disabled. Tokens stay in tab memory and expire in about one hour; reload/sign-out ends the local session. Refresh tokens are discarded.

Deletion removes message text from the active database; metadata/audit remain for review. Account deletion and privacy requests need manual owner handling after identity verification in both Firebase and D1. Free service quotas can interrupt availability.
