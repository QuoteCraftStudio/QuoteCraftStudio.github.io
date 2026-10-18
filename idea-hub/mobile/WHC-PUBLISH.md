# Publish Idea Hub Mobile from QuoteCraftStudio.ca (WHC host)

**Why the bridge is needed.** Idea Hub's existing Cloudflare Worker authorizes requests from `https://quotecraftstudio.github.io`. Uploading the actual mobile JavaScript into the WHC domain would send authenticated API requests from `https://quotecraftstudio.ca`, which the current Worker rejects. Do not change production CORS or copy the mobile code to WHC without coordinated Worker tests and rollout.

**Safe release approach.** The public QuoteCraftStudio.ca website can host a tiny `/idea-hub/mobile/` entry page that immediately opens the working secure mobile PWA at `https://quotecraftstudio.github.io/idea-hub/mobile/`. This preserves the existing Verified Account / post / comment system, HTTPS, and the public forum database without changing or exposing credentials.

1. Back up existing `public_html` files before editing.
2. Upload and extract the provided `QuoteCraftStudio-ca-IdeaHub-Mobile-Bridge.zip` into **WHC cPanel public_html**. Its only website file is `idea-hub/mobile/index.html`; no existing homepage or forum file is overwritten. If that path already exists, stop and review before overwriting.
3. Open `https://quotecraftstudio.ca/idea-hub/mobile/` and check it redirects to the secure working GitHub PWA.
4. Add a small `Idea Hub Mobile` link to the app list on QuoteCraftStudio.ca pointing to `/idea-hub/mobile/` (or directly to the GitHub Pages PWA), after reviewing current home page source.
5. Verify the WHC HTTPS certificate in the browser by loading `https://quotecraftstudio.ca` with no warnings. GitHub Pages manages its own certificate independently. Do not upload a fabricated certificate or change DNS.
6. Test sign-in, one agreement checkbox, creating a test post and comment from a phone, and the small optional PayPal donation link. Do not enter payment details into the app; PayPal handles any donations.

**Do not confuse signatures with TLS.** The GitHub Actions release workflow produces a Sigstore signed provenance attestation for a zip of the mobile source on successful runs. This is not a native Android APK signature or an X.509 SSL certificate. The WHC bridge itself is not a signed APK, and HTTPS is configured by WHC.

**Status:** The bridge file is prepared but not deployed to WHC without an authenticated and authorized cPanel session.
