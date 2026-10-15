import {seed,sources} from './data.js';
import {focusNotices} from './focus.js';
export const snapshotKey='pinpoint/notices-v1.json';
export async function readSnapshot(env={}){
 const obj=env.BUCKET?await env.BUCKET.get(snapshotKey):null;
 if(obj)return {...await obj.json(),revision:obj.etag};
 return {items:focusNotices(seed),updatedAt:null,revision:null,mode:'codex',sources:sources.map(s=>({source:s.id,status:seed.some(n=>n.source===s.id)?'retained':'not_checked',count:seed.filter(n=>n.source===s.id).length}))};
}
function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v}
export function validateUpdate(body){
 if(!body||!Array.isArray(body.items)||!body.items.length||body.items.length>200)throw Error('items must contain 1–200 notices');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());const ids=new Set();
 const items=body.items.map(n=>{
  for(const k of ['id','source','category','org','title','region','target','url','summary','checked'])if(typeof n[k]!=='string'||!n[k].trim()||n[k].length>(k==='summary'?2000:600))throw Error('Invalid notice '+k);
  if(!/^[a-zA-Z0-9_-]+$/.test(n.id)||ids.has(n.id))throw Error('Invalid or duplicate notice ID');ids.add(n.id);
  if(!sources.some(s=>s.id===n.source))throw Error('Unknown source');
  const url=new URL(n.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('HTTPS source URL required');
  const source=sources.find(s=>s.id===n.source);if(n.category!==source.category)throw Error('Source category mismatch');if(url.hostname.replace(/^www\./,'')!==new URL(source.url).hostname.replace(/^www\./,''))throw Error('Source URL does not match source');
  if(!validDate(n.checked)||n.checked>today||n.end!==null&&!validDate(n.end))throw Error('Invalid verification or deadline date');
  if(!['detail','listing','search'].includes(n.verification))throw Error('Verification level required');
  if(!Array.isArray(n.tags)||n.tags.length>10||n.tags.some(t=>typeof t!=='string'||t.length>60))throw Error('Invalid tags');
  if(n.roleEvidence!==undefined&&(typeof n.roleEvidence!=='string'||n.roleEvidence.length>1000))throw Error('Invalid role evidence');
  if(n.recommendationNote!==undefined&&(typeof n.recommendationNote!=='string'||n.recommendationNote.length>600))throw Error('Invalid recommendation note');
  if(n.recommendationChecks!==undefined&&(!Array.isArray(n.recommendationChecks)||n.recommendationChecks.length>6||n.recommendationChecks.some(c=>typeof c!=='string'||c.length>300)))throw Error('Invalid recommendation checks');
  const notice=focusNotices([{recommendationNote:n.recommendationNote||'',recommendationChecks:n.recommendationChecks||[],roleEvidence:n.roleEvidence||'',id:n.id,source:n.source,category:n.category,org:n.org,title:n.title,region:n.region,target:n.target,end:n.end,url:url.href,summary:n.summary,tags:n.tags,checked:n.checked,verification:n.verification}])[0];
  if(!notice)throw Error('Notice is outside IT/AI scope');return notice;
 });
 if(!Array.isArray(body.checkedSources)||body.checkedSources.length>sources.length||body.checkedSources.some(s=>!sources.some(x=>x.id===s)))throw Error('Invalid checkedSources');
 return {items,checkedSources:[...new Set(body.checkedSources)]};
}
export async function updateSnapshot(env,body){
 if(!env?.BUCKET)throw Error('Persistent storage unavailable');
 const update=validateUpdate(body);const previous=await readSnapshot(env);
 if(body.revision!==previous.revision){const error=Error('Snapshot changed; read again before retrying');error.status=409;throw error}
 const notices=new Map(previous.items.map(n=>[n.id,n]));
 for(const n of update.items){const old=notices.get(n.id);if(old?.checked>n.checked)throw Error('Cannot overwrite newer verification');notices.set(n.id,n)}
 const updatedAt=new Date().toISOString();const items=[...notices.values()];
 const state={items,updatedAt,mode:'codex',sources:sources.map(s=>{const old=previous.sources.find(x=>x.source===s.id);return {source:s.id,status:update.checkedSources.includes(s.id)?'checked':old?.status||'not_checked',checked:update.checkedSources.includes(s.id)?updatedAt:old?.checked||null,count:items.filter(n=>n.source===s.id).length}})};
 const options={httpMetadata:{contentType:'application/json'},onlyIf:previous.revision?{etagMatches:previous.revision}:{etagDoesNotMatch:'*'}};
 const result=await env.BUCKET.put(snapshotKey,JSON.stringify(state),options);
 if(!result){const error=Error('Snapshot changed; read again before retrying');error.status=409;throw error}
 return {ok:true,upserted:update.items.length,total:items.length,updatedAt,revision:result.etag};
}
