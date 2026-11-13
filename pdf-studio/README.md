# QuoteCraft PDF Studio — development checkpoint

## Scope (2026-11-13)
This isolated GitHub branch contains only the QuoteCraft PDF Studio source and related documentation. It does not change the live website or any tunnel, connector, MCP server or other application.

## Recovered source
The starting HTML came from the latest located `pdf-studio.html` in Google Drive (modified 2026-10-29, 54,059 characters). Two older PDF Studio layouts were reviewed for comparison.

## GitHub checkpoints
- `561aafe85e3acd20e41b26cdc404857bf8935488` — original recovered PDF Studio source.
- `aa59b61a412954b20eb2d24ac37a92b6fa75cef1` — new document/template controls, shared PDF-generation pipeline, preview, print.
- `81b9632a7adffb3211a943e44bf2ef1f39a3a8bf` — preserve existing exported file naming.

## New controls
- **New**: blank US Letter PDF, business-letter template, simple-invoice template.
- **Preview**: browser PDF preview of the fully exported document including edits, signatures and annotations.
- **Print**: uses the same generated PDF and browser print dialog.
- **Export PDF**: retains its existing filename suffix and now uses the same shared output pipeline.

## Verification performed
- Updated JavaScript parsed successfully in a V8 syntax check.
- GitHub source was fetched back and its content SHA verified.
- Downloaded updated branch to a temporary verification file on Ryzen; all four expected feature markers were found and the temporary HTML removed.
- Subsequent browser tests verified PDF generation, overlay export, preview controls, and real PDF.js page rendering. The native OS printer dialog and physical printing have **not yet been verified**.
- No changes were published to the production website.

## Remaining steps
1. Manually verify the native browser/OS printer dialog, page ranges and physical or PDF printer output.
2. Confirm the actual website deployment source before publishing.
3. Move the PDF Studio project into its own dedicated GitHub repository when repository-creation access is available, retaining the Git history.

## Recovery
Use the GitHub branch `feature/pdf-studio-print-preview-20261113`; its original unmodified source is available at the first commit. Do not merge or publish without passing browser tests.

## 2026-11-13 verification update

### Verified source alignment
The live page was checked at `https://quotecraftstudio.ca/pdf-studio/`. The updated branch now retains the exact existing live metadata description, inline PWA manifest, relative home link, and privacy/terms links. These are preserved in commit `2cdaf304ca12465418b3cacb71f7d32c1f9e2acd`.

### Successful Chrome smoke tests on Ryzen
Using temporary files and an isolated headless Chrome profile (deleted after testing):
- PDF-lib generated and reloaded a valid **blank** one-page PDF (645 bytes).
- PDF-lib generated and reloaded a valid **business letter** one-page PDF (1,327 bytes).
- PDF-lib generated and reloaded a valid **simple invoice** one-page PDF (1,328 bytes).
- Shared export generated a valid PDF.
- Multi-page export retained two pages, a 90-degree rotated page, and an ink overlay.
- Preview opened, used a PDF blob URL, enabled its manual Print control and closed correctly.
- The print-control event handler was verified with a simulated print-window call. **Actual printer dialog or physical printing remains untested**.

### Production deployment
The code is not yet deployed to WHC; the existing live editor has been left unchanged. The branch is a checkpoint, not a verified public release. To publish, confirm the WHC deployment method and run a real-browser print test. Only replace the PDF Studio app route; do not alter other website files, connectors, tunnels or MCP servers.

## Verified final browser test and rollback checkpoint

- Chrome opened the updated PDF Studio over a temporary HTTP server bound to `127.0.0.1` (not a production service).
- Using a real browser session and actual PDF.js (no mocked document viewer), **New > Blank** rendered **1 / 1** with a canvas width of **796px** and no JavaScript/browser errors.
- Clicking **Preview** opened the actual PDF blob preview successfully.
- Temp browser profile, temporary HTTP server and test files were stopped/removed after testing.
- The exact website source *before the changes* is saved at `pdf-studio/recovery/live-before-print-update-2026-11-13.html` (commit `648433393fbf0268e59f8ae83893625062cee728`). **SHA-256 on GitHub and the live WHC page matched exactly**: `A39AB24D9C690FFA15360E83A60C06CBA6B220A53CA613406D7D02AE83BE4A02`.
- The updated branch retains the live metadata, manifest, home link and legal links.
- Production website remains unchanged as of this checkpoint. A publishing mechanism to WHC has not been verified.
