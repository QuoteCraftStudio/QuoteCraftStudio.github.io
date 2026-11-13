# QuoteCraft Studio — Permanent Codex Instructions

These instructions apply to every QuoteCraft Studio programming task unless the owner explicitly changes a requirement. Follow them in this order. Project-specific instructions may add detail but must not silently weaken the recovery and safety rules.

## 0. NON-NEGOTIABLE FIRST PRIORITY: SAVE AND MAKE WORK RECOVERABLE IN GITHUB ONLY

**Protect existing work before editing. Save continuously during execution, not merely at the end.** Recovery takes priority over adding features or polishing code.

1. At the start of an existing project, inspect the working directory, Git status (including untracked files), recent commits, current branch, and any recovery notes. Never assume the previous Codex session finished or committed its work.
2. Before risky changes, create a GitHub recovery point first: use a dedicated recovery branch, tag, or checkpoint commit in the same project repository. Preserve unfinished work and important non-secret configuration. Verify the commit or branch exists on GitHub before editing. Do not create backup copies on the PC, Google Drive, or another storage service.
3. Divide work into small, independently testable sections. After **each** section: save the changed files to the project's GitHub repository, run relevant tests, record results, create a descriptive Git commit, push it to GitHub, verify the remote commit, and update the recovery record. Never accumulate many finished sections without a GitHub checkpoint.
4. Do **not** wait for a usage-limit warning. Codex may stop without notice. Make durable checkpoints proactively, especially **before** long tool calls, builds, refactors, or deployments. If time or usage appears limited, stop starting new work and prioritize recovery and verification.
5. Preserve incomplete but valuable changes on a clearly labeled GitHub work-in-progress or recovery branch. Never merge untested changes into a verified stable release. Record failing tests and unfinished steps in the repository.
6. GitHub is the only approved persistent storage for QuoteCraft project work. Push suitable checkpoints to the project's own GitHub repository and verify the remote commit exists. If GitHub is unavailable or a push fails, stop before accumulating further changes and report the exact blocker; do not substitute Google Drive, the PC, or another storage service. A temporary workspace or conversation is never a saved checkpoint.
7. Never claim that a file, test, backup, commit, push, signing operation, or deployment succeeded without verification. Report missing tools or inaccessible storage as limitations.

### Required recovery records for substantive or continuing work

Maintain the project's existing progress file (for example, `PROGRESS.md` or `CODEX_PROGRESS.md`) and `CODEX_RECOVERY.md` in the project repository. Create missing records on GitHub. Update after each verified section and before stopping, without erasing useful prior history.

`PROGRESS.md` must contain: current objective, completed sections, remaining tasks, current blockers, versions, and test results.

`CODEX_RECOVERY.md` must contain: project name; date and current version; GitHub repository URL, branch, and last verified remote commit; changed files; implemented and incomplete features; test commands/results; important architecture decisions; known defects; exact commands or steps to restore, test, and resume from GitHub; and the **single next action**. Do not put secrets in this document. Do not record local or Drive backup locations.

A new session resuming a substantive project must read the applicable `AGENTS.md`, `PROGRESS.md`, `CODEX_RECOVERY.md`, and relevant Git history **before** making changes. If any are missing, inspect actual files and reconstruct the record without guessing.

## 1. Understand and Protect the Project

- Interpret the owner's everyday language; ask only when a missing decision genuinely blocks safe work.
- Inspect relevant existing code and behavior before changing it. Identify the root cause of bugs, not just symptoms.
- Protect the last known working release, existing user data, and encryption or signing identities.
- Make narrowly scoped, reversible changes. Avoid unrelated refactoring and unnecessary dependencies.
- Preserve functioning interfaces, APIs, databases, website behavior, build workflows, and deployment settings unless a change is specifically authorized.

## 2. Implement in Small Verified Sections

For each section: **inspect → plan briefly → back up if risky → edit → test → save → checkpoint → update recovery notes → continue**.

- Write clear, secure, maintainable code; use helpful comments and documentation without clutter.
- Refactor only when it safely improves correctness or maintainability.
- Consider performance, memory use, compatibility, error handling, and edge cases.
- Run relevant focused tests after each section and appropriate regression/build tests before release. State plainly when a test cannot be run.
- Fix observed failures before declaring the affected section complete. Never treat a mocked integration test as proof of a real production connection.

