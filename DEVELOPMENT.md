# Idea Hub development

The original homepage is preserved. The robots allow rule and sitemap location are retained, with development directories excluded from crawling. Original remote revision: `e3446ea9362fa6f3d6cf445c79764cdda3ec52a0`. Restore individual files from that revision if needed; do not reset unrelated later work.

The static site deploys from `main` at the repository root. `.nojekyll` keeps deployment buildless. The separate backend is documented in `backend/README.md`. No WHC content or other repository is part of this deployment.

Use Node 22.13+ (Node 24 used for development):

```text
node --test tests/*.test.mjs
node tools/preview.mjs
```

The preview binds only to localhost. To test with an in-memory database and synthetic accounts, set `IDEA_HUB_MOCK=1` before starting it. Test addresses beginning with `admin` and `bob` select the corresponding synthetic identities; other addresses select `alice`. These fixtures are used only by the local server, never the deployed Worker. Never use real passwords in mock tests.

`node tools/policies.mjs` regenerates the four static policy pages and sitemap. Review policy wording against actual operating practices before changing providers or retention. The policies are a starting operational document, not a legal-compliance certification.

The browser CSP supports only same-origin resources and the designated API. Because GitHub Pages cannot set arbitrary response headers, CSP is provided via a meta element; anti-framing response headers are not supplied by this host. No rich HTML posts, file attachments, private messaging, or third-party scripts are enabled. Profiles/display names are public and non-unique.

Indexing preparation includes canonical URLs, descriptions, robots and sitemap. Search submission and confirmed indexing are separate; this release does not claim indexing. Discussion contents load through the API and share links use a fragment, so dedicated crawlable per-discussion pages are a future enhancement.
