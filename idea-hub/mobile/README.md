# Idea Hub Mobile

A lightweight, standalone **installable web app** for the existing QuoteCraft Studio Idea Hub community, designed for phones and compact desktop windows.

**Live secure app:**
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

## QuoteCraftStudio.ca publishing
The current Cloudflare Worker authorizes the original Origin `https://quotecraftstudio.github.io`. Hosting a direct **copy** under `https://quotecraftstudio.ca` would break signed-in actions without a separately reviewed backend Origin / CORS deployment. The safe integration on the existing QuoteCraftStudio.ca website is a navigation link (or a simple redirect route) to the live GitHub Pages PWA, not an iframe or copied app code. Site visitors can install from that HTTPS URL; the application remains fully functional with its existing accounts and data.

## Donation
The tiny optional Donate link at the bottom opens the existing official QuoteCraft Studio PayPal donation page at `https://www.paypal.com/ncp/payment/W82M2TVHZ4KUY` in a new tab. The app never collects payment details and contains no payment provider keys.

## Privacy and security
- The app footer links to the full published [Privacy Policy](https://quotecraftstudio.github.io/idea-hub/privacy.html), [Terms](https://quotecraftstudio.github.io/idea-hub/terms.html) and [Community Guidelines](https://quotecraftstudio.github.io/idea-hub/guidelines.html).
- Only public profile names, bio and approved discussions/comments are public. Private account information is handled by the existing Firebase/Cloudflare forum backend.
- Passwords, bearer tokens and policy consent proof remain only in the active browser tab's memory; no local storage, cookies from the application, analytics trackers or API data in the service worker cache. Sign-in, posting and replying require an active HTTPS connection.
- Users should not include private data in public posts. Public text is screened with Workers AI, and unsafe/flagged posts are held for human moderator review.

## HTTPS / certificate / release authenticity
- `https://quotecraftstudio.github.io` is HTTPS-protected by the GitHub Pages hosting TLS certificate. HTTPS for `quotecraftstudio.ca` is controlled **separately** by the current WHC host; certificate installation/renewal is not controlled by an HTML app.
- The installable PWA is HTML/JavaScript, **not a signed Android APK**. No Android signing certificate is created or claimed.
- The GitHub release workflow `.github/workflows/idea-hub-mobile-signed-release.yml` packages the app, calculates SHA-256, and attempts to create a Sigstore/GitHub Actions build-provenance attestation using GitHub OIDC. Verify the workflow succeeds before calling a release package attested. This verifies repository build provenance, **not** app safety, end-to-end behaviour, or an Android code-signing certificate.

Please test on a physical phone before distributing broadly. No Firebase secrets or administrator identifiers are bundled.
