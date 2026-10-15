import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {seed,sources} from '../worker/data.js';
import {focusNotices} from '../worker/focus.js';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
let html=await readFile('web/index.html','utf8');const css=await readFile('web/style.css','utf8');const app=await readFile('web/app.js','utf8');const ranking=(await readFile('worker/recommend.js','utf8')).replace(/^import .*;\n/gm,'').replaceAll('export function','function');const rules=(await readFile('worker/focus.js','utf8')).match(/export const focusRules = ([\s\S]*?);/)[1];html=html.replace('/*STYLE*/',()=>css).replace('/*APP*/',()=>`const INITIAL_DATA=${JSON.stringify(focusNotices(seed))};const SOURCES=${JSON.stringify(sources)};const focusRules=${rules};\n${ranking}\n${app}`);
await writeFile('worker/page.js','export const html = '+JSON.stringify(html)+';\n');
const modules=[];
for(const name of ['data','focus','store','guide','mcp']){
 const source=await readFile('worker/'+name+'.js','utf8');
 modules.push(source.replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export async function','async function').replaceAll('export function','function'));
}
const entry=(await readFile('worker/index.js','utf8')).replace(/^import .*;\n/gm,'');
await writeFile('dist/server/index.js',modules.join('\n')+'\nconst html='+JSON.stringify(html)+';\n'+entry);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built Pinpoint with Codex update tools and persistent snapshot storage.');
