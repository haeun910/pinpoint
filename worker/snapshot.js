import {seed,sources} from './data.js';
import {focusNotices} from './focus.js';
export const dataUrl='https://raw.githubusercontent.com/haeun910/pinpoint/refs/heads/1015/data/notices.json';
let lastGood;
export function normalizeSnapshot(snapshot){
 if(!snapshot||snapshot.version!==1||!Array.isArray(snapshot.items)||snapshot.items.length>2000||!Array.isArray(snapshot.sources)||!Array.isArray(snapshot.sourceDefinitions)||!Number.isFinite(Date.parse(snapshot.updatedAt)))throw Error('Invalid notice snapshot');
 const ids=new Set();
 for(const n of snapshot.items){
  const source=snapshot.sourceDefinitions.find(s=>s.id===n.source);
  if(!source||source.category!==n.category||!['채용','청약','청년 지원','공모전'].includes(n.category)||!n.id||ids.has(n.id))throw Error('Invalid notice source or duplicate ID');ids.add(n.id);
  for(const k of ['title','org','region','target','summary','checked'])if(typeof n[k]!=='string'||!n[k].trim())throw Error('Missing '+k);
  const u=new URL(n.url),origin=new URL(source.url);if(u.protocol!=='https:'||u.username||u.password||u.hostname.replace(/^www\./,'')!==origin.hostname.replace(/^www\./,''))throw Error('Invalid source URL');
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  if(!date(n.checked)||(n.end!==null&&!date(n.end))||!['detail','listing','search'].includes(n.verification)||!Array.isArray(n.tags)||n.tags.some(t=>typeof t!=='string'))throw Error('Invalid verification or date');
  if(n.recommendationNote!==undefined&&typeof n.recommendationNote!=='string'||n.recommendationChecks!==undefined&&(!Array.isArray(n.recommendationChecks)||n.recommendationChecks.some(t=>typeof t!=='string')))throw Error('Invalid recommendation');
 }
 return {...snapshot,items:focusNotices(snapshot.items),mode:'codex'};
}
export async function readSnapshot(){
 try{const r=await fetch(dataUrl+'?window='+Math.floor(Date.now()/60000),{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('Data unavailable');const body=await r.text();if(body.length>2097152)throw Error('Data too large');lastGood=normalizeSnapshot(JSON.parse(body));return {...lastGood,storageStatus:'live'}}
 catch{return lastGood?{...lastGood,storageStatus:'retained'}:{version:1,items:focusNotices(seed),updatedAt:null,mode:'codex',storageStatus:'fallback',sourceDefinitions:sources,sources:sources.map(s=>({source:s.id,status:seed.some(n=>n.source===s.id)?'retained':'not_checked',count:seed.filter(n=>n.source===s.id).length}))}}
}
