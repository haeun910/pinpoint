import {sources,seed} from './data.js';
import {collect} from './collect.js';
import {focusNotices} from './focus.js';
import {html} from './page.js';
let cache;
export async function getNotices(){if(cache&&Date.now()-cache.time<300000)return cache.data;const results=await Promise.all(sources.map(collect));const items=new Map(focusNotices(seed).map(n=>[n.id,n]));for(const r of results)for(const n of focusNotices(r.items)){if(!items.has(n.id))items.set(n.id,n)}const data={items:[...items.values()],sources:results.map(({items,...s})=>({...s,matchedCount:focusNotices(items).length}))};if(results.some(r=>r.ok))cache={time:Date.now(),data};return data}
export default {async fetch(request){const url=new URL(request.url);if(request.method!=='GET')return new Response('Method not allowed',{status:405});if(url.pathname==='/api/notices')return Response.json(await getNotices(),{headers:{'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}});if(url.pathname==='/health')return Response.json({ok:true});if(url.pathname!=='/')return new Response('Not found',{status:404});return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}})}};
