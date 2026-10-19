import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {authorizeGuardianRead,readGuardianPrivateQueue,GuardianAuthError} from '../backend/guardian-oidc.mjs';
const enc=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
const NOW=1792370000;
const repo='QuoteCraftStudio/QuoteCraft-App-Archives';
const claims={iss:'https://token.actions.githubusercontent.com',aud:'quotecraft-guardian-idea-hub-private-queue-v1',
 sub:'repo:QuoteCraftStudio@337505330/QuoteCraft-App-Archives@1422829682:ref:refs/heads/main',repository:repo,repository_id:'1422829682',repository_owner_id:'337505330',
 ref:'refs/heads/main',workflow_ref:`${repo}/.github/workflows/quotecraft-guardian.yml@refs/heads/main`,
 event_name:'schedule',runner_environment:'github-hosted',iat:NOW-60,nbf:NOW-60,exp:NOW+240};
const keypair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await webcrypto.subtle.exportKey('jwk',keypair.publicKey),kid:'test-key'};
const fetchJwks=async()=>({ok:true,text:async()=>JSON.stringify({keys:[jwk]})});
async function tokenFor(c=claims,header={alg:'RS256',kid:'test-key'}){
 const a=enc(header),b=enc(c),data=new TextEncoder().encode(a+'.'+b);
 const signed=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',keypair.privateKey,data);
 return a+'.'+b+'.'+Buffer.from(signed).toString('base64url');
}
async function auth({c=claims,header={alg:'RS256',kid:'test-key'},method='GET',jwks=fetchJwks,token=null}={}){
 const jwt=token||await tokenFor(c,header);
 return authorizeGuardianRead({method,headers:new Headers({'Authorization':'Bearer '+jwt})},{fetchJwks:jwks,now:NOW});
}
test('valid OIDC signed identity permits read',async()=>assert.equal(await auth(),true));
for(const [label,edit] of [
 ['legacy name-only subject',{sub:`repo:${repo}:ref:refs/heads/main`}],
 ['wrong immutable subject owner',{sub:'repo:QuoteCraftStudio@1/QuoteCraft-App-Archives@1422829682:ref:refs/heads/main'}],
 ['wrong immutable subject repository',{sub:'repo:QuoteCraftStudio@337505330/QuoteCraft-App-Archives@1:ref:refs/heads/main'}],
 ['wrong immutable subject branch',{sub:'repo:QuoteCraftStudio@337505330/QuoteCraft-App-Archives@1422829682:ref:refs/heads/other'}],
 ['wrong audience',{aud:'other'}],['wrong repository',{repository:'attacker/repo'}],
 ['wrong workflow',{workflow_ref:'QuoteCraftStudio/QuoteCraft-App-Archives/.github/workflows/evil.yml@refs/heads/main'}],
 ['wrong branch',{ref:'refs/heads/test'}],['wrong repository id',{repository_id:'123'}],
 ['wrong owner id',{repository_owner_id:'1'}],['wrong event',{event_name:'pull_request'}],
 ['self-hosted runner',{runner_environment:'self-hosted'}],['expired',{exp:NOW-1}],
 ['issued in future',{iat:NOW+60}],['token lasts too long',{exp:NOW+1000}],
]){
 test('reject '+label,async()=>assert.rejects(()=>auth({c:{...claims,...edit}}),GuardianAuthError));
}
test('reject algorithm confusion',async()=>assert.rejects(()=>auth({header:{alg:'none',kid:'test-key'}}),GuardianAuthError));
test('reject unsupported HTTP method',async()=>assert.rejects(()=>auth({method:'POST'}),GuardianAuthError));
test('reject invalid signature',async()=>{const jwt=await tokenFor();const bad=jwt.slice(0,-2)+'xx';await assert.rejects(()=>auth({token:bad}),GuardianAuthError)});
test('reject untrusted key response',async()=>assert.rejects(()=>auth({jwks:async()=>({ok:true,text:async()=>JSON.stringify({keys:[]})})}),GuardianAuthError));
test('reject JWKS outage',async()=>assert.rejects(()=>auth({jwks:async()=>{throw Error('offline')}}),GuardianAuthError));
test('no private data in exception',async()=>{try{await auth({token:'secret-private-value'})}catch(e){assert.equal(e.message,'Guardian access denied')}});
test('queue reads at most 100 of each and no account credentials',async()=>{
 const sample=[...Array(101)].map((_,i)=>({id:'id'+i,title:'Test',body:'private body'}));
 let n=0;const env={DB:{prepare(sql){assert.ok(sql.includes('status=')||sql.includes('resolved=0'));return {all:async()=>({results:sample})}}}};
 const queue=await readGuardianPrivateQueue(env);
 assert.equal(queue.discussions.rows.length,100);assert.equal(queue.replies.truncated,true);assert.equal(queue.reports.truncated,true);
 assert.ok(!JSON.stringify(queue).includes('firebase'));
});
