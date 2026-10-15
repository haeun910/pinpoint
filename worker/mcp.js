import {readSnapshot,updateSnapshot} from './store.js';
import {sources} from './data.js';
import {updateGuide} from './guide.js';
export async function mcp(request,env){
 let rpc;try{const text=await request.text();if(text.length>1048576)return Response.json({error:'Payload too large'},{status:413});rpc=JSON.parse(text)}catch{return Response.json({error:'Invalid JSON'},{status:400})}
 let result;
 try{switch(rpc.method){
 case 'server/discover':result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};break;
 case 'initialize':result={protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'pinpoint-updates',version:'1.0.0'}};break;
 case 'notifications/initialized':return new Response(null,{status:202});
 case 'tools/list':result={tools:[{name:'get_notices',description:'Read Pinpoint notices, source links, revision and Codex update instructions.',inputSchema:{type:'object',properties:{},additionalProperties:false}},{name:'upsert_notices',description:'Save verified IT/AI notices and unrestricted housing notices. Preserves existing notices, checks source links and revision. Owner-private Site only.',inputSchema:{type:'object',required:['revision','items','checkedSources'],properties:{revision:{type:['string','null']},items:{type:'array',minItems:1,maxItems:200,items:{type:'object',required:['id','source','category','org','title','region','target','end','url','summary','tags','checked','verification'],properties:{recommendationNote:{type:'string',maxLength:600},recommendationChecks:{type:'array',maxItems:6,items:{type:'string',maxLength:300}},roleEvidence:{type:'string',maxLength:1000},id:{type:'string'},source:{type:'string'},category:{enum:['채용','청약','청년 지원','공모전']},org:{type:'string'},title:{type:'string'},region:{type:'string'},target:{type:'string'},end:{type:['string','null']},url:{type:'string'},summary:{type:'string'},tags:{type:'array',items:{type:'string'}},checked:{type:'string'},verification:{enum:['detail','listing','search']}}}},checkedSources:{type:'array',items:{type:'string'}}},additionalProperties:false}}]};break;
 case 'tools/call':{let data;if(rpc.params?.name==='get_notices')data={...await readSnapshot(env),sourceDefinitions:sources,updateGuide};else if(rpc.params?.name==='upsert_notices')data=await updateSnapshot(env,rpc.params.arguments);else throw Error('Unknown tool');result={content:[{type:'text',text:JSON.stringify(data)}]};break;}
 default:return Response.json({jsonrpc:'2.0',id:rpc.id,error:{code:-32601,message:'Method not found'}})
 }}catch(e){result={isError:true,content:[{type:'text',text:e.message}]}}
 return Response.json({jsonrpc:'2.0',id:rpc.id??null,result});
}
