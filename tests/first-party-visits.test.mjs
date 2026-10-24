import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pages = [
  'index.html',
  'idea-hub/index.html',
  'idea-hub/mobile/index.html',
  'idea-hub/privacy.html',
  'idea-hub/guidelines.html',
  'idea-hub/safety.html',
  'idea-hub/terms.html',
  'idea-hub/mobile/readme.html',
];
for(const file of pages){
  test(`first-party daily counter loads once on ${file}`, () => {
    const html = readFileSync(file, 'utf8');
    const script = 'https://quotecraftstudio.ca/qc-counter.php?js=1';
    assert.equal(html.split(script).length - 1, 1);
    assert.ok(html.lastIndexOf(script) < html.lastIndexOf('</body>'));
    assert.ok(html.includes('static.cloudflareinsights.com/beacon.min.js'), 'existing Cloudflare tracking must remain');
    if(file !== 'index.html'){
      const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
      assert.ok(csp,'preserve CSP');
      assert.match(csp,/script-src[^;]*https:\/\/quotecraftstudio\.ca/);
      assert.match(csp,/connect-src[^;]*https:\/\/quotecraftstudio\.ca/);
      assert.match(csp,/https:\/\/cloudflareinsights\.com/);
    }
  });
}
test('privacy notice covers first-party aggregate counting and session storage',()=>{
  const html=readFileSync('idea-hub/privacy.html','utf8');
  assert.match(html,/first-party counter/);
  assert.match(html,/daily totals by site/);
  assert.match(html,/session storage prevents repeated counting within 30 minutes/);
});
