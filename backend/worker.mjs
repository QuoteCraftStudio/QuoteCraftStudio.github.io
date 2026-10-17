import {checkContentSafety, ScreeningError} from './moderation.mjs';
export const TERMS = '2026-10-17';
export const CATEGORIES = ['ideas','projects','technology','questions'];
class Problem extends Error { constructor(message,status=400){super(message);this.status=status;} }
const fail=(message,status)=>{throw new Problem(message,status);};
// AI-cleared content publishes immediately; unsafe content stays private for
// human review. Provider outages still fail closed without storing new content.
async function screeningStatus(env,fields){
 try{await checkContentSafety(env,fields);return 'approved';}
 catch(error){if(error instanceof ScreeningError&&error.status===400)return 'pending';throw error;}
}
const stamp=()=>new Date().toISOString();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const str=(v,min,max,label)=>{if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(`${label}: use ${min}–${max} characters.`);return v.trim();};
const id=v=>str(v,1,128,'ID');
const admin=(u,env)=>String(env.ADMIN_UIDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(u.uid);
const moderator=(u,env)=>admin(u,env)||u.role==='moderator';
async function body(req){
 if((req.headers.get('content-type')||'').split(';')[0]!=='application/json')fail('Use JSON.',415);
 const reader=req.body?.getReader();if(!reader)fail('Missing form.');let n=0;const parts=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>24000){await reader.cancel();fail('Form is too large.',413);}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(n);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 try{const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!v||typeof v!=='object'||Array.isArray(v))throw Error();return v;}catch{fail('Invalid form.');}
}
async function limited(env,key,max,seconds=3600){
 const bucket=Math.floor(Date.now()/1000/seconds), expires=(bucket+1)*seconds;
 const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.RATE_LIMIT_SALT),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(`${key}:${bucket}`))),b=>b.toString(16).padStart(2,'0')).join('');
 const row=await env.DB.prepare('INSERT INTO limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(digest,expires).first();
 if(row.count>max)fail('Too many requests. Please try again later.',429);
}
async function firebase(env,method,data){
 const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
 const v=await r.json();if(!r.ok){const code=v.error?.message||'';
 if(r.status===403||/API_KEY|PROJECT_NOT_FOUND|CONFIGURATION_NOT_FOUND|OPERATION_NOT_ALLOWED/.test(code))fail('Authentication configuration needs attention.',503);
 if(code.includes('TOO_MANY_ATTEMPTS'))fail('Too many attempts. Please try again later.',429);
 if(code.includes('EMAIL_EXISTS'))fail('Registration could not be completed. Try signing in or resetting your password.');
 if(code.includes('TOKEN_EXPIRED')||code.includes('INVALID_ID_TOKEN')||code.includes('USER_DISABLED'))fail('Please sign in again.',401);
 fail('Authentication failed. Check your details or try again later.',400);}
 return v;
}
async function identity(req,env,verified=true){
 const auth=req.headers.get('Authorization')||'';if(!auth.startsWith('Bearer ')||auth.length>17000)fail('Please sign in.',401);
 const token=auth.slice(7);const result=await firebase(env,'lookup',{idToken:token});const account=result.users?.[0];
 if(!account||account.disabled)fail('Please sign in again.',401);
 if(verified&&account.emailVerified!==true)fail('Verify your email, then sign in again.',403);
 return {uid:account.localId,verified:account.emailVerified===true,token};
}
async function member(req,env){
 const u=await identity(req,env);const record=await env.DB.prepare('SELECT * FROM members WHERE uid=?').bind(u.uid).first();
 if(!record)fail('Choose your display name in Profile first.',409);if(record.suspended)fail('This account is suspended. Use the account support form to appeal.',403);
 return {...u,...record};
}
function consent(data){if(data.agree!==true||data.termsVersion!==TERMS)fail('Accept the current Terms and Community Guidelines.');if(data.website)fail('Submission rejected.');}
const publicCols='d.id,d.category,d.title,d.body,d.status,d.locked,d.pinned,d.created_at,d.updated_at,d.activity_at,m.name AS author,m.id AS profile_id';
async function publicTopic(env,target){return env.DB.prepare(`SELECT ${publicCols} FROM discussions d JOIN members m ON m.uid=d.uid WHERE d.id=? AND d.status='approved'`).bind(target).first();}
async function audit(env,u,action,target){await env.DB.prepare('INSERT INTO audit(actor_uid,action,target,created_at) VALUES (?,?,?,?)').bind(u.uid,action,target,stamp()).run();}
async function handle(req,env){
 const url=new URL(req.url),path=url.pathname,method=req.method,origin=req.headers.get('Origin');
 if(origin&&origin!==env.SITE_ORIGIN)fail('This origin is not allowed.',403);
 if(method==='OPTIONS'){if(origin!==env.SITE_ORIGIN)fail('This origin is not allowed.',403);return new Response(null,{status:204});}
 const configured=env.DB&&env.FIREBASE_API_KEY&&typeof env.RATE_LIMIT_SALT==='string'&&env.RATE_LIMIT_SALT.length>=32&&String(env.ADMIN_UIDS||'').trim();
 if(path==='/api/health'&&method==='GET'){if(configured)await env.DB.prepare('SELECT m.uid,d.id,r.id,p.id FROM members m,discussions d,replies r,reports p WHERE 0').all();return json({status:configured?'ok':'setup_needed',termsVersion:TERMS},configured?200:503);}
 if(!configured)fail('Idea Hub is awaiting backend setup.',503);
 if(!['GET','POST'].includes(method))fail('Method not allowed.',405);
 if(method==='POST'&&origin!==env.SITE_ORIGIN)fail('This origin is not allowed.',403);
 const ip=req.headers.get('CF-Connecting-IP');if(!ip)fail('Abuse protection unavailable.',503);
 await limited(env,`request:${ip}`,300);
 if(path.startsWith('/api/auth/')&&method==='POST'){
  await limited(env,`auth:${ip}`,25);const data=await body(req);const action=path.slice(10);
  if(action==='signup'||action==='signin'){
   const email=str(data.email,3,254,'Email');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a valid email.');
   const password=data.password;if(typeof password!=='string'||password.length<(action==='signup'?12:1)||password.length>128)fail('Password does not meet the length requirement.');
   if(action==='signup'){consent(data);await limited(env,`signup:${ip}`,3);}
   const auth=await firebase(env,action==='signup'?'signUp':'signInWithPassword',{email,password,returnSecureToken:true});
   let verificationSent=false;if(action==='signup'){try{await firebase(env,'sendOobCode',{requestType:'VERIFY_EMAIL',idToken:auth.idToken});verificationSent=true;}catch{/* Account can sign in and resend if provider email is temporarily limited. */}}
   return json({idToken:auth.idToken,expiresIn:auth.expiresIn,verificationSent});
  }
  if(action==='reset'){str(data.email,3,254,'Email');await limited(env,`email:${ip}`,5);try{await firebase(env,'sendOobCode',{requestType:'PASSWORD_RESET',email:data.email});}catch{/* Prevent account enumeration. */}return json({sent:true});}
  if(action==='verify'){const u=await identity(req,env,false);await limited(env,`verify:${u.uid}`,3);await firebase(env,'sendOobCode',{requestType:'VERIFY_EMAIL',idToken:u.token});return json({sent:true});}
  fail('Not found.',404);
 }
 if(path==='/api/session'&&method==='GET'){
  const u=await identity(req,env,false);let record=await env.DB.prepare('SELECT id,name,bio,role,suspended,created_at FROM members WHERE uid=?').bind(u.uid).first();
  return json({verified:u.verified,profile:record||null,isAdmin:admin(u,env),isModerator:admin(u,env)||record?.role==='moderator'});
 }
 if(path==='/api/profile'&&method==='POST'){
  const u=await identity(req,env),data=await body(req);consent(data);const name=str(data.name,2,50,'Display name'),bio=typeof data.bio==='string'?data.bio.trim():'';if(bio.length>300)fail('Bio is too long.');
  const prior=await env.DB.prepare('SELECT suspended FROM members WHERE uid=?').bind(u.uid).first();if(prior?.suspended)fail('Account suspended.',403);
  await limited(env,`profile:${u.uid}`,10);await checkContentSafety(env,[name,bio]);const now=stamp();
  await env.DB.prepare('INSERT INTO members(uid,id,name,bio,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(uid) DO UPDATE SET name=excluded.name,bio=excluded.bio,updated_at=excluded.updated_at').bind(u.uid,crypto.randomUUID(),name,bio,now,now).run();return json({saved:true});
 }
 const profile=path.match(/^\/api\/profiles\/([^/]+)$/);
 if(profile&&method==='GET'){const row=await env.DB.prepare('SELECT id,name,bio,created_at FROM members WHERE id=?').bind(id(profile[1])).first();if(!row)fail('Profile not found.',404);return json(row);}
 if(path==='/api/discussions'&&method==='GET'){
  const category=url.searchParams.get('category')||'',search=(url.searchParams.get('q')||'').trim();if(category&&!CATEGORIES.includes(category))fail('Unknown category.');if(search.length>100)fail('Search is too long.');
  const sort={active:'d.activity_at DESC',newest:'d.created_at DESC',oldest:'d.created_at ASC'}[url.searchParams.get('sort')||'active'];if(!sort)fail('Unknown sort.');
  const page=Math.max(0,Math.min(10000,Number(url.searchParams.get('page'))||0));if(!Number.isInteger(page))fail('Invalid page.');
  const params=[];let where="d.status='approved'";if(category){where+=' AND d.category=?';params.push(category);}if(search){where+=" AND (instr(lower(d.title),lower(?))>0 OR instr(lower(d.body),lower(?))>0)";params.push(search,search);}
  const result=await env.DB.prepare(`SELECT ${publicCols},(SELECT COUNT(*) FROM replies r WHERE r.discussion_id=d.id AND r.status='approved') AS reply_count FROM discussions d JOIN members m ON m.uid=d.uid WHERE ${where} ORDER BY d.pinned DESC,${sort},d.id LIMIT 21 OFFSET ?`).bind(...params,page*20).all();
  return json({discussions:result.results.slice(0,20),hasMore:result.results.length>20});
 }
 const topic=path.match(/^\/api\/discussions\/([^/]+)$/),replies=path.match(/^\/api\/discussions\/([^/]+)\/replies$/);
 if(topic&&method==='GET'){
  const discussion=await publicTopic(env,id(topic[1]));if(!discussion)fail('Discussion not found.',404);
  const offset=Math.max(0,Math.min(10000,Number(url.searchParams.get('page'))||0));if(!Number.isInteger(offset))fail('Invalid page.');
  const rows=await env.DB.prepare("SELECT r.id,r.body,r.created_at,r.updated_at,m.name AS author,m.id AS profile_id FROM replies r JOIN members m ON m.uid=r.uid WHERE r.discussion_id=? AND r.status='approved' ORDER BY r.created_at,r.id LIMIT 51 OFFSET ?").bind(discussion.id,offset*50).all();
  return json({discussion,replies:rows.results.slice(0,50),hasMore:rows.results.length>50});
 }
 if(method==='POST'&&(path==='/api/discussions'||replies)){
  const u=await member(req,env),data=await body(req);consent(data);await limited(env,`post:${u.uid}`,10);
  const content=str(data.body,replies?3:10,replies?3000:5000,'Message'),now=stamp(),newID=crypto.randomUUID();
  let publication;
  if(replies){const parent=await publicTopic(env,id(replies[1]));if(!parent)fail('Discussion not found.',404);if(parent.locked)fail('This discussion is locked.',409);
   publication=await screeningStatus(env,[content]);
   // Recheck the parent in the write to avoid posting during a lock or removal.
   const r=await env.DB.prepare("INSERT INTO replies(id,discussion_id,uid,body,status,created_at,updated_at,terms_version) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM discussions WHERE id=? AND status='approved' AND locked=0)").bind(newID,parent.id,u.uid,content,publication,now,now,TERMS,parent.id).run();if(!r.meta.changes)fail('Discussion is unavailable.',409);
   if(publication==='approved')await env.DB.prepare("UPDATE discussions SET activity_at=? WHERE id=? AND status='approved'").bind(now,parent.id).run();
  }else{const title=str(data.title,4,120,'Title');if(!CATEGORIES.includes(data.category))fail('Choose a category.');publication=await screeningStatus(env,[title,content]);await env.DB.prepare('INSERT INTO discussions(id,uid,category,title,body,status,created_at,updated_at,activity_at,terms_version) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(newID,u.uid,data.category,title,content,publication,now,now,now,TERMS).run();}
  return json({id:newID,status:publication},201);
 }
 if(path==='/api/mine'&&method==='GET'){
  const u=await member(req,env);const a=await env.DB.prepare("SELECT id,category,title,body,status,created_at,updated_at FROM discussions WHERE uid=? AND status!='removed' ORDER BY created_at DESC LIMIT 100").bind(u.uid).all();
  const b=await env.DB.prepare("SELECT r.id,r.discussion_id,r.body,r.status,r.created_at,r.updated_at,d.title FROM replies r JOIN discussions d ON d.id=r.discussion_id WHERE r.uid=? AND r.status!='removed' ORDER BY r.created_at DESC LIMIT 100").bind(u.uid).all();return json({discussions:a.results,replies:b.results});
 }
 if(path==='/api/content'&&method==='POST'){
  const u=await member(req,env),data=await body(req);if(!['discussion','reply'].includes(data.type)||!['edit','delete'].includes(data.action))fail('Invalid action.');const table=data.type==='discussion'?'discussions':'replies';const target=id(data.id);
  const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND uid=? AND status!='removed'`).bind(target,u.uid).first();if(!row)fail('Content not found.',404);await limited(env,`edit:${u.uid}`,30);
  if(data.action==='delete'){await env.DB.prepare(`UPDATE ${table} SET body='',status='removed',updated_at=? WHERE id=? AND uid=?`).bind(stamp(),target,u.uid).run();return json({deleted:true});}
  consent(data);const content=str(data.body,data.type==='discussion'?10:3,data.type==='discussion'?5000:3000,'Message');
  let publication;
  if(data.type==='discussion'){const title=str(data.title,4,120,'Title');publication=await screeningStatus(env,[title,content]);const now=stamp();const updated=await env.DB.prepare("UPDATE discussions SET title=?,body=?,status=?,updated_at=?,activity_at=? WHERE id=? AND uid=? AND status!='removed' AND updated_at=? AND body=? AND title=?").bind(title,content,publication,now,now,target,u.uid,row.updated_at,row.body,row.title).run();if(!updated.meta.changes)fail('Content changed while screening. Refresh and try again.',409);}
  else {publication=await screeningStatus(env,[content]);const now=stamp();const updated=await env.DB.prepare("UPDATE replies SET body=?,status=?,updated_at=? WHERE id=? AND uid=? AND status!='removed' AND updated_at=? AND body=?").bind(content,publication,now,target,u.uid,row.updated_at,row.body).run();if(!updated.meta.changes)fail('Content changed while screening. Refresh and try again.',409);if(publication==='approved')await env.DB.prepare("UPDATE discussions SET activity_at=? WHERE id=? AND status='approved'").bind(now,row.discussion_id).run();}
  return json({saved:true,status:publication});
 }
 if(path==='/api/report'&&method==='POST'){
  // Support remains available to suspended members for appeals and privacy requests.
  const u=await identity(req,env),data=await body(req);let profile=await env.DB.prepare('SELECT uid FROM members WHERE uid=?').bind(u.uid).first();if(!profile)fail('Save a profile first.',409);
  if(!['discussion','reply','account'].includes(data.type))fail('Invalid report.');const target=data.type==='account'?u.uid:id(data.id);const reason=str(data.reason,5,1000,'Report');
  if(data.type!=='account'){const table=data.type==='discussion'?'discussions':'replies';if(!await env.DB.prepare(`SELECT id FROM ${table} WHERE id=? AND status='approved'`).bind(target).first())fail('Content not found.',404);}
  await limited(env,`report:${u.uid}`,5);await env.DB.prepare('INSERT INTO reports(id,uid,target_type,target_id,reason,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),u.uid,data.type,target,reason,stamp()).run();return json({received:true},201);
 }
 if(path.startsWith('/api/mod/')){
  const u=await member(req,env);if(!moderator(u,env))fail('Moderator access required.',403);
  if(path==='/api/mod/queue'&&method==='GET'){
   const discussions=await env.DB.prepare("SELECT d.id,d.title,d.body,d.category,d.created_at,m.name AS author,m.id AS profile_id FROM discussions d JOIN members m ON m.uid=d.uid WHERE d.status='pending' ORDER BY d.created_at LIMIT 100").all();
   const replies=await env.DB.prepare("SELECT r.id,r.discussion_id,r.body,r.created_at,m.name AS author,m.id AS profile_id,d.title FROM replies r JOIN members m ON m.uid=r.uid JOIN discussions d ON d.id=r.discussion_id WHERE r.status='pending' AND d.status='approved' ORDER BY r.created_at LIMIT 100").all();
   const reports=await env.DB.prepare('SELECT r.id,r.target_type,r.target_id,r.reason,r.created_at,m.id AS profile_id,m.name AS author FROM reports r JOIN members m ON m.uid=r.uid WHERE resolved=0 ORDER BY r.created_at LIMIT 100').all();return json({discussions:discussions.results,replies:replies.results,reports:reports.results,isAdmin:admin(u,env)});
  }
  if(path==='/api/mod/action'&&method==='POST'){
   const data=await body(req),target=id(data.id);if(!['discussion','reply','report','member'].includes(data.type))fail('Invalid target.');
   await limited(env,`mod:${u.uid}`,100);
   if(data.type==='member'){
    if(!admin(u,env))fail('Administrator access required.',403);const row=await env.DB.prepare('SELECT uid FROM members WHERE id=?').bind(target).first();if(!row)fail('Member not found.',404);if(admin(row,env))fail('Administrator accounts cannot be changed here.',403);
    if(data.action==='suspend'||data.action==='restore')await env.DB.prepare('UPDATE members SET suspended=? WHERE id=?').bind(data.action==='suspend'?1:0,target).run();
    else if(data.action==='moderator'||data.action==='member')await env.DB.prepare('UPDATE members SET role=? WHERE id=?').bind(data.action,target).run();else fail('Invalid action.');
   }else if(data.type==='report'){if(data.action!=='resolve')fail('Invalid action.');const result=await env.DB.prepare('UPDATE reports SET resolved=1 WHERE id=?').bind(target).run();if(!result.meta.changes)fail('Report not found.',404);}
   else{
    const table=data.type==='discussion'?'discussions':'replies';const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(target).first();if(!row)fail('Content not found.',404);
    if(data.action==='approve'){if(row.status==='removed')fail('Removed content cannot be restored.',409);if(data.type==='reply'&&!await publicTopic(env,row.discussion_id))fail('Approve the discussion first.',409);
     // Also screen old queued content. Only approve the exact revision screened;
     // a concurrent edit or removal must never inherit another revision's result.
     try{await checkContentSafety(env,data.type==='discussion'?[row.title,row.body]:[row.body]);}
     catch(error){
      if(!(error instanceof ScreeningError&&error.status===400))throw error;
      if(!admin(u,env)||data.confirmFlagged!==true)fail('Automated screening flagged this content. Administrator confirmation required to override.',409);
     }
     const titleGuard=data.type==='discussion'?' AND title=?':'';
     const params=[target,row.body,row.updated_at,...(data.type==='discussion'?[row.title]:[])];
     const result=await env.DB.prepare(`UPDATE ${table} SET status='approved' WHERE id=? AND body=? AND updated_at=? AND status!='removed'${titleGuard}`).bind(...params).run();
     if(!result.meta.changes)fail('Content changed during review. Refresh the queue and review it again.',409);
     await env.DB.prepare('UPDATE discussions SET activity_at=? WHERE id=?').bind(stamp(),data.type==='discussion'?target:row.discussion_id).run();
    }else if(data.action==='remove')await env.DB.prepare(`UPDATE ${table} SET status='removed',body='',updated_at=? WHERE id=?`).bind(stamp(),target).run();
    else if(data.type==='discussion'&&['lock','unlock','pin','unpin'].includes(data.action)){const col=['lock','unlock'].includes(data.action)?'locked':'pinned';await env.DB.prepare(`UPDATE discussions SET ${col}=? WHERE id=?`).bind(['lock','pin'].includes(data.action)?1:0,target).run();}else fail('Invalid action.');
   }
   await audit(env,u,`${data.type}:${data.action}`,target);return json({updated:true});
  }
 }
 fail('Not found.',404);
}
export default {
 async fetch(req,env){let response;try{response=await handle(req,env);}catch(e){const known=e instanceof Problem||e instanceof ScreeningError;response=json({error:known?e.message:'Service temporarily unavailable. Please try again.'},known?e.status:503);}
  const headers=new Headers(response.headers);if(req.headers.get('Origin')===env.SITE_ORIGIN){headers.set('Access-Control-Allow-Origin',env.SITE_ORIGIN);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Headers','Content-Type, Authorization');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
  return new Response(response.body,{status:response.status,headers});
 },
 async scheduled(_event,env,ctx){ctx.waitUntil(env.DB.prepare('DELETE FROM limits WHERE expires<?').bind(Math.floor(Date.now()/1000)-86400).run());}
};
