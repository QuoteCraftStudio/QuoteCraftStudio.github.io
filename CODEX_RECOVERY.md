# QuoteCraft Studio Website — Recovery Record

## Current checkpoint
- Date: 2026-11-13
- Project: QuoteCraft Studio GitHub Pages website repository
- Repository: https://github.com/QuoteCraftStudio/QuoteCraftStudio.github.io
- Branch: `main`
- Latest verified commits before this recovery update: preview page `e35fcb41fe6d06c58682de239dc596c319117695`; progress record `129a42bf68ed75c036cf0150f58325f6eb0a2f6b`.
- Previous instructions commit: `ab461449d9204795ebb55b44a1cf041df74d66d9`
- Website/application source version: unchanged by this documentation-only checkpoint

## Completed
- Updated `AGENTS.md` with GitHub-only permanent storage, per-project repositories, incremental remote commits, and new-chat recovery rules.
- Updated `CODEX_PROGRESS.md` with the November 13, 2026 policy checkpoint.
- Fetched both files again from GitHub and verified the new policy text and commit references.

## Files changed
- `AGENTS.md` — permanent project instructions.
- `CODEX_PROGRESS.md` — progress history.
- `CODEX_RECOVERY.md` — this recovery record.

## Verification and tests
- GitHub readback verification: passed for `AGENTS.md` and `CODEX_PROGRESS.md`.
- Application tests: not run; no application source or behavior was changed.
- Website deployment: not requested as part of this documentation-only task and not claimed.

## Storage rule
- GitHub is the only permanent storage location for project source, progress, changelogs, checkpoints, test reports, recovery records, and handoff instructions.
- Do not save persistent project copies or backups to Google Drive, OneDrive, the PC, or another storage service.
- Temporary local working files may be used only for active editing/testing. Push and verify each completed checkpoint in the correct project repository.
- Never commit credentials, tokens, private keys, or other secrets.

## Next action
- When continuing the PDF Studio update, first identify the correct PDF Studio source and its dedicated GitHub repository. Resume from its latest verified remote commit, inspect its instructions and history, and keep every incremental checkpoint in that repository. Do not assume a PDF Studio repository exists until it has been located.

## Known limitation
- ChatGPT account-level Custom Instructions cannot be edited through the available settings integration. The owner must paste the supplied GitHub-only policy into Settings > Personalization > Custom Instructions.

## 2026-11-13 — PDF Studio preview handoff

- Public preview path: `pdf-studio-preview/index.html`
- Public preview URL: https://quotecraftstudio.github.io/pdf-studio-preview/
- Preview source is copied from the verified private project `QuoteCraftStudio/QuoteCraft-PDF-Studio` main branch, commit `392c7a04514d79e5af5024762e13213524f2d8b3`, file `index.html` (blob `24e6b9585c06461ae2b4226277e81ffc24507f2b`).
- Preview-only changes: title/description, noindex, visible PREVIEW COPY badge, no PWA manifest, main-site home/privacy/terms links. No app feature logic changed.
- Public preview commit: `e35fcb41fe6d06c58682de239dc596c319117695`.
- Recovery branch created before preview: `recovery/before-pdf-studio-preview-20261113`, based on `249683854c1c372dd9bbbaa812ed92db86e1c459`, verified by reading back `AGENTS.md`.
- Verification: public HTTP 200; preview title/badge/noindex confirmed; existing WHC `/pdf-studio/` returned HTTP 200 and original 56,189-byte page; real Chrome test against the public preview passed all six test groups (blank, letter, invoice, preview/print control, mobile viewport, close).
- Production editor at WHC remains unchanged. No tunnel, connector, MCP, DNS, root homepage or Idea Hub application file was changed.
- Next action for the PDF Studio project: manually verify the native print dialog, then separately complete the approved WHC production deployment with a tested rollback.


## 2026-11-21 — AdSense verification snippet checkpoint
- Project: QuoteCraft Studio GitHub Pages / Idea Hub landing site.
- Repository: https://github.com/QuoteCraftStudio/QuoteCraftStudio.github.io
- Branch: `main`.
- AdSense publisher script for `ca-pub-2323688612396528` added to `index.html` inside the document `<head>`.
- Source commit: `3703ce0404217f3b576e08320b602099ebf34985`.
- Progress record update: `9e18c169b2cc4ab596f5b8830454b92d71426a64`.
- Live verification: `https://quotecraftstudio.github.io/` returned HTTP 200 and the exact publisher script was found inside `<head>`.
- Main `quotecraftstudio.ca` is separately hosted and is not served from this repository. It was checked after the GitHub update; the script is not yet present there. The N95 Visual Editor connector was unavailable (tunnel client not seen), so no WHC files or settings were changed.
- The live Idea Hub application page `idea-hub/index.html` has a restrictive static Content Security Policy. It was intentionally left unchanged; do not weaken that policy just to load AdSense. Review a CSP-compatible integration before adding ad code to that app page.
- Changed files: `index.html`, `CODEX_PROGRESS.md`, `CODEX_RECOVERY.md`.
- Test/verification: GitHub file readback passed; live root page HTTP 200 and code-in-head check passed. Full automated tests not run because this was a narrow static HTML insertion.
- Next action: In AdSense, select the `quotecraftstudio.github.io` site entry, tick “I've placed the code”, and click Verify. Separately add the same publisher script to the WHC-hosted `https://quotecraftstudio.ca/` homepage through its approved Visual Editor when the N95 Visual Editor connection is available; then verify that domain independently.
