# Idea Hub — Codex Resume Handoff

## Resume checkpoint: October 16, 2026
AI implementation is prepared, not deployed. Start with the current section in
CODEX_PROGRESS.md and backend/AI_MODERATION.md. All 28 local tests pass. Do not
repeat infrastructure setup. Real inference passed after Workers Free confirmation;
production remains subject to explicit approval after preview results. The
provided ZIP draft has been inspected, and live source retrieval revealed an
undefined checkContentSafety call in production posting. Keep review changes
off main until deployment approval, because main also publishes frontend files.

Prepared 2026-10-14. **Read this before doing new work.**

## Project identity
- Repository: https://github.com/QuoteCraftStudio/QuoteCraftStudio.github.io (main)
- Forum: https://quotecraftstudio.github.io/idea-hub/
- Official brand: **QuoteCraft Studio**
- Official homepage: https://quotecraftstudio.ca/
- No CoolCraft Studio homepage exists. Fix incorrect Code Craft/CoolCraft business labels only when verified, without breaking unrelated URLs.

## Start here
1. Read root `AGENTS.md` and `CODEX_PROGRESS.md` and this handoff.
2. Inspect latest Git changes and only the files required for the next incomplete task.
3. Do **not** rebuild the site, reinstall dependencies unnecessarily, repeat prior research, or incur charges.
4. Save focused verified changes as small commits and update the progress file before stopping.

## Verified repository findings
- Root `index.html` brands Idea Hub as QuoteCraft Studio and links the brand to the official homepage.
- `idea-hub/index.html` includes the forum UI, sign-in controls, search, categories, moderation links, and policy links.
- `idea-hub/app.js` contains frontend logic for registration, email verification, profiles, discussions, replies, reports, and moderation. This is **code presence, not live end-to-end verification**.
- The forum HTML references a Cloudflare Worker endpoint in its content security policy.
- Most recent changes: created `AGENTS.md` and `CODEX_PROGRESS.md`, fixed the forum brand homepage link, removed duplicate footer policy links.
- No open GitHub issues or PRs were returned during inspection.

## Earlier development milestones from commit messages (not proof of live function)
- `eed039f`: community frontend and isolated backend, authentication and moderation.
- `a281bde`: connection to isolated free backend.
- `0ff163f`: documented free-backend deployment permissions.
- `d2705a5`: policy links.
- `0ca35b3`: Idea Hub homepage.
- `a042972`: homepage logo link.
- `6059a09`: forum homepage link and footer cleanup.
- `a8cb3b9`: checkpoint update.

## Next work in priority order
1. Verify GitHub Pages live deployment matches current main, especially homepage link and footer.
2. Inspect existing backend documentation and configuration before any backend action. Do not expose secrets or redeploy without need.
3. Perform safe, focused checks of registration, verification, sign-in, profiles, discussions, replies, moderation, reporting and password reset. Obtain approval before creating real production test accounts or public posts.
4. Verify privacy, terms, guidelines and safety links, plus mobile/accessibility behavior.
5. Fix remaining incorrect business branding with minimal patches.
6. Update `CODEX_PROGRESS.md` with confirmed results, exact blockers, files changed, tests, and next step.

## Efficiency and safety
Use minimal edits and targeted tests. Preserve the Reddit-style design and functioning features. Never purchase services or credits. If an approach fails twice, diagnose and log instead of looping. Before quota exhaustion or interruption, record the exact checkpoint so the next session can resume without rediscovery.

## Resume prompt
> Read AGENTS.md, CODEX_PROGRESS.md, and IDEA_HUB_CODEX_HANDOFF.md. Resume Idea Hub at the last verified checkpoint. Begin with deployment and backend verification; avoid repeating completed work, rebuilding the site, or incurring costs.


