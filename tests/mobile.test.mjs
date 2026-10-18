import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>readFileSync(path,'utf8');
const html=read('idea-hub/mobile/index.html');
const app=read('idea-hub/mobile/mobile.js');
const style=read('idea-hub/mobile/mobile.css');
const manifest=JSON.parse(read('idea-hub/mobile/manifest.webmanifest'));

test('mobile app is compact, responsive and works on the actual forum origin',()=>{
 assert.match(html,/id="category"/);
 assert.match(html,/id="feed"/);
 assert.match(html,/id="nav-post"/);
 assert.match(html,/id="fullscreen-toggle"/);
 assert.match(html,/id="layout-toggle"/);
 assert.match(html,/class="donate-tiny"/);
 assert.match(html,/https:\/\/www\.paypal\.com\/ncp\/payment\/W82M2TVHZ4KUY/);
 assert.match(html,/href="\.\/readme\.html"/);
 assert.match(html,/href="\.\.\/privacy\.html"/);
 assert.match(read('idea-hub/mobile/readme.html'),/Privacy Policy/);
 assert.match(style,/max-width:500px/);
 assert.match(style,/\.app-shell\.wide/);
 assert.match(html,/https:\/\/idea-hub-github\.quotecraft300\.workers\.dev/);
});
test('all local mobile files exist and parse',()=>{
 for(const path of ['idea-hub/mobile/mobile.js','idea-hub/mobile/sw.js','idea-hub/session-agreement.js'])
  execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
 for(const p of ['idea-hub/mobile/mobile.css','idea-hub/mobile/manifest.webmanifest','idea-hub/mobile/icon.svg'])assert.ok(read(p).length>100);
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./');
});
test('mobile app shares the current Idea Hub backend and protects sessions',()=>{
 assert.match(app,/import \{API\} from '\.\.\/config\.js'/);
 assert.match(app,/withSessionAgreement/);
 assert.match(app,/auth\.proof/);
 assert.match(app,/X-Idea-Hub-Agreement/);
 assert.match(app,/credentials:'omit'/);
 for(const name of ['localStorage','sessionStorage','innerHTML','outerHTML','eval('])assert.ok(!app.includes(name),name);
 assert.match(app,/composeDiscussion/);
 assert.match(app,/composeReply/);
 assert.match(app,/loadThread/);
 assert.match(app,/reportDialog/);
 assert.match(app,/loadFeed/);
});
test('service worker only caches static GET files inside mobile scope',()=>{
 const sw=read('idea-hub/mobile/sw.js');
 assert.match(sw,/e\.request\.method!=='GET'/);
 assert.match(sw,/u\.origin!==self\.location\.origin/);
 assert.match(sw,/u\.pathname\.startsWith\(/);
 assert.doesNotMatch(sw,/api\/discussions|api\/auth|firebase/i);
});
