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