## 3. Security and Change Authorization

- Never expose passwords, tokens, API keys, private certificates, customer data, or other confidential material in source, logs, archives, chat, or GitHub.
- Review authentication, permissions, dependencies, and security-sensitive changes. Use HTTPS/TLS correctly for networked websites and services.
- Android release updates must preserve the existing application signing identity; use the appropriate signing certificate/key only through secure authorized procedures.
- Sign Windows executables or installers when a valid authorized code-signing certificate is available. Never invent certificates or claim unsigned builds are signed.
- Do not delete data, rewrite history, force-push, deploy to production, publish websites, replace signing keys, or change production settings without explicit authorization.
- Maintain separate approval for consequential publishing/deployment operations even when editing access has been granted.

## 4. Versioning, Releases, and Backups

- Maintain consistent semantic versions where appropriate, build dates, and a meaningful `CHANGELOG.md`.
- Keep version information consistent in application UI, package metadata, installers, and release archives; do not add redundant version numbers to every source file.
- Preserve known-good versions through GitHub commits, tags, and releases. Keep recovery copies and project progress inside the same project's GitHub repository only. Do not use Google Drive or the PC as a persistent backup location. Verify release archives can be opened. Record checksums when producing distributable packages.
- Verify actual build and install outputs on applicable platforms when possible; distinguish local tests from real-device or live-service verification.

## 5. Communication and Completion

- Explain important changes and any needed manual steps in simple English.
- For each checkpoint, report what was changed, what was tested, the GitHub repository/branch/commit where it was saved, and what is still unresolved.
- At the end, verify that requirements were implemented, regression checks were run, version/changelog updates are appropriate, and recovery files point to accessible checkpoints.
- If interrupted or blocked, prioritize a truthful, precise recovery handoff over an unverified claim of completion.

**Operating rule: PRESERVE → ONE SECTION → TEST → SAVE → VERIFY CHECKPOINT → DOCUMENT RECOVERY → NEXT SECTION. Never postpone recovery until a usage limit approaches.**

## 6. GitHub-only persistence and per-project repositories

- Every QuoteCraft application or independent project must have its own GitHub repository. Keep each project's source, progress, changelog, test reports, recovery notes, handoff instructions, and version history in that project's repository.
- GitHub is the single source of truth and the only permanent storage location for QuoteCraft development. Do not save progress backups, recovery copies, or project archives to Google Drive, OneDrive, the PC, or another storage service.
- A temporary working directory may be used only when needed to edit or test. It is not a saved checkpoint or backup. Push every completed checkpoint to the correct GitHub repository and verify it remotely before moving on.
- If a project does not yet have its own repository, identify the correct repository plan and obtain any genuinely necessary approval before creating one. Do not silently mix unrelated applications in one repository.
- Never commit passwords, API keys, tokens, private keys, signing credentials, or other secrets. GitHub-only storage does not override security requirements.
- When a new chat or coding session starts, read the repository's AGENTS.md, progress record, recovery record, changelog, and recent Git history before continuing. Resume from the latest verified remote commit; do not repeat completed work.

---

## QuoteCraftStudio.github.io-specific instructions (preserved)

Official brand: QuoteCraft Studio. Official homepage: https://quotecraftstudio.ca/
Do not introduce "CoolCraft Studio" or "Code Craft Studio" as the business name. Preserve unrelated project names and existing URLs.
Before editing, inspect the relevant files, git changes, and CODEX_PROGRESS.md. Do not repeat completed work.
Prefer minimal, focused patches. Preserve the existing Idea Hub forum design, working features, privacy, security and accessibility.
Avoid whole-site rewrites, unnecessary installs, repetitive scans, and repeated failing commands. After two identical failures, stop and document the issue.
Run focused tests; never claim deployment or successful tests without verification. Do not incur charges.
After each meaningful task update CODEX_PROGRESS.md with completed work, files changed, verification, blockers, and next step. Resume from last verified checkpoint.
Do not expose secrets, alter authentication, or make unrequested paid infrastructure changes.
