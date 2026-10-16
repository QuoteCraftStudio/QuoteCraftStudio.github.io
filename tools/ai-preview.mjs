// Isolated loopback-only model probe. No Firebase, D1, or production endpoints.
import {checkContentSafety} from '../backend/moderation.mjs';
export default {async fetch(request,env){
 if(request.method!=='POST')return new Response('POST synthetic text only',{status:405});
 const {text}=await request.json();
 if(typeof text!=='string'||text.length>600)return new Response('Invalid test',{status:400});
 try{await checkContentSafety(env,[text]);return Response.json({screen:'passed',published:false});}
 catch(e){return Response.json({screen:e.status===400?'rejected':'unavailable',published:false},{status:e.status||503});}
}};
