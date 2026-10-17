import test from 'node:test';
import assert from 'node:assert/strict';
import {checkContentSafety,parseSafetyResponse,SAFETY_MODEL} from '../backend/moderation.mjs';
import worker,{TERMS} from '../backend/worker.mjs';
import {fixture,origin} from './fixture.mjs';

test('strict response parsing accepts documented text/JSON and rejects contradictions',()=>{
 for(const response of ['safe',{safe:true,categories:[]}])assert.equal(parseSafetyResponse({response}),'safe');
 for(const response of ['unsafe\nS1,S10',{safe:false,categories:['S1']}])assert.equal(parseSafetyResponse({response}),'unsafe');
 for(const response of ['safe but unsafe','safe\nS1','maybe','',null,{safe:'true',categories:[]},{safe:true,categories:['S1']}])assert.equal(parseSafetyResponse({response}),'unavailable');
});
test('uses Cloudflare safety model, bounded output, public text only',async()=>{
 let call;await checkContentSafety({AI:{run:async(...args)=>{call=args;return {response:'safe'};}}},['Garden project','Build a planter.']);
 assert.equal(call[0],SAFETY_MODEL);assert.deepEqual(call[1],{messages:[{role:'user',content:'Garden project\n\nBuild a planter.'}],max_tokens:64,temperature:0});
});
test('clear profanity, direct insults and promotional spam reject before inference',async()=>{
 for(const text of ['You are an idiot','This is bullshit','Buy followers now','ｆｕｃｋ','f\u200Buck'])await assert.rejects(checkContentSafety({AI:{run:()=>{throw Error('must not call');}}},[text]),{status:400});
});
test('ordinary words and respectful disagreement are not blocked by substring rules',async()=>{
 for(const text of ['A class about brass assembly','I disagree with this approach.','How can we prevent spam?','Avoid get rich quick schemes.'])await checkContentSafety({AI:{run:async()=>({response:'safe'})}},[text]);
});
test('unsafe output rejects and provider errors/missing bindings/malformed replies fail closed',async()=>{
 await assert.rejects(checkContentSafety({AI:{run:async()=>({response:'unsafe\nS1'})}},['Threat example']),{status:400});
 for(const env of [{},{AI:{run:async()=>{throw Error('private provider details');}}},{AI:{run:async()=>({response:'uncertain'})}}])await assert.rejects(checkContentSafety(env,['Ordinary content']),e=>e.status===503&&!e.message.includes('private provider'));
});
test('timeout returns safely and a late result cannot save or publish content',async()=>{
 let resolve;const promise=new Promise(r=>resolve=r);
 await assert.rejects(checkContentSafety({AI:{run:()=>promise}},['Ordinary content'],{timeoutMs:10}),{status:503});resolve({response:'safe'});
});

