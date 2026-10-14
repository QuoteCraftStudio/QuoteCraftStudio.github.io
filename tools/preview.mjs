import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.');
let mock;
if(process.env.IDEA_HUB_MOCK==='1'){
 const {fixture}=await import('../tests/fixture.mjs');const {default:worker}=await import('../backend/worker.mjs');const f=fixture();f.env.SITE_ORIGIN='http://127.0.0.1:4173';globalThis.fetch=f.provider;mock={f,worker};
}
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{try{const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(mock&&raw.startsWith('/api/')){let content='';for await(const part of req)content+=part;const request=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers:{...req.headers,'CF-Connecting-IP':'192.0.2.200'},body:['GET','HEAD'].includes(req.method)?undefined:content});const response=await mock.worker.fetch(request,mock.f.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;}
 if(mock&&raw==='/idea-hub/config.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end("export const API = 'http://127.0.0.1:4173';");return;}
 let path=resolve(root,'.'+raw);if(path!==root&&!path.startsWith(root+sep))throw Error();if(raw.endsWith('/'))path=resolve(path,'index.html');const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/idea-hub/'+(mock?' (synthetic test accounts only)':'')));
