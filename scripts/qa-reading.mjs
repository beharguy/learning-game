// Dedicated isolated browser profile: never reads or resets Alma's progress.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {STORIES,newWords} from '../src/reading/content.js';
import {KEY,freshState} from '../src/neighborhood/engine.js';
const root=path.resolve('dist'),prefix='/learning-game/',out='docs/screenshots/reading';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix))throw Error();
 const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'));if(!file.startsWith(root+path.sep))throw Error();
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:800,height:1280},hasTouch:true,isMobile:true,serviceWorkers:'allow',reducedMotion:'reduce'});
await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key:KEY,state:{...freshState(),sound:false}});
const page=await context.newPage(),errors=[],failed=[],report={};
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const cursor=async id=>(await state()).reading.stories[id].cursor;
const click=async(action,extra='')=>page.locator(`[data-reading="${action}"]${extra}`).first().click();
const visibleStage=()=>page.locator('[data-stage]').getAttribute('data-stage');
async function settled(id){await page.waitForFunction(({key,id})=>document.querySelector('[data-stage]')?.dataset.stage===JSON.parse(localStorage.getItem(key)).reading.stories[id].cursor.stage,{key:KEY,id});}
try{
 await mkdir(out,{recursive:true});await page.goto(base+'#stories');await page.locator('.read-story-card').first().waitFor();
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:out+'/shelf-portrait.png'});
 await click('open','[data-story="dan"]');await page.locator('[data-stage="blend"]').waitFor();
 // A real audio request, first sound then the complete joined word.
 await click('blend');await page.waitForFunction(()=>document.querySelector('audio').currentSrc.endsWith('sound-da.mp3')&&document.querySelector('audio').currentTime>.05);
 assert.ok((await page.locator('.read-parts button').first().boundingBox()).x>(await page.locator('.read-parts button').last().boundingBox()).x,'RTL first sound must be on right');
 await page.waitForFunction(()=>document.querySelector('audio').currentSrc.endsWith('word-dan.mp3')&&document.querySelector('audio').currentTime>.05);
 assert.equal(await page.locator('.read-parts button.joined').count(),2);
 assert.equal(await page.locator('audio').evaluate(a=>a.playbackRate),.8);
 await page.screenshot({path:out+'/blend-portrait.png'});await click('stop');
 await click('next');await page.locator('[data-stage="word"]').waitFor();
 const before=await cursor('dan');await page.reload();await page.locator('[data-stage="word"]').waitFor();assert.deepEqual(await cursor('dan'),before);
 // Wrong choices stay playable; helpful retry never advances or deducts stars.
 const wrong=page.locator('[data-reading="answer"]:not([data-id="dan"])').first();await wrong.click();
 assert.deepEqual(await cursor('dan'),before);await click('stop');
 await page.locator('[data-reading="answer"][data-id="dan"]').click();
  assert.equal(await page.locator('[data-reading="hear-word"]').isEnabled(),false,'feedback cannot be interrupted into a stale question');
 await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).reading.stories.dan.cursor.word===1,KEY);
 await page.reload();await page.locator('[data-stage="blend"]').waitFor();assert.equal((await cursor('dan')).word,1,'reload during feedback retains completed word');
 await click('pause');await page.getByRole('dialog').waitFor();
 const paused=await cursor('dan');await page.reload();await page.locator('[data-stage="blend"]').waitFor();assert.deepEqual(await cursor('dan'),paused);
 // Complete both authored journeys through the public touch controls.
 for(const story of STORIES){
  await page.goto(base+'#read/'+story.id);await page.locator('[data-stage]').waitFor();let steps=0;
  while(await visibleStage()!=='done'){
   const c=await cursor(story.id),stage=await visibleStage();
   if(stage==='blend')await click('next');
   else if(stage==='word'){
    await click('answer',`[data-id="${newWords(story,c.line)[c.word]}"]`);
    await page.waitForFunction(({key,id,old})=>JSON.stringify(JSON.parse(localStorage.getItem(key)).reading.stories[id].cursor)!==old,{key:KEY,id:story.id,old:JSON.stringify(c)});
    await settled(story.id);
   }else if(stage==='line'){
    if(story.id==='dan'&&c.line===3){
     await page.screenshot({path:out+'/line-portrait.png'});
     await click('word-help','[data-id="khasa"]');await page.getByRole('dialog').waitFor();
     await click('help-blend');await page.waitForFunction(()=>document.querySelector('audio').currentTime>.1&&!document.querySelector('audio').paused);
     await page.getByRole('button',{name:'חזרה לשורה',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.locator('audio').evaluate(a=>a.paused),true);
     assert.deepEqual(await cursor(story.id),c);
     await click('hear-line');await page.waitForFunction(()=>!!document.querySelector('.read-token.reading-now'));
     await page.screenshot({path:out+'/line-highlight.png'});await click('stop');
    }
    await click('next');
   }else if(stage==='story'){
    assert.equal(await page.locator('.read-story-row').count(),6);
    if(story.id==='ran')assert.equal(await page.locator('.read-full-story .rebus').count(),3);
    await page.screenshot({path:out+'/'+story.id+'-whole-story.png'});
    await click('next');
   }else assert.fail(stage);
   if(++steps>65)assert.fail('journey did not end');
  }
  assert.equal((await state()).reading.stories[story.id].completed,true);
  assert.deepEqual((await state()).reading.stories[story.id].lines,[0,1,2,3,4,5]);
  report[story.id]={steps,completed:true};
 }
 // Completion survives review, switching stories, rotation and reload.
 await click('whole');await click('line','[data-line="2"]');
 const remembered=await cursor('ran');await click('shelf');await click('open','[data-story="dan"]');
 await click('shelf');await click('open','[data-story="ran"]');assert.deepEqual(await cursor('ran'),remembered);
 for(const [width,height] of [[1280,800],[800,1280],[390,844],[1024,768],[650,664]]){
  await page.setViewportSize({width,height});await page.reload();await page.locator('[data-stage]').waitFor();
  assert.deepEqual(await cursor('ran'),remembered);
  assert.equal(await page.locator('.reading-app').evaluate(el=>el.scrollWidth<=el.clientWidth),true,`${width} overflow`);
  for(const selector of ['[data-reading="blend"]','[data-reading="next"]']){
   const box=await page.locator(selector).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.height>=44,selector+' outside viewport');
  }
  await page.screenshot({path:out+`/blend-${width}x${height}.png`});
  await click('whole');await page.screenshot({path:out+`/story-${width}x${height}.png`});
  await click('line','[data-line="2"]');
 }
 await page.setViewportSize({width:800,height:1280});
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await page.locator('[data-stage="blend"]').waitFor();
 await page.evaluate(()=>{
  window.readingClips=[];const a=document.querySelector('audio');
  a.addEventListener('loadedmetadata',()=>{a.playbackRate=4;});
  a.addEventListener('playing',()=>window.readingClips.push(a.currentSrc.split('/').at(-1)));
 });
 await click('whole');await click('hear-story');await page.waitForFunction(()=>document.querySelector('audio').currentTime>.15&&!document.querySelector('audio').error);
 assert.ok(await page.locator('.read-cover').evaluate(el=>getComputedStyle(el).backgroundImage.includes('reading-stories.webp')));
 const range=await page.evaluate(async()=>{const r=await fetch(document.querySelector('audio').currentSrc,{headers:{Range:'bytes=0-99'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength};});
 assert.deepEqual(range,{status:206,bytes:100});
 await page.waitForFunction(()=>{const a=document.querySelector('audio');return a.currentSrc.endsWith('line-ran-5.mp3')&&a.ended;},null,{timeout:30000});
 assert.deepEqual(await page.evaluate(()=>[...new Set(window.readingClips)]),STORIES[1].lines.map((_,i)=>`line-ran-${i}.mp3`),'full story must narrate all six lines in order');
 // Stopping and leaving cannot let an older queue start the next line.
 await click('hear-story');await page.waitForFunction(()=>document.querySelector('audio').currentTime>.15&&!document.querySelector('audio').paused);
 await click('stop');const stopped=await page.locator('audio').evaluate(a=>a.currentSrc);
 await page.waitForTimeout(700);assert.equal(await page.locator('audio').evaluate(a=>a.paused),true);assert.equal(await page.locator('audio').evaluate(a=>a.currentSrc),stopped);
 await click('shelf');await click('map');await page.locator('.neighbor').first().waitFor();
 await page.locator('[data-action="stories"]').click();await page.locator('.read-story-card').first().waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 report.viewports=5;report.resume=true;report.wordHelp=true;report.actualHighlight=true;report.offline=true;report.range=range;report.errors=errors;
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}
