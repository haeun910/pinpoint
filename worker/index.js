import {readSnapshot,updateSnapshot} from './store.js';
import {mcp} from './mcp.js';
import {updateGuide} from './guide.js';
import {html} from './page.js';
export default {async fetch(request,env={}){
 const url=new URL(request.url);
 if(request.method==='POST'&&request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin)return Response.json({error:'Origin not allowed'},{status:403});
 // Sites dispatch authenticates this owner-private Site, including service callers.
 if(request.method==='POST'&&url.pathname==='/mcp')return mcp(request,env);
 if(url.pathname==='/api/updates'&&request.method==='POST'){
  if(request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin)return Response.json({error:'Origin not allowed'},{status:403});
  if(Number(request.headers.get('Content-Length')||0)>1048576)return Response.json({error:'Payload too large'},{status:413});
  try{const text=await request.text();if(text.length>1048576)return Response.json({error:'Payload too large'},{status:413});return Response.json(await updateSnapshot(env,JSON.parse(text)),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:e.message},{status:e.status||400})}
 }
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 if(url.pathname==='/api/notices')return Response.json(await readSnapshot(env),{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 if(url.pathname==='/api/update-guide')return Response.json(updateGuide);
 if(url.pathname==='/health')return Response.json({ok:true,storage:!!env.BUCKET});
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}})
}};
