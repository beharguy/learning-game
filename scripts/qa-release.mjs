// Isolated release QA, mounted under the same subpath as GitHub Pages.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BANK,GAMES} from '../src/neighborhood/content.js';
import {KEY} from '../src/neighborhood/engine.js';
const root=path.resolve('dist'),prefix='/learning-game/',out='docs/screenshots/neighborhood';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix))throw Error();const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'));if(!file.startsWith(root+path.sep))throw Error();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,isMobile:true,serviceWorkers:'allow'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const parents=async()=>{await page.locator('[data-action="parents"]').click();await page.locator('#gate-answer').fill('12');await page.locator('[data-action="unlock-parents"]').click();};
try{
 await mkdir(out,{recursive:true});await page.goto(base);await page.locator('[data-action="enter"]').click();
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 for(const g of GAMES){
  await page.locator(`[data-game="${g.id}"]`).click();
  for(let i=0;i<6;i++){
   await page.locator('.answer:not(:disabled)').first().waitFor();
   const current=await state(),q=BANK[g.id].find(q=>q.id===current.active.id);
   assert.equal(current.active.round,i);
   await page.getByRole('button',{name:q.target,exact:true}).click();
   await page.locator('[data-action="next"]').click();
  }
  await page.locator('.finish-card').waitFor();assert.equal((await state()).stats[g.id].rounds,1);
  await page.locator('[data-action="again"]').click();await page.locator('.answers').waitFor();assert.equal((await state()).active.round,0);
  await page.locator('[data-action="home"]').click();
 }
 // Export/import restores stats; cancellation/reset have separate explicit actions.
 await parents();const dlPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const dl=await dlPromise;const backupPath=out+'/test-progress.json';await dl.saveAs(backupPath);const backup=JSON.parse(await readFile(backupPath,'utf8'));assert.equal(backup.stats.kitchen.correct,6);
 await page.locator('[data-action="reset-prompt"]').click();await page.locator('[data-action="reset-confirm"]').click();await page.locator('.start-button').waitFor();assert.deepEqual((await state()).stats,{});
 await parents();await page.locator('#import-file').setInputFiles(backupPath);await page.locator('[data-action="confirm-import"]').click();await page.locator('.neighbor').first().waitFor();assert.equal((await state()).stats.library.rounds,1);
 // Explicit successful puppet pose: appearance and selected actor follow the action.
 const dance=BANK.theater.find(q=>q.animation==='dance'&&q.actor==='f');
 await page.evaluate(({key,id})=>{const s=JSON.parse(localStorage.getItem(key));s.active={game:'theater',id,round:0,helped:false};localStorage.setItem(key,JSON.stringify(s));},{key:KEY,id:dance.id});
 await page.goto('about:blank');await page.goto(base+'#play/theater');await page.getByRole('button',{name:dance.target,exact:true}).click();
 assert.equal(await page.locator('.puppet.girl.acting.dance').count(),1);assert.equal(await page.locator('.puppet.boy.acting').count(),0);await page.screenshot({path:out+'/theater-success.png'});
 // The complete app, including images and narration, works from its own cache.
 const cached=await page.evaluate(async()=>{const keys=await caches.keys();const c=await caches.open(keys.find(k=>k.startsWith('hebrew-garden-')));return(await c.keys()).length;});assert.ok(cached>850);
 await context.setOffline(true);
 await page.goto(base+'#map');await page.reload();await page.locator('.neighbor').first().waitFor();
 for(const g of GAMES){await page.locator(`[data-game="${g.id}"]`).click();await page.locator('.answers').waitFor();assert.ok(await page.locator('.backdrop').evaluate(el=>el.complete&&el.naturalWidth>0));await page.locator('[data-action="home"]').click();}
 await page.locator('[data-action="repeat"]').click();await page.waitForFunction(()=>{const a=document.querySelector('audio');return a.currentTime>.2&&!a.error;},{timeout:15000});
 const audioResult=await page.evaluate(async()=>{const a=document.querySelector('audio'),r=await fetch(a.currentSrc,{headers:{Range:'bytes=0-99'}});return{status:r.status,bytes:(await r.arrayBuffer()).byteLength,mediaError:a.error?.code||null};});assert.equal(audioResult.status,206);assert.equal(audioResult.bytes,100);assert.equal(audioResult.mediaError,null);
 await page.screenshot({path:out+'/release-map.png'});
 await context.setOffline(false);await page.setViewportSize({width:800,height:1280});await page.goto(base+'#home');await page.screenshot({path:out+'/release-portrait-welcome.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/release-phone-welcome.png'});
 assert.deepEqual(errors,[]);
 const report={subpath:prefix,fullRounds:GAMES.length,replay:true,exportImport:true,reset:true,puppetActor:true,offlineGames:6,cachedAssets:cached,offlineAudio:audioResult,errors};
 await writeFile(out+'/release-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
