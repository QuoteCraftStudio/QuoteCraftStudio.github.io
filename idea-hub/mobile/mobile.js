import {API} from '../config.js';
import {withSessionAgreement} from '../session-agreement.js';

// Small, independent phone interface for the EXISTING Idea Hub forum.
// No credentials are persisted; closing/reloading signs out this tab.
const TERMS='2026-10-17';
const CATS={ideas:'Ideas & Inventions',projects:'Projects & DIY',technology:'Technology & Apps',questions:'Questions & Help'};
const $=q=>document.querySelector(q);
const auth={token:'',proof:'',accepted:false,session:null};
const state={mode:'forum',page:0,thread:'',replyPage:0};
let installPrompt=null;

function el(tag,className='',text){
 const n=document.createElement(tag);if(className)n.className=className;
 if(text!==undefined)n.textContent=text;
 return n;
}
function btn(text,fn,cls=''){
 const b=el('button',cls,text);b.type='button';
 b.addEventListener('click',()=>safe(fn));return b;
}
function msg(text='',error=false){
 const e=$('#status');e.textContent=text;e.classList.toggle('error',!!error);
}
async function safe(fn){try{await fn();}catch(e){msg(e.message||'Something went wrong. Please try again.',true);}}
function clearAuth(){auth.token='';auth.proof='';auth.accepted=false;auth.session=null;nav();}
function nav(){
 $('#account-label').textContent=auth.token?'Account':'Sign in';
 for(const [name,id] of [['forum','#nav-home'],['mine','#nav-mine']]){
  const b=$(id);b.classList.toggle('selected',state.mode===name);
  if(state.mode===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
}
async function api(path,data){
 if(!API)throw Error('The forum connection is unavailable.');
 const post=data!==undefined;
 if(post)data=withSessionAgreement(path,data,{token:auth.token,accepted:auth.accepted,proof:auth.proof,termsVersion:TERMS});
 const headers={};
 if(auth.token)headers.Authorization='Bearer '+auth.token;
 if(auth.token&&auth.proof)headers['X-Idea-Hub-Agreement']=auth.proof;
 if(post)headers['Content-Type']='application/json';
 let response;
 try{
  response=await fetch(API+path,{
   method:post?'POST':'GET',headers,body:post?JSON.stringify(data):undefined,
   credentials:'omit',referrerPolicy:'no-referrer',
   signal:AbortSignal.timeout(post?30000:15000)
  });
 }catch{throw Error('Could not reach Idea Hub. Check your internet connection and try again.');}
 let result;
 try{result=await response.json();}catch{throw Error('The forum returned an unexpected reply.');}
 if(!response.ok){
  if(response.status===401){clearAuth();msg('Your session expired. Please sign in again.',true);}
  throw Error(result.error||'Request failed. Please try again.');
 }
 return result;
}
function date(value){
 const d=new Date(value);
 return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function cat(key){return CATS[key]||'Community';}
function meta(row){
 const foot=el('div','item-bottom');
 foot.append(el('span','',row.author||'Community'),el('span','date',date(row.created_at)));
 return foot;
}
function tag(name){return el('span','cat',cat(name));}
function showLoading(){ $('#feed').replaceChildren(el('div','loading','Loading discussions…')); }
function headings(title='Discussions',eyebrow='COMMUNITY'){
 $('#view-title').textContent=title;$('#view-eyebrow').textContent=eyebrow;
}
function pagination(yes=false,hasMore=false){
 $('#pagination').hidden=!yes;$('#prev').hidden=state.page===0;$('#next').hidden=!hasMore;
 $('#page-number').textContent='Page '+(state.page+1);
}
async function loadFeed(page=0){
 state.mode='forum';state.page=page;state.thread='';nav();headings();$('#filters').hidden=false;
 history.replaceState(null,'',location.pathname);
 showLoading();pagination(false);
 const q=new URLSearchParams({category:$('#category').value,q:$('#search').value.trim(),sort:'active',page:String(page)});
 const data=await api('/api/discussions?'+q);
 const view=$('#feed');view.replaceChildren();
 if(!data.discussions.length)view.append(el('p','empty',q.get('q')?'No discussions match your search.':'No discussions yet. Start the conversation!'));
 for(const row of data.discussions){
  const card=el('article','discussion');const top=el('div','item-top');
  top.append(tag(row.category),el('span','date',date(row.created_at)));
  const h=el('h3');h.append(btn(row.title,()=>loadThread(row.id),'title-btn'));
  const excerpt=el('p','excerpt',row.body.length>170?row.body.slice(0,170)+'…':row.body);
  const bottom=el('div','item-bottom');
  bottom.append(el('strong','',row.author),el('span','count','◯ '+row.reply_count+' '+(row.reply_count===1?'comment':'comments')));
  card.append(top,h,excerpt,bottom);
  card.addEventListener('click',e=>{if(!e.target.closest('button'))safe(()=>loadThread(row.id));});
  view.append(card);
 }
 pagination(true,!!data.hasMore);
}
function backButton(){
 return btn('← Back to discussions',()=>loadFeed(state.page),'back');
}
function threadCard(data){
 const d=data.discussion,card=el('article','discussion');
 const top=el('div','item-top');top.append(tag(d.category),el('span','date',date(d.created_at)));
 const h=el('h3','',d.title),body=el('p','post-body',d.body);
 card.append(top,h,body,meta(d));
 const actions=el('div','actions');
 if(!d.locked)actions.append(btn('＋ Write comment',()=>composeReply(d.id),''));
 else actions.append(el('span','date','Discussion locked'));
 actions.append(btn('Report',()=>reportDialog('discussion',d.id),'secondary'));
 card.append(actions);return card;
}
function replyCard(d){
 const card=el('article','reply');
 card.append(meta(d),el('p','',d.body));
 const actions=el('div','actions');
 actions.append(btn('Report',()=>reportDialog('reply',d.id),'secondary'));
 card.append(actions);
 return card;
}
async function loadThread(id,page=0,append=false){
 const path='/api/discussions/'+encodeURIComponent(id)+'?page='+page;
 const data=await api(path);
 state.mode='thread';state.thread=id;state.replyPage=page;nav();
 const view=$('#feed');
 if(!append){
  history.replaceState(null,'','#thread='+encodeURIComponent(id));
  $('#filters').hidden=true;headings('Discussion','THE CONVERSATION');
  view.replaceChildren(backButton(),threadCard(data),el('h3','replies-heading','Comments'));
 }
 const replies=$('#reply-list')||(function(){const v=el('div');v.id='reply-list';view.append(v);return v;})();
 if(!append)replies.replaceChildren();
 $('#more-replies')?.remove();
 if(!data.replies.length&&!append)replies.append(el('p','empty','No comments yet. Be the first to reply.'));
 for(const reply of data.replies)replies.append(replyCard(reply));
 if(data.hasMore){
  const more=btn('Load more comments',()=>loadThread(id,page+1,true),'btn');
  more.id='more-replies';view.append(more);
 }
 pagination(false);
}
function sheet(title){
 const dialog=$('#sheet');
 if(dialog.open)dialog.close();
 $('#sheet-title').textContent=title;$('#sheet-body').replaceChildren();$('#sheet-status').textContent='';
 dialog.showModal();return $('#sheet-body');
}
function closeSheet(){if($('#sheet').open)$('#sheet').close();}
function field(form,title,name,{type='text',value='',min=0,max=5000,required=true,lines=false}={}){
 const label=el('label','',title);
 const input=el(lines?'textarea':'input');
 input.name=name;if(!lines)input.type=type;
 input.value=value;input.required=required;input.maxLength=max;if(min)input.minLength=min;
 if(type==='email')input.autocomplete='email';
 if(type==='password')input.autocomplete='current-password';
 label.append(input);form.append(label);return input;
}
function form(){
 const n=el('form','sheet-form');
 n.addEventListener('submit',e=>e.preventDefault());
 return n;
}
function submit(form,label,action){
 const b=el('button','btn primary',label);b.type='submit';
 form.append(b);
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  b.disabled=true;$('#sheet-status').textContent='Working…';
  try{await action(Object.fromEntries(new FormData(form)));}
  catch(error){$('#sheet-status').textContent=error.message||'Please try again.';}
  finally{b.disabled=false;}
 });
}
function agreement(form){
 const label=el('label','check');const box=el('input');box.type='checkbox';box.name='agree';box.required=true;
 const t=el('span','');t.append(document.createTextNode('I agree to the '));
 for(const [title,link] of [['Terms of Use','../terms.html'],['Community Guidelines','../guidelines.html']]){
  const a=el('a','',title);a.href=link;a.target='_blank';a.rel='noopener';t.append(a,document.createTextNode('. '));
 }
 const privacy=el('a','','Privacy Policy');privacy.href='../privacy.html';privacy.target='_blank';privacy.rel='noopener';
 t.append(document.createTextNode('I have read the '),privacy,document.createTextNode('.'));
 label.append(box,t);form.append(label);
 const trap=el('label','trap','Leave blank');const input=el('input');input.name='website';input.tabIndex=-1;input.autocomplete='off';trap.append(input);form.append(trap);
}
function afterSignIn(next){
 if(!auth.session?.verified)return verifyDialog();
 if(!auth.session.profile)return profileDialog(next);
 msg('Signed in as '+auth.session.profile.name+'.');
 if(next)return next();
}
function signIn(next,signup=false){
 const root=sheet(signup?'Join Idea Hub':'Sign in to Idea Hub'),f=form();
 const email=field(f,'Email','email',{type:'email',max:254});
 const password=field(f,'Password','password',{type:'password',min:signup?12:1,max:128});
 password.autocomplete=signup?'new-password':'current-password';
 if(signup)f.append(el('p','sheet-help','Use at least 12 characters in your password. Email verification is required.'));
 f.append(el('p','sheet-help','Accept the agreement once when signing in. No repeated checkbox for every post or comment.'));
 agreement(f);
 submit(f,signup?'Create account':'Sign in',async data=>{
  const response=await api('/api/auth/'+(signup?'signup':'signin'),{...data,agree:data.agree==='on',termsVersion:TERMS});
  auth.token=response.idToken;auth.proof=response.consentProof||'';auth.accepted=true;
  closeSheet();
  try{auth.session=await api('/api/session');}catch(error){clearAuth();throw error;}
  nav();await afterSignIn(next);
 });
 root.append(f);
 const actions=el('div','inline-links');
 actions.append(btn(signup?'I already have an account':'Create an account',()=>signIn(next,!signup),'text-button'));
 if(!signup)actions.append(btn('Forgot password?',forgotDialog,'text-button'));
 root.append(actions);
 email.focus();
}
function forgotDialog(){
 const root=sheet('Reset password'),f=form();field(f,'Email address','email',{type:'email',max:254});
 submit(f,'Send reset email',async data=>{
  await api('/api/auth/reset',data);$('#sheet-status').textContent='If this account exists, check your email for the reset link.';
 });
 root.append(f);
}
function verifyDialog(){
 const root=sheet('Verify your email');
 root.append(el('p','sheet-help','Check your inbox for the verification message. After verifying your address, sign out and sign in again.'));
 root.append(btn('Resend verification email',async()=>{
  await api('/api/auth/verify',{});$('#sheet-status').textContent='Verification message requested. Check your inbox.';
 },'btn'));
 root.append(btn('Sign out',()=>{clearAuth();closeSheet();msg('Signed out.');},'text-button'));
}
function profileDialog(next){
 if(!auth.token)return signIn(next);
 if(!auth.session?.verified)return verifyDialog();
 const root=sheet(auth.session?.profile?'My profile':'Choose a display name'),f=form();
 field(f,'Public display name','name',{min:2,max:50,value:auth.session.profile?.name||''});
 field(f,'Short bio (optional)','bio',{lines:true,max:300,required:false,value:auth.session.profile?.bio||''});
 f.append(el('p','sheet-help','Your display name and bio are public. Your email address stays private.'));
 submit(f,'Save profile',async data=>{
  await api('/api/profile',data);auth.session=await api('/api/session');
  closeSheet();nav();msg('Profile saved.');
  if(next)await next();
 });
 root.append(f);
}
function agreementDialog(next){
 const root=sheet('Community agreement'),f=form();
 f.append(el('p','sheet-help','Read and accept once for this session. You will not need to check this box on each post or comment.'));
 agreement(f);
 submit(f,'Accept and continue',async data=>{
  if(data.agree!=='on')throw Error('Please accept the agreement.');
  auth.accepted=true;closeSheet();if(next)await next();
 });
 root.append(f);
}
function requireMember(next){
 if(!auth.token){signIn(next);return false;}
 if(!auth.session?.verified){verifyDialog();return false;}
 if(!auth.accepted){agreementDialog(next);return false;}
 if(!auth.session.profile){profileDialog(next);return false;}
 return true;
}
function composeDiscussion(){
 if(!requireMember(composeDiscussion))return;
 const root=sheet('Start a discussion'),f=form();
 field(f,'Title','title',{min:4,max:120});
 const label=el('label','','Category'),sel=el('select');sel.name='category';
 for(const [key,value] of Object.entries(CATS)){const o=el('option','',value);o.value=key;sel.append(o);}
 sel.value=$('#category').value||'ideas';label.append(sel);f.append(label);
 field(f,'Your idea or question','body',{lines:true,min:10,max:5000});
 f.append(el('p','sheet-help','Be kind and avoid private information. Safe posts publish immediately; flagged posts wait for moderator review.'));
 submit(f,'Post discussion',async data=>{
  const result=await api('/api/discussions',data);closeSheet();
  if(result.status==='approved'){msg('Your discussion is live!');await loadThread(result.id);}
  else{msg('Your post is private until a moderator reviews it.');await mine();}
 });
 root.append(f);
}
function composeReply(id){
 if(!requireMember(()=>composeReply(id)))return;
 const root=sheet('Write a comment'),f=form();
 field(f,'Your comment','body',{lines:true,min:3,max:3000});
 f.append(el('p','sheet-help','Safe comments appear immediately. Flagged comments stay private for review.'));
 submit(f,'Post comment',async data=>{
  const result=await api('/api/discussions/'+encodeURIComponent(id)+'/replies',data);
  closeSheet();
  if(result.status==='approved'){msg('Your comment is live!');await loadThread(id);}
  else{msg('Your comment is private until a moderator reviews it.');await mine();}
 });
 root.append(f);
}
async function mine(){
 if(!requireMember(mine))return;
 state.mode='mine';nav();headings('My posts','YOUR ACTIVITY');$('#filters').hidden=true;pagination(false);showLoading();
 const data=await api('/api/mine');const root=$('#feed');root.replaceChildren();
 root.append(backButton());
 if(!data.discussions.length&&!data.replies.length)root.append(el('p','empty','You have not posted anything yet.'));
 for(const [type,items] of [['discussion',data.discussions],['reply',data.replies]]){
  for(const row of items){
   const card=el('article','discussion');
   const head=el('div','item-top');
   head.append(el('span','cat',row.status==='approved'?'Published':row.status==='pending'?'Needs review':'Removed'),el('span','date',date(row.created_at)));
   card.append(head,el('h3','',type==='reply'?'Comment on '+row.title:row.title),el('p','excerpt',row.body));
   const actions=el('div','actions');
   if(row.status==='approved')actions.append(btn('View',()=>loadThread(type==='reply'?row.discussion_id:row.id),''));
   actions.append(btn('Delete',()=>deleteMine(type,row.id),'warn'));
   card.append(actions);root.append(card);
  }
 }
}
async function deleteMine(type,id){
 if(!confirm('Delete this '+(type==='reply'?'comment':'discussion')+'? This cannot be undone.'))return;
 await api('/api/content',{type,id,action:'delete'});msg('Content deleted.');await mine();
}
function reportDialog(type,id){
 if(!requireMember(()=>reportDialog(type,id)))return;
 const root=sheet('Report content'),f=form();
 f.append(el('p','sheet-help','Reports are private to moderators. Please describe the concern without sharing sensitive information.'));
 field(f,'Reason for report','reason',{lines:true,min:5,max:1000});
 submit(f,'Send report',async data=>{
  await api('/api/report',{type,id,reason:data.reason});closeSheet();msg('Your report was submitted privately.');
 });
 root.append(f);
}
function accountDialog(){
 if(!auth.token)return signIn();
 const root=sheet('Your Idea Hub account');
 root.append(el('p','sheet-help',auth.session?.profile?'Signed in as '+auth.session.profile.name:'Signed in. Choose a display name to participate.'));
 root.append(btn('My profile',profileDialog,'btn'));
 root.append(btn('My posts',async()=>{closeSheet();await mine();},'btn'));
 if(installPrompt)root.append(btn('Install on this phone',async()=>{
  const p=installPrompt;installPrompt=null;await p.prompt();await p.userChoice;closeSheet();
 },'btn'));
 else root.append(el('p','sheet-help','To add the app to your phone, use your browser menu → Add to Home screen.'));
 root.append(btn('Sign out',async()=>{clearAuth();closeSheet();msg('Signed out.');await loadFeed(0);},'btn ghost'));
}
function setup(){
 $('#sheet-close').addEventListener('click',closeSheet);
 $('#filters').addEventListener('submit',e=>{e.preventDefault();safe(()=>loadFeed(0));});
 $('#category').addEventListener('change',()=>safe(()=>loadFeed(0)));
 $('#nav-home').addEventListener('click',()=>safe(()=>loadFeed(0)));
 $('#nav-mine').addEventListener('click',()=>safe(mine));
 $('#nav-post').addEventListener('click',()=>safe(composeDiscussion));
 $('#hero-post').addEventListener('click',()=>safe(composeDiscussion));
 $('#nav-account').addEventListener('click',()=>safe(accountDialog));
 $('#refresh').addEventListener('click',()=>safe(()=>state.mode==='thread'?loadThread(state.thread):state.mode==='mine'?mine():loadFeed(state.page)));
 $('#prev').addEventListener('click',()=>safe(()=>loadFeed(Math.max(0,state.page-1))));
 $('#next').addEventListener('click',()=>safe(()=>loadFeed(state.page+1)));
 $('#layout-toggle').addEventListener('click',()=>{
  const wide=$('#app').classList.toggle('wide');$('#layout-toggle').textContent=wide?'⤡':'⤢';
  $('#layout-toggle').setAttribute('aria-label',wide?'Compact view':'Expand view');
 });
 $('#fullscreen-toggle').addEventListener('click',()=>safe(async()=>{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
  else msg('Full screen is not supported in this browser.');
 }));
 document.addEventListener('fullscreenchange',()=>{
  const on=!!document.fullscreenElement;
  $('#fullscreen-toggle').textContent=on?'⤡':'⛶';
  $('#fullscreen-toggle').setAttribute('aria-label',on?'Exit full screen':'Enter full screen');
 });
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
 if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{}),{once:true});
 nav();
 const fromHash=location.hash.startsWith('#thread=')?location.hash.slice(8):'';
 if(fromHash&&/^[0-9a-f-]{36}$/i.test(decodeURIComponent(fromHash)))safe(()=>loadThread(decodeURIComponent(fromHash)));
 else safe(()=>loadFeed(0));
}
setup();
