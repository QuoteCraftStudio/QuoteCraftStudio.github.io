import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export const origin='https://quotecraftstudio.github.io';
export function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../backend/schema.sql',import.meta.url),'utf8'));
 class Statement{
  constructor(sql,params=[]){this.sql=sql;this.params=params;}
  bind(...params){return new Statement(this.sql,params);}
  async first(){return db.prepare(this.sql).get(...this.params)||null;}
  async all(){return {results:db.prepare(this.sql).all(...this.params)};}
  async run(){const r=db.prepare(this.sql).run(...this.params);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
 }
 const DB={prepare:sql=>new Statement(sql),batch:async statements=>{db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const env={DB,SITE_ORIGIN:origin,FIREBASE_API_KEY:'synthetic-test-value',RATE_LIMIT_SALT:'test-only-secret-with-at-least-thirty-two-characters',ADMIN_UIDS:'admin'};
 const users={admin:{localId:'admin',emailVerified:true},alice:{localId:'alice',emailVerified:true},bob:{localId:'bob',emailVerified:true},unverified:{localId:'unverified',emailVerified:false},disabled:{localId:'disabled',emailVerified:true,disabled:true}};
 const calls=[];
 async function provider(url,options){if(!String(url).startsWith('https://identitytoolkit.googleapis.com/v1/accounts:'))throw Error('Unexpected outbound request in test');const action=String(url).split('accounts:')[1].split('?')[0],data=JSON.parse(options.body);calls.push({action,data});if(action==='lookup'){const user=users[data.idToken];return Response.json(user?{users:[user]}:{error:{message:'INVALID_ID_TOKEN'}},{status:user?200:400});}
 if(action==='signUp')return Response.json({idToken:'unverified',refreshToken:'should-not-leak',expiresIn:'3600'});
 if(action==='signInWithPassword')return Response.json({idToken:data.email.startsWith('admin')?'admin':data.email.startsWith('bob')?'bob':'alice',refreshToken:'should-not-leak',expiresIn:'3600'});
 if(action==='sendOobCode')return Response.json({email:'synthetic@example.test'});throw Error('Unexpected auth action');}
 return {db,env,users,provider,calls};
}
