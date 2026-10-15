import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {seed,sources} from '../worker/data.js';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
let html=await readFile('web/index.html','utf8');const css=await readFile('web/style.css','utf8');const app=await readFile('web/app.js','utf8');html=html.replace('/*STYLE*/',()=>css).replace('/*APP*/',()=>`const INITIAL_DATA=${JSON.stringify(seed)};const SOURCES=${JSON.stringify(sources)};\n${app}`);
await writeFile('worker/page.js','export const html = '+JSON.stringify(html)+';\n');
let data=(await readFile('worker/data.js','utf8')).replaceAll('export const','const');let collect=(await readFile('worker/collect.js','utf8')).replaceAll('export function','function').replaceAll('export async function','async function');let entry=(await readFile('worker/index.js','utf8')).replace(/^import .*;\n/gm,'');await writeFile('dist/server/index.js',data+'\n'+collect+'\nexport const html='+JSON.stringify(html)+';\n'+entry);await copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built Pinpoint Worker with embedded UI and public notice collectors.');
