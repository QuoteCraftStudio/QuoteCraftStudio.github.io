# Idea Hub Mobile

A lightweight, standalone **installable web app** for the existing QuoteCraft Studio Idea Hub community, designed for phones and compact desktop windows.

**Public installation URL (after GitHub Pages deployment):**
https://quotecraftstudio.github.io/idea-hub/mobile/

Features:
- Compact phone-sized interface (500 px desktop maximum) with user-controlled Expand/Compact and true Full screen toggle where the browser supports it.
- Filter discussions by category, search, browse threads, read comments, write posts, reply, report, view/delete your own content, and sign in/register.
- One agreement checkbox per new sign-in; uses the existing backend consent proof or the compatibility fallback. No new accounts, databases, billing, or backend deployment.
- Responsive layout, semantic buttons, high-contrast focus, 44 px targets, content rendered as text rather than HTML injection.
- Manifest, SVG icon, and narrow-scope service worker for public static files only; authentication tokens/API data are NEVER stored in local/session storage or cached. Offline reading/posting is not supported.
- The mobile app uses `../config.js` and `../session-agreement.js` and **must be hosted on https://quotecraftstudio.github.io**. Opening the HTML via file:// only previews the layout; direct API writes will fail Cloudflare's allowed Origin restriction.
- No APK included: install using Chrome's Add to Home screen / Install app menu. Android Chrome may show Install depending on browser installability support; Add to Home screen remains the fallback.
- To leave the mobile view, use the QC / Idea Hub logo in the app header, which opens the full community forum.

Please test on a physical phone before publishing as a Play Store app. No Firebase secrets or administrator identifiers are bundled.
