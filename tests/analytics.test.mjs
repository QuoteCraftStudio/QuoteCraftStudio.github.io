import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const token = '6d8d6cce56524bafa3096c35221ce2cf';
const pages = [
  'index.html',
  'idea-hub/index.html',
  'idea-hub/guidelines.html',
  'idea-hub/safety.html',
  'idea-hub/terms.html',
  'idea-hub/privacy.html',
  'idea-hub/mobile/index.html',
  'idea-hub/mobile/readme.html',
];

for (const file of pages) {
  test(`Cloudflare visit counter is installed once in ${file}`, () => {
    const html = readFileSync(file, 'utf8');
    assert.equal(html.split('https://static.cloudflareinsights.com/beacon.min.js').length - 1, 1);
    assert.ok(html.includes(`data-cf-beacon='{"token":"${token}"}'`));
    assert.ok(html.indexOf('beacon.min.js') < html.lastIndexOf('</body>'));
    if (file !== 'index.html') {
      assert.match(html, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
      assert.match(html, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
    }
  });
}
test('Forum privacy notice discloses aggregate Web Analytics', () => {
  const policy = readFileSync('idea-hub/privacy.html', 'utf8');
  assert.match(policy, /Cloudflare Web Analytics/);
  assert.match(policy, /aggregate page views and visits/);
  assert.doesNotMatch(policy, /no advertising, tracking analytics/);
});
