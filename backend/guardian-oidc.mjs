/*
 * QuoteCraft Guardian private moderation read access, v0.2.0.
 * GitHub Actions OIDC; no permanent bearer token, no password, no write permission.
 * This module is inert unless the owning Cloudflare Worker explicitly imports
 * and routes to it. See DEPLOYMENT.md. Do not publish private queue in GitHub logs.
 */
const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com';
const JWKS = GITHUB_ISSUER + '/.well-known/jwks';
const AUD = 'quotecraft-guardian-idea-hub-private-queue-v1';
const REPO = 'QuoteCraftStudio/QuoteCraft-App-Archives';
const REPO_ID = '1422829682';
const OWNER_ID = '337505330';
const REF = 'refs/heads/main';
const WORKFLOW_REF = REPO + '/.github/workflows/quotecraft-guardian.yml@' + REF;
// Verified against the owning repository's current OIDC subject settings.
// GitHub's immutable subject binds the names AND IDs; legacy name-only subjects
// are intentionally denied for this repository.
const SUBJECT = `repo:QuoteCraftStudio@${OWNER_ID}/QuoteCraft-App-Archives@${REPO_ID}:ref:${REF}`;
const allowedEvents = new Set(['schedule', 'workflow_dispatch']);
export class GuardianAuthError extends Error {
  constructor(){super('Guardian access denied');this.status=403;}
}
const deny=()=>{throw new GuardianAuthError();};
const decoder=new TextDecoder('utf-8',{fatal:true});
function decodeBase64Url(value){
  if(typeof value!=='string' || !/^[A-Za-z0-9_-]+$/.test(value))deny();
  const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  return Uint8Array.from(atob(padded), c=>c.charCodeAt(0));
}
function parseJsonSegment(segment, limit=6000){
  const bytes=decodeBase64Url(segment);if(bytes.length>limit)deny();
  const parsed=JSON.parse(decoder.decode(bytes));
  if(!parsed || typeof parsed!=='object' || Array.isArray(parsed))deny();
  return parsed;
}
function isSafeTime(c,now){
  return Number.isInteger(c.exp)&&Number.isInteger(c.iat)&&c.exp>now&&c.iat<=now+30&&
    c.exp-c.iat<=600&&c.exp-c.iat>0&&
    (c.nbf===undefined||(Number.isInteger(c.nbf)&&c.nbf<=now+30));
}
function verifyClaims(c,now){
  if(!isSafeTime(c,now))deny();
  // Exact strings; never rely on `repository` alone or only the default `sub`.
  if(c.iss!==GITHUB_ISSUER || c.aud!==AUD ||
     c.repository!==REPO || String(c.repository_id)!==REPO_ID ||
     String(c.repository_owner_id)!==OWNER_ID || c.ref!==REF ||
     c.workflow_ref!==WORKFLOW_REF ||
     c.sub!==SUBJECT ||
     !allowedEvents.has(c.event_name) || c.runner_environment!=='github-hosted')deny();
}
export async function authorizeGuardianRead(req,{fetchJwks=fetch,now=Math.floor(Date.now()/1000)}={}){
  try{
    if(req.method!=='GET')deny();
    const auth=req.headers.get('Authorization')||'';
    if(auth.length<40||auth.length>9000||!auth.startsWith('Bearer '))deny();
    const jwt=auth.slice(7),segments=jwt.split('.');if(segments.length!==3)deny();
    const [headerPart,payloadPart,sigPart]=segments;
    const header=parseJsonSegment(headerPart,2000);
    if(header.alg!=='RS256' || typeof header.kid!=='string' || header.kid.length>128 ||
       !/^[A-Za-z0-9._-]+$/.test(header.kid) || header.crit || header.jku || header.jwk || header.x5u)deny();
    const claims=parseJsonSegment(payloadPart);
    verifyClaims(claims,now);
    const response=await fetchJwks(JWKS,{method:'GET',signal:AbortSignal.timeout(6000),headers:{Accept:'application/json'}});
    if(!response.ok)deny();
    const raw=await response.text();if(raw.length>25000)deny();
    const keys=JSON.parse(raw).keys;if(!Array.isArray(keys)||keys.length>30)deny();
    const matching=keys.filter(k=>k.kid===header.kid&&k.kty==='RSA'&&k.use!=='enc'&&
      (!k.alg||k.alg==='RS256')&&(!k.key_ops||(Array.isArray(k.key_ops)&&k.key_ops.includes('verify')))&&typeof k.n==='string'&&typeof k.e==='string');
    if(matching.length!==1)deny();
    const pub=await crypto.subtle.importKey('jwk',matching[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const data=new TextEncoder().encode(headerPart+'.'+payloadPart);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',pub,decodeBase64Url(sigPart),data))deny();
    return true;
  }catch{deny();}
}
/** Returns ONLY bounded moderator-queue content; no UIDs, email, tokens or password data. */
export async function readGuardianPrivateQueue(env){
  const discussions=await env.DB.prepare("SELECT d.id,d.title,d.body,d.category,d.created_at,m.name AS author FROM discussions d JOIN members m ON m.uid=d.uid WHERE d.status='pending' ORDER BY d.created_at LIMIT 101").all();
  const replies=await env.DB.prepare("SELECT r.id,r.discussion_id,r.body,r.created_at,d.title AS discussion_title,m.name AS author FROM replies r JOIN members m ON m.uid=r.uid JOIN discussions d ON d.id=r.discussion_id WHERE r.status='pending' AND d.status='approved' ORDER BY r.created_at LIMIT 101").all();
  const reports=await env.DB.prepare("SELECT r.id,r.target_type,r.target_id,r.reason,r.created_at FROM reports r WHERE r.resolved=0 ORDER BY r.created_at LIMIT 101").all();
  const trimRows=result=>({rows:result.results.slice(0,100),truncated:result.results.length>100});
  return {checked_at_utc:new Date().toISOString(),
    discussions:trimRows(discussions),
    replies:trimRows(replies),
    reports:trimRows(reports)};
}
