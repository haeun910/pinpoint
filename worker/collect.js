export function clean(s=''){return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
export function parse(html,source){
 const results = new Map();
 for(const a of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
  const href=a[1].match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
  if(!href||!href.includes(source.match)) continue;
  let url;try{url=new URL(href.replace(/&amp;/g,'&'),source.url)}catch{continue}
  if(url.origin!==new URL(source.url).origin)continue;
  const key=source.match.startsWith('/')?url.pathname.split(source.match)[1]?.split('/')[0]:url.searchParams.get(source.match.slice(0,-1));if(!key)continue;
  const text=clean(a[2]);if(text.length<8||text.length>600||/개인정보|이용약관/.test(text))continue;
  const title=text.slice(0,180);const region=['서울','경기','부산','대전','대구','인천','광주','울산','세종','제주','강원','충북','충남','전북','전남','경북','경남'].find(r=>title.includes(r))||'원문 확인';
  results.set(key,{id:source.id+'-'+key,source:source.id,category:source.category,org:source.org,title,region,target:'원문 자격 확인',end:null,url:url.href,summary:'공개 공고 목록에서 수집했습니다. 접수 기간과 지원 자격은 원문에서 확인하세요.',tags:['목록 수집','일정 확인 필요'],checked:new Date().toISOString().slice(0,10)});
 }
 return [...results.values()].slice(0,40);
}
export async function collect(source){
 try{const r=await fetch(source.url,{headers:{'User-Agent':'Pinpoint/1.0 (+public notice index)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('HTTP '+r.status);const items=parse(await r.text(),source);if(!items.length)throw Error('공고 구조 확인 필요');return {source:source.id,ok:true,count:items.length,checked:new Date().toISOString(),items};}
 catch(e){return {source:source.id,ok:false,count:0,message:String(e.message).slice(0,100),items:[]};}
}
