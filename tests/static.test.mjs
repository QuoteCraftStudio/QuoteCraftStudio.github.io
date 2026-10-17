import {execFileSync} from 'node:child_process';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync,readdirSync} from 'node:fs';import {resolve,dirname} from 'node:path';
const root=resolve('.'),read=p=>readFileSync(p,'utf8');
test('all local HTML links and assets resolve; canonical URLs use the GitHub hostname',()=>{for(const name of readdirSync('idea-hub').filter(x=>x.endsWith('.html'))){const path='idea-hub/'+name,html=read(path);assert.match(html,/<html lang="en">/);assert.match(html,/<meta name="viewport"/);assert.match(html,/https:\/\/quotecraftstudio.github.io\/idea-hub\//);for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const url=m[1];if(/^(https?:|#|mailto:)/.test(url))continue;let target=resolve(dirname(path),url.split('#')[0]);if(url.endsWith('/'))target=resolve(target,'index.html');assert.ok(existsSync(target),path+' -> '+url);}}});
test('frontend uses plain text rendering and has no keys or token persistence',()=>{const js=read('idea-hub/app.js');assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|localStorage|sessionStorage|eval\(/.test(js));for(const name of readdirSync('idea-hub'))if(/\.(html|js|css)$/.test(name))assert.ok(!/AIza[0-9A-Za-z_-]{30,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|service_role/.test(read('idea-hub/'+name)));});
test('sitemap lists every public page and robots points to it',()=>{const xml=read('sitemap.xml');for(const name of ['terms','privacy','guidelines','safety'])assert.ok(xml.includes(`/idea-hub/${name}.html`));assert.match(read('robots.txt'),/Sitemap: https:\/\/quotecraftstudio.github.io\/sitemap.xml/);assert.ok(!xml.includes('whc'));});
test('policies and consent version match the application',()=>{assert.match(read('backend/worker.mjs'),/TERMS = '2026-10-17'/);assert.match(read('idea-hub/app.js'),/TERMS='2026-10-17'/);for(const name of ['terms','privacy','guidelines'])assert.match(read('idea-hub/'+name+'.html'),/October 17, 2026/);});

test('screened POST requests have a longer timeout than GET requests',()=>{const js=read('idea-hub/app.js');assert.match(js,/AbortSignal\.timeout\(data\?30000:15000\)/);});

test('deployed browser and Worker scripts pass JavaScript syntax checks',()=>{for(const file of ['idea-hub/app.js','idea-hub/config.js','backend/worker.mjs','backend/moderation.mjs','idea-hub/session-agreement.js'])execFileSync(process.execPath,['--check',file],{stdio:'pipe'});});

test('agreement appears at sign-in, not on every post, comment or profile save',()=>{
 const js=read('idea-hub/app.js');
 // One checkbox in sign-in and a recovery agreement dialog for already-signed-in tabs.
 assert.equal(js.split('agreement(f);').length-1,2);
 assert.ok(js.includes('agreementAccepted=true'));
 assert.ok(js.includes('if(!agreementAccepted){agreementDialog(next)'));
 assert.ok(!js.includes('if(!consentProof){authDialog()'));
 assert.ok(js.includes('withSessionAgreement(path,data'));
 assert.match(js,/consentProof=v\.consentProof\|\|''/);
 assert.match(js,/X-Idea-Hub-Agreement/);
 assert.match(read('backend/worker.mjs'),/X-Idea-Hub-Agreement/);
 assert.match(read('backend/worker.mjs'),/crypto\.subtle\.verify\('HMAC'/);
});
