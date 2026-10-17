import test from 'node:test';
import assert from 'node:assert/strict';
import {withSessionAgreement} from '../idea-hub/session-agreement.js';

const session={token:'synthetic-session',accepted:true,proof:'',termsVersion:'2026-10-17'};
test('signed-in consent is enough to post and comment when the Worker omits proof',()=>{
 for(const path of ['/api/discussions','/api/discussions/post-1/replies','/api/content','/api/profile']){
  const body={body:'Helpful details'};
  const result=withSessionAgreement(path,body,session);
  assert.deepEqual(result,{body:'Helpful details',agree:true,termsVersion:'2026-10-17'});
  assert.deepEqual(body,{body:'Helpful details'}); // no mutation
 }
});
test('does not attach agreement to unrelated endpoints, auth, or GET requests',()=>{
 for(const path of ['/api/auth/signin','/api/auth/signup','/api/report','/api/mod/action','/api/discussions/post-1','/api/session']){
  const body={x:1};assert.equal(withSessionAgreement(path,body,session),body);
 }
 assert.equal(withSessionAgreement('/api/discussions',undefined,session),undefined);
});
test('signed proof takes priority; no agreement is claimed before user accepts',()=>{
 const original={body:'Helpful details'};
 assert.equal(withSessionAgreement('/api/discussions',original,{...session,proof:'a'.repeat(64)}),original);
 assert.equal(withSessionAgreement('/api/discussions',original,{...session,accepted:false}),original);
 assert.equal(withSessionAgreement('/api/discussions',original,{...session,token:''}),original);
});