test('API publishes cleared posts/comments but holds unsafe entries for review, without leaking failures',async()=>{
 const f=fixture(),oldFetch=globalThis.fetch;globalThis.fetch=f.provider;
 let verdict='safe',seen=[],ip=0;
 f.env.AI.run=async(model,input)=>{seen.push(input.messages[0].content);if(verdict==='error')throw Error('private provider details');return {response:verdict};};
 const agree={agree:true,termsVersion:TERMS};
 async function req(path,who,data){const r=await worker.fetch(new Request('https://test'+path,{method:data?'POST':'GET',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.'+(++ip),Authorization:'Bearer '+who,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined}),f.env);return {status:r.status,data:await r.json()};}
 try{
  for(const who of ['alice','admin'])assert.equal((await req('/api/profile',who,{...agree,name:who+' member',bio:'Practical projects.'})).status,200);
  const original=f.db.prepare('SELECT name,bio FROM members WHERE uid=?').get('alice');
  verdict='unsafe\nS10';assert.equal((await req('/api/profile','alice',{...agree,name:'New name',bio:'Blocked biography'})).status,400);
  assert.deepEqual(f.db.prepare('SELECT name,bio FROM members WHERE uid=?').get('alice'),original);
  const draft={...agree,title:'A useful planter',body:'Build a reusable garden planter.',category:'ideas'};
  const flagged=await req('/api/discussions','alice',draft);assert.equal(flagged.status,201);assert.equal(flagged.data.status,'pending');
  assert.equal((await req('/api/discussions/'+flagged.data.id,'alice')).status,404);
  assert.equal((await req('/api/mod/queue','admin')).data.discussions.length,1);
  const flaggedRow=f.db.prepare('SELECT * FROM discussions WHERE id=?').get(flagged.data.id);
  assert.equal((await req('/api/mod/action','admin',{type:'discussion',id:flagged.data.id,action:'approve'})).status,409);
  assert.deepEqual(f.db.prepare('SELECT * FROM discussions WHERE id=?').get(flagged.data.id),flaggedRow);
  verdict='error';assert.equal((await req('/api/discussions','alice',draft)).status,503);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM discussions').get().n,1);
  verdict='safe';
  const created=await req('/api/discussions','alice',draft);assert.equal(created.status,201);assert.equal(created.data.status,'approved');
  const id=created.data.id;assert.equal((await req('/api/discussions/'+id,'alice')).status,200);
  const reply=await req('/api/discussions/'+id+'/replies','alice',{...agree,body:'Use recycled timber.'});
  assert.equal(reply.status,201);assert.equal(reply.data.status,'approved');
  assert.equal((await req('/api/discussions/'+id,'alice')).data.replies.length,1);
  verdict='unsafe\nS10';
  const flaggedReply=await req('/api/discussions/'+id+'/replies','alice',{...agree,body:'Unwise reply for human review.'});
  assert.equal(flaggedReply.data.status,'pending');
  assert.equal((await req('/api/discussions/'+id,'alice')).data.replies.length,1);
  // A human administrator must explicitly confirm any flagged override.
  assert.equal((await req('/api/mod/action','admin',{type:'reply',id:flaggedReply.data.id,action:'approve'})).status,409);
  assert.equal((await req('/api/mod/action','admin',{type:'reply',id:flaggedReply.data.id,action:'approve',confirmFlagged:true})).status,200);
  assert.equal((await req('/api/discussions/'+id,'alice')).data.replies.length,2);
  const prior=f.db.prepare('SELECT * FROM discussions WHERE id=?').get(id);
  const edited=await req('/api/content','alice',{...agree,type:'discussion',id,action:'edit',title:'Updated planter',body:'More useful project details.'});
  assert.equal(edited.data.status,'pending');
  assert.equal((await req('/api/discussions/'+id,'alice')).status,404);
  assert.notEqual(f.db.prepare('SELECT body FROM discussions WHERE id=?').get(id).body,prior.body);
  verdict='safe';const revised=await req('/api/content','alice',{...agree,type:'discussion',id,action:'edit',title:'Updated planter',body:'Now with useful project details.'});
  assert.equal(revised.data.status,'approved');assert.equal((await req('/api/discussions/'+id,'alice')).status,200);
  const replyEdit=await req('/api/content','alice',{...agree,type:'reply',id:reply.data.id,action:'edit',body:'Updated helpful comment.'});
  assert.equal(replyEdit.data.status,'approved');
  assert.ok(seen.includes('alice member\n\nPractical projects.'));
  assert.ok(seen.includes('Updated planter\n\nNow with useful project details.'));
  assert.equal((await req('/api/profile','unverified',{...agree,name:'No access'})).status,403);
  // The approval revision check must not publish concurrently changed content.
  f.env.AI.run=async()=>{f.db.prepare('UPDATE discussions SET body=? WHERE id=?').run('Concurrent unscreened content',flagged.data.id);return {response:'safe'};};
  assert.equal((await req('/api/mod/action','admin',{type:'discussion',id:flagged.data.id,action:'approve'})).status,409);
  assert.equal(f.db.prepare('SELECT status FROM discussions WHERE id=?').get(flagged.data.id).status,'pending');
  verdict='error';assert.equal((await req('/api/content','alice',{type:'reply',id:reply.data.id,action:'delete'})).status,200);
 }finally{globalThis.fetch=oldFetch;f.db.close();}
});
