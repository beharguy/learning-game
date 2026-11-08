// Keep the pre-narration-update app open while a new worker takes control.
// This reproduces the tablet's stale-page + retired-audio-URL failure.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BANK,GAMES,SAY} from '../src/neighborhood/content.js';
import {KEY,freshState,instruction,helpSpeech} from '../src/neighborhood/engine.js';
import {audioKey} from '../src/narration.js';

const revision='2921db392cf98669a2cd3e79105632f1f76f55a9';
await mkdir('.cache',{recursive:true});
const fixture=await mkdtemp(path.resolve('.cache/audio-update-'));
const archive=execFileSync('git',['archive',revision],{maxBuffer:100*1024*1024});
execFileSync('tar',['-xf','-','-C',fixture],{input:archive});
execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixture});
const oldContent=await import(pathToFileURL(path.join(fixture,'src/neighborhood/content.js')));
const oldEngine=await import(pathToFileURL(path.join(fixture,'src/neighborhood/engine.js')));
const current=path.resolve('dist'),prefix='/learning-game/';
let root=path.join(fixture,'dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix))throw Error();
  const relative=decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'),file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep))throw Error();
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':relative==='sw.js'?'no-cache':'max-age=600'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,isMobile:true});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const saved=freshState();saved.stats.kitchen={correct:3,independent:2,helped:1,rounds:0};
await page.addInitScript(({key,saved})=>{
 if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(saved));
 window.__heard=[];window.__audioErrors=[];
 document.addEventListener('timeupdate',event=>{
  const a=event.target;
  if(a instanceof HTMLMediaElement&&a.currentTime>.1&&!a.error){
   const id=a.currentSrc.split('/').pop().replace('.mp3','');
   if(!window.__heard.includes(id))window.__heard.push(id);
  }
 },true);
 document.addEventListener('error',event=>{
  if(event.target instanceof HTMLMediaElement)window.__audioErrors.push({url:event.target.currentSrc,code:event.target.error?.code});
 },true);
},{key:KEY,saved});
const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
async function heard(texts,action){
 const ids=texts.filter(Boolean).map(audioKey);
 await page.evaluate(()=>{window.__heard=[];});
 if(action)await action();
 await page.waitForFunction(ids=>ids.every(id=>window.__heard.includes(id)),ids,{timeout:35000});
 assert.deepEqual(await page.evaluate(()=>window.__audioErrors),[]);
 return ids;
}
async function checkGames(content,engine,{assistance=false}={}){
 const result=[];
 for(const game of GAMES){
  await page.evaluate(()=>{window.__heard=[];});
  await page.locator(`[data-game="${game.id}"]`).click();
  await page.locator('.answers').waitFor();
  const active=(await state()).active;
  const task=content.BANK[game.id].find(q=>q.id===active.id);
  const automatic=engine.instruction(task).map(audioKey);
  await page.waitForFunction(ids=>ids.every(id=>window.__heard.includes(id)),automatic,{timeout:35000});
  const repeat=await heard(engine.instruction(task),()=>page.locator('[data-action="repeat"]').click());
  let help=[];
  if(assistance){
   const choices=await page.locator('.answer').evaluateAll(buttons=>buttons.map(button=>({text:button.getAttribute('aria-label')})));
   help=await heard(engine.helpSpeech({...task,choices}),()=>page.locator('[data-action="help"]').click());
  }
  if(game.id==='kitchen'){
   await heard([content.SAY.correct,task.word,game.reward],()=>page.getByRole('button',{name:task.target,exact:true}).click());
   await page.locator('[data-action="next"]').click();
   const next=(await state()).active;
   assert.equal(next.round,active.round+1);
   await heard(engine.instruction(content.BANK.kitchen.find(q=>q.id===next.id)),()=>page.locator('[data-action="repeat"]').click());
  }
  result.push({game:game.id,automatic,repeat,help});
  await page.locator('[data-action="home"]').click();
  console.log(`${assistance?'current':'open old page'}: ${game.id} audio played`);
 }
 return result;
}
try{
 await page.goto(base+'#map');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 assert.ok((await page.locator('.map-invitation').innerText()).includes('בַּחֲרִי'));
 const before=(await state()).stats.kitchen;
 root=current;
 // Wait for claim, not merely cache deletion: activation has an async gap.
 await page.evaluate(async()=>{
  const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  const reg=await navigator.serviceWorker.getRegistration();await reg.update();await changed;
 });
 assert.deepEqual((await state()).stats.kitchen,before);
 assert.ok((await page.locator('.map-invitation').innerText()).includes('בַּחֲרִי'),'old JS must remain loaded');
 await context.setOffline(true);
 const aliases=JSON.parse(await readFile('public/audio-aliases.json','utf8'));
 const aliasResults=await page.evaluate(async aliases=>{
  const results=[];
  for(const [previous,current] of Object.entries(aliases)){
   const a=await fetch(`./audio/${previous}.mp3`),b=await fetch(`./audio/${current}.mp3`);
   const x=new Uint8Array(await a.arrayBuffer()),y=new Uint8Array(await b.arrayBuffer());
   results.push({previous,ok:a.ok&&b.ok&&x.length===y.length&&x.every((v,i)=>v===y[i])});
  }
  return results;
 },aliases);
 assert.ok(aliasResults.every(r=>r.ok),'every retired URL must serve the corrected bytes offline');
 const oldGames=await checkGames(oldContent,oldEngine);
 assert.equal((await state()).stats.kitchen.correct,before.correct+1);
 const range=await page.evaluate(async()=>{const r=await fetch('./audio/2ef609b5.mp3',{headers:{Range:'bytes=0-99'}});return{status:r.status,bytes:(await r.arrayBuffer()).byteLength};});
 assert.deepEqual(range,{status:206,bytes:100});
 await page.reload();
 assert.ok((await page.locator('.map-invitation').innerText()).includes('לְחִיצָה'));
 assert.equal((await state()).stats.kitchen.correct,before.correct+1);
 const currentGames=await checkGames({BANK,SAY},{instruction,helpSpeech},{assistance:true});
 assert.deepEqual(await page.evaluate(()=>window.__audioErrors),[]);assert.deepEqual(errors,[]);
 const report={upgradeFrom:revision,retiredAudioURLs:aliasResults.length,progressPreserved:true,offline:true,oldGames,currentGames,range,errors};
 await mkdir('docs/screenshots/neighborhood',{recursive:true});
 await writeFile('docs/screenshots/neighborhood/audio-update-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{
 await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));await rm(fixture,{recursive:true,force:true});
}
