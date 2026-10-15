import {readSnapshot} from './snapshot.js';
import {updateGuide} from './guide.js';
import {html} from './page.js';
export default {async fetch(request){
 const url=new URL(request.url);
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 if(url.pathname==='/api/notices')return Response.json(await readSnapshot(),{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 if(url.pathname==='/api/update-guide')return Response.json(updateGuide);
 if(url.pathname==='/health')return Response.json({ok:true});
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}})
}};
